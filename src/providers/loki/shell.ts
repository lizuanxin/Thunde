import {Subject} from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';

import {TypeInfo, Exception, EAbort} from '../../UltraCreation/Core';
import {TUtf8Encoding} from '../../UltraCreation/Encoding/Utf8';

import {TAbstractShell, TShellRequest} from '../../UltraCreation/Native/Abstract.Shell'
import * as BLE from '../../UltraCreation/Native/BluetoothLE';
import * as BLE_Shell from '../../UltraCreation/Native/BluetoothLE.Shell';

import {USBSerial} from '../../UltraCreation/Native';

import {THashCrc16} from '../../UltraCreation/Hash';
import {Timer} from '../../UltraCreation/Core/Timer';

const REQUEST_TIMEOUT = 3000;

const BLE_FILTER_NAMES: string[] = ['thunderbolt', 'miniq'];
const BLE_SCAN_TIMEOUT = 60000;
const BLE_CONNECTION_TIMEOUT = 5000;

const FILE_CLEAR_EXCLUDES = ['DefaultFile', 'BLE_Name'];
const FILE_CLEAR_SIZE_LESS_THAN = 6400;
const FILE_CLEAR_MAX_COUNT = 64;

const USB_VENDOR = 0x10C4;
const USB_PRODUCT = 0x0003;

export enum TShellNotify
    {Shutdown, Disconnected, NoLoad, Stopped, Intensity, HardwareError, LowBattery, Battery, Ticking};
export type TShellNotifyEvent = Subject<TShellNotify>;

export class EShellExecution extends Exception
    {}

export class TShell
{
    /// @override
    static Get(DeviceId: string): TShell
    {
        if (DeviceId === 'USB')
        {
            return new this(this.UsbProxy);
        }
        else
        {
            let Proxy = TProxyBLEShell.Get(DeviceId, BLE_CONNECTION_TIMEOUT) as TProxyBLEShell;
            return new this(Proxy);
        }
    }

    constructor (private Proxy: IProxyShell)
    {
        Proxy.Owner = this;
    }

/* USB only */
    static StartOTG()
    {
        this.UsbProxy = new TProxyUsbShell();

        USBSerial.OTG.Start(USB_VENDOR, USB_PRODUCT).subscribe(
            next => {},
            err => console.log(err.message));
    }

    static get IsUsbPlugin(): boolean
    {
        return TypeInfo.Assigned(this.UsbProxy) && this.UsbProxy.IsAttached;
    }

/** BLE only */
    static get FakeDevice(): boolean
    {
        return BLE.TGatt.BrowserFakeDevice;
    }

    static StartScan(): Subject<Array<BLE.IScanDiscovery>>
    {
        // BLE.TGatt.BrowserFakeDevice = true;
        return BLE.TGattScaner.Start([], this.ScanFilter, BLE_SCAN_TIMEOUT);
    }

    static StopScan(): Promise<void>
    {
        return BLE.TGattScaner.Stop();
    }

    private static ScanFilter(Device: BLE.IScanDiscovery): boolean
    {
        let adv = Device.advertising;
        let name: string = null;

        if (! TypeInfo.Assigned(Device.name))
            return false;

        let view = BLE.TGatt.GetManufactoryData(adv);
        if (TypeInfo.Assigned(view))
        {
            if (view.byteLength > 6)
            {
                let idx = 5;
                for (; idx < view.byteLength; idx++)
                {
                    if (view[idx] === 0)
                        break;
                }

                view = new Uint8Array(view.buffer, view.byteOffset + 6, idx - 6);
                name = TUtf8Encoding.Instance.Decode(view).toLowerCase();
            }
            else
                name = Device.name.toLowerCase();
        }
        else
            name = Device.name.toLowerCase();

        if (name.length > 4)
        {
            if (BLE_FILTER_NAMES.indexOf(name.substring(name.length - 4, name.length)) !== -1)
                return true;
        }

        return BLE_FILTER_NAMES.indexOf(name) !== -1;
    }

/** shell functions */
    Shutdown(): Promise<void>
    {
        return this.Execute('>shdn', 500).catch(err => console.log('shutdown :' + err.message));
    }

    Reset()
    {
        return this.Execute('>rst', 10, Line => true).catch(err => {});
    }

    FileMd5(FileName: string): Promise<string>
    {
        return this.Execute('>md5 ' + FileName, REQUEST_TIMEOUT, Line => {return true});
    }

    SetBluetoothName(Name: string): Promise<boolean>
    {
        return this.Execute('>btnm ' + Name, REQUEST_TIMEOUT, Line => Line.includes('AT+NAME') || Line.includes('btnm='))
            .then(Line => Line.replace('AT+NAME', '').replace('btnm=', ''));
    }

    SetDefaultFile(FileName: string, Idx: number = 0): Promise<string>
    {
        let Cmd: string = '>sdef ' + FileName;
        if (Idx !== 0)
            Cmd = Cmd + FileName + '=' + Idx;

        return this.Execute(Cmd, REQUEST_TIMEOUT, Line =>
        {
            let strs = Line.split('=');
            return strs.length >= 1 && strs[0] === 'sdef';
        });
    }

    ListDefaultFile(): Promise<Array<string>>
    {
        return this.RequestStart(TListDefaultFile, REQUEST_TIMEOUT)
            .then(Request => Request.toPromise() as Promise<Array<string>>);
    }

    StartScriptFile(FileName: string): Promise<string>
    {
        return this.Execute('>ssta ' + FileName, REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line))
            .then(() => setTimeout(() => this.IntensityRequest().catch(err => {}), 300))
            .then(() => this.StartTicking());
    }

    StartOutput()
    {
        return this.Execute('>osta', REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line))
            .then(() => setTimeout(() => this.IntensityRequest().catch(err => {}), 300))
            .then(() => this.StartTicking());
    }

    StopOutput()
    {
        return this.Execute('>osto', REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line))
            .then(() => this.StopTicking());
    }

    CatFile(FileName: string, FileBuffer: Uint8Array, Md5: string): Promise<Subject<number>>
    {
        return this.RequestStart(TCatRequest, REQUEST_TIMEOUT, FileName, FileBuffer, Md5);
    }

    RemoveFile(FileName: string): Promise<void>
    {
        return this.Execute('>rm ' + FileName, REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line));
    }

    FormatFileSystem(): Promise<void>
    {
        return this.Execute('>fmt BBFS', REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line));
    }

    ClearFileSystem(ExcludeFiles: string[]): Promise<void>
    {
        return this.ListDefaultFile()
            .then(Files =>
            {
                for (let f of Files)
                {
                    if (f.indexOf('test_', 0) === -1)
                        ExcludeFiles.push(f);
                }

                return this.RequestStart(TClearFileSystemRequest, REQUEST_TIMEOUT, ExcludeFiles);
            })
            .then(Request => Request.toPromise())
            .then(() => {});
    }

    SetIntensity(Value: number): Promise<number>
    {
        if (this._Intensity === 0 || Value < 1 || Value > 60)
            return Promise.resolve(this._Intensity);

        let strs: string[];

        return this.Execute('>str ' + Value, REQUEST_TIMEOUT,
            Line =>
            {
                strs = Line.split('=');
                return strs.length === 2 && strs[0] === 'str';
            })
            .then(Line =>
            {
                this._Intensity = parseInt(strs[1]);
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity), 0);
                return this._Intensity;
            });
    }

    OTARequest(Firmware: ArrayBuffer): Promise<TShellRequest>
    {
        //return null;
        return this.RequestStart(TOTARequest, REQUEST_TIMEOUT, Firmware);
    }

    get Ticking(): number
    {
        if (this._Ticking !== 0)
        {
            let dt = new Date()
            return Math.trunc((dt.getTime() -  this._Ticking) / 1000);
        }
        else
            return 0;
    }

    get Version(): number
    {
        return this._Version;
    }

    get Intensity(): number
    {
        return this._Intensity;
    }

    set Intensity(Value: number)
    {
        this.SetIntensity(Value).catch(err => console.log('set Intensity() ' + err.message));
    }

    get BatteryLevel(): number
    {
        return this._BatteryLevel;
    }

    private StatusRequest(): Promise<void>
    {
        return this.Execute('>stat', REQUEST_TIMEOUT, Line => (Line.indexOf('tick', 0) !== -1 || Line.indexOf('md5', 0) !== -1))
            .then(Line =>
            {
                let strs = Line.split(",");
                for (let str of strs)
                {
                    let keyvalue = str.split("=");
                    if (keyvalue.length > 1)
                    {
                        switch(keyvalue[0])
                        {
                        case "tick":
                            this._Ticking = parseInt(keyvalue[1]);
                            if (this._Ticking !== 0)
                                this.StartTicking();
                            break;

                        case "dmd5":
                            this._DefaultFileMd5 = keyvalue[1];
                            break;

                        case "lmd5":
                            this._LastFileMd5 = keyvalue[1];
                            break;

                        case "str":
                            this._Intensity = parseInt(keyvalue[1]);
                            break;
                        }
                    }
                }
            })
            .catch(err => console.log(err.message));
    }

    private BatteryRequest(): Promise<number>
    {
        let strs: string[];

        return this.Execute('>bat', REQUEST_TIMEOUT,
            Line =>
            {
                console.log(Line);

                strs = Line.split(':');
                if (strs.length > 1 && strs[0] === '32769')
                {
                    strs[0] = '5000';
                    return true;
                }

                strs = Line.split(' ');
                return strs.length === 2 && strs[1] === 'mv';
            })
            .then(Line =>
            {
                this._BatteryLevel = parseInt(strs[0]);
                setTimeout(() => this.OnNotify.next(TShellNotify.Battery), 0);
                return this._BatteryLevel;
            })
    }

    private IntensityRequest(): Promise<number>
    {
        let dt = new Date();
        let strs: string[];

        if (dt.getTime() - this.IntensityInterval < 500)
            return Promise.resolve(this.Intensity);

        return this.Execute('>str', REQUEST_TIMEOUT,
            Line =>
            {
                strs = Line.split('=');
                return strs.length > 1 && strs[0] === 'str';
            })
            .then(Line =>
            {
                this._Intensity = parseInt(strs[1]);
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity), 0);
                return this._Intensity;
            })
    }

    VersionRequest(): Promise<number>
    {
        return this.Execute('>ver', REQUEST_TIMEOUT, Line => Line.indexOf('v.', 0) !== -1 || Line.indexOf('ver', 0) !== -1)
            .then(Line =>
            {
                let keyvalue = Line.split('=');
                if (keyvalue.length === 1)
                    keyvalue = keyvalue[0].split('.');
                else
                    keyvalue = keyvalue[1].split('.');

                // 1XXXBBBB
                this._Version = (parseInt(keyvalue[1]) * 1000 + parseInt(keyvalue[2])) * 10000 + parseInt(keyvalue[3]);

                console.log('firmware version: ' + this._Version);
                return this._Version;
            })
    }

    private StartTicking(): void
    {
        let dt = new Date();
        this._Ticking = dt.getTime();

        this.TickIntervalId = setInterval(() =>
        {
            setTimeout(() => this.OnNotify.next(TShellNotify.Ticking), 0);
        }, 1000)
    }

    private StopTicking(): void
    {
        this._Ticking = 0;

        if (TypeInfo.Assigned(this.TickIntervalId))
        {
            clearInterval(this.TickIntervalId);
            this.TickIntervalId = null;
        }
    }

    private IsStatusRetVal(Line: string): boolean
    {
        let strs = Line.split(':');
        if (strs.length > 1)
        {
            let Status = strs[0];
            return ! isNaN(parseInt(Status))
        }
        else
            return false;
    }

/** Proxy to Device depend Shell */
    Attach(): void
    {
        this.Proxy.Attach();
    }

    Detach(): void
    {
        this.StopTicking();

        this.Proxy.Detach();
        this.Proxy = null;
    }

    private Execute(Cmd: string, Timeout: number = 0, IsResponseCallback?: (Line: string) => boolean): Promise<any>
    {
        return this.Proxy.Execute(Cmd, Timeout, IsResponseCallback);
    }

    private RequestStart(RequestClass: typeof TShellRequest, Timeout: number = 0, ...args: any[]): Promise<TShellRequest>
    {
        return this.Proxy.RequestStart(RequestClass, Timeout, this, ...args);
    }

    // @private called from proxy
    _DeviceConnected(Proxy: IProxyShell): Promise<void>
    {
        if (Proxy !== this.Proxy)
            return Promise.reject(new EAbort());

        return this.StatusRequest()
            .then(() => this.BatteryRequest())
            .then(() => this.VersionRequest())
            .then(() => {});
    }

    _DeviceDisconnected(Proxy: IProxyShell)
    {
        if (Proxy !== this.Proxy)
            return;

        this._DeviceNotification(Proxy, ['NOTIFY', 'disconnect'])
    }

    // @private called from proxy
    _DeviceTimeout(Proxy: IProxyShell): void
    {
        if (Proxy !== this.Proxy)
        {
            this.Detach();
            return;
        }

        this.BatteryRequest()
            .then(() => {})
            .catch(err => {});
    }

    // @private called from proxy
    _DeviceNotification(Proxy: IProxyShell, Params: string[])
    {
        if (Proxy !== this.Proxy)
        {
            this.Detach();
            return;
        }

        switch(Params[1])
        {
        case 'shutdown':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.Shutdown), 0);
            break;

        case 'disconnect':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.Disconnected), 0);
            break;

        case 'noload':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.NoLoad), 0);
            break;

        case 'low': // battery':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.LowBattery), 0);
            break;

        case 'error': // stop':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.HardwareError), 0);
            break;

        case 'stop':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.Stopped), 0);
            break;

        case 'strength':
            this._Intensity = parseInt(Params[2]);
            setTimeout(() => this.OnNotify.next(TShellNotify.Intensity), 0);
            break;
        }
    }

    OnNotify: TShellNotifyEvent = new Subject<TShellNotify>();

    private _Ticking: number = 0;
    private TickIntervalId: number = null;

    private _Version: number;
    private _Intensity: number = 0;
    private IntensityInterval = 0;
    private _BatteryLevel: number = 0;
    private _DefaultFileMd5: string;
    private _LastFileMd5: string;

    private static UsbProxy: TProxyUsbShell;
}

/* IProxyShell */

export interface IProxyShell extends TAbstractShell
{
    Owner: TShell;
}

/** Proxy to BLE Shell */

export class TProxyBLEShell extends BLE_Shell.TShell implements IProxyShell
{
    Owner: TShell;

    /// @override
    protected AfterConnected(): Promise<void>
    {
        return this.Owner._DeviceConnected(this);
    }

    /// @override
    protected OnDisconnected(): void
    {
        this.Owner._DeviceDisconnected(this);
        this.Owner = null;
        super.OnDisconnected();
    }

    /// @override
    protected OnRead(Line: string): void
    {
        const NOTIFY = 'NOTIFY ';
        // const FULL_SPACE = "insufficient space";         // 空间 已满V v

        if (Line.substring(0, NOTIFY.length) === NOTIFY)
            this.Owner._DeviceNotification(this, Line.split(' '));
        else
            super.OnRead(Line);
    }

    /// @override
    protected OnConnectionTimeout():void
    {
        this.Owner._DeviceTimeout(this);
        // ignore timeout
        this.Connection.RefreshTimeout();

        super.OnConnectionTimeout();
    }
}

/** Proxy to USB Shell */
export class TProxyUsbShell extends USBSerial.TShell implements IProxyShell
{
    constructor()
    {
        super();
    }

    Owner: TShell;

    /// @override
    protected AfterConnected(): Promise<void>
    {
        return this.Owner._DeviceConnected(this);
    }

    /// @override
    protected OnDisconnected(): void
    {
        this.Owner._DeviceDisconnected(this);
        this.Owner = null;
        super.OnDisconnected();
    }

    /// @override
    protected OnRead(Line: string): void
    {
        const NOTIFY = 'NOTIFY ';
        // const FULL_SPACE = "insufficient space";         // 空间 已满V v

        if (Line.substring(0, NOTIFY.length) === NOTIFY)
            this.Owner._DeviceNotification(this, Line.split(' '));
        else
            super.OnRead(Line);
    }

    /// @override
    protected OnConnectionTimeout():void
    {
        this.Owner._DeviceTimeout(this);
        super.OnConnectionTimeout();
    }
}

/* TShellRequest */
export abstract class TProxyShellRequest extends TShellRequest
{
    // TProxyShellRequest always has first Owner parameter
    //  *NOTE*
    //      this.Shell still derived from TShellRequest
    abstract Start(Proxy: TShell, ...args: any[]): void;
}

/* TCatRequest */
export class TCatRequest extends TProxyShellRequest
{
    /// @override
    Start(Proxy: TShell, FileName: string, FileBuffer: Uint8Array, Md5: string): void
    {
        let Count = FileBuffer.byteLength;

        Proxy.StopOutput()
            .then(() => Proxy.FileMd5(FileName))
            .then(value =>
            {
                if (value === Md5)
                    return Promise.reject(new EAbort());
                else
                    return Promise.resolve();
            })
            .then(() => Proxy.RemoveFile(FileName))
            .then(() => this.Shell.PromiseSend('>cat '+ FileName + ' -l=' + FileBuffer.byteLength))
            .then(() => this.Shell.ObserveSend(FileBuffer))
            .then(Observer =>
            {
                return new Promise((resolve, reject) =>
                {
                    Observer.subscribe(
                        Written =>
                        {
                            this.RefreshTimeout();
                            this.next(Written / Count);
                        },
                        err => reject(err),
                        () => resolve());
                });
            })
            .catch(err =>
            {
                if (err instanceof EAbort)
                    this.complete();
                else
                    this.error(err);
            });
    }

    /// @override
    Notification(Line: string)
    {
        let strs = Line.split(':');
        // '3: end of cat'
        if (strs.length > 1 && strs[0] === '3')
            this.complete();
    }
}

/* TListDefaultFile */
export class TListDefaultFile extends TProxyShellRequest
{
    /// @override
    Start(Proxy: TShell): void
    {
        this.Shell.PromiseSend('>sdef')
            .then(() => this.Shell.PromiseSend('>dump DefaultFile'))
            .catch(err => console.log(err.message));
    }

    /// @override
    Notification(Line: string)
    {
        let Strs = Line.split('=');
        if (Strs.length > 1)
        {
            if (Strs[0] === 'sdef')
            {
                let Name = Strs[1].split(',')[0];
                if (Name.length > 0)
                    this.RetVal.push(Name);
            }

            this.RefreshTimeout();
            return;
        }

        Strs = Line.split(':');
        // error or '2: end of dump'
        if (Strs.length > 1 && (Strs[0] === '32772' || Strs[0] === '2'))
        {
            this.next(this.RetVal);
            this.complete();
        }
        else if (this.RetVal.indexOf(Strs[0]) === -1)
        {
            this.RefreshTimeout();
            this.RetVal.push(Strs[0]);
        }
    }

    RetVal: Array<string> = [];
}

/* TClearFileSystemRequest */

export class TClearFileSystemRequest extends TProxyShellRequest
{
    /// @override
    Start(Proxy: TShell, ExcludeFiles: Array<string>): void
    {
        this.Proxy = Proxy;
        this.ExcludeFiles = ExcludeFiles;

        this.Shell.PromiseSend('>ls')
            .catch(err => console.log(err.message));
    }

    /// @override
    Notification(Line: string)
    {
        if (TypeInfo.Assigned(this.Deleting))
            return;

        let strs = Line.split(':');
        // '1: end of ls'
        if (strs.length > 1 && strs[0] === '1')
        {
            this.Deleting = new Subject<void>();

            if (TypeInfo.Assigned(this.FileList) && this.FileList.length < FILE_CLEAR_MAX_COUNT)
            {
                for (let File of this.FileList)
                {
                    if (File.Size <= FILE_CLEAR_SIZE_LESS_THAN)
                        this.DeletingFiles.push(File.Name)
                };

                if (this.DeletingFiles.length > 0)
                {
                    this.SyncDeletingNext();
                    this.Deleting.toPromise()
                        .then(() => this.complete())
                        .catch(err => this.error(err));
                }
                else
                    this.complete();
            }
            else
            {
                this.Proxy.FormatFileSystem()
                    .catch(err => console.log('clearing filesystem error: ' + err.message))
                    .then(() => this.complete());
            }

            return;
        }
        // listing files:
        //  this.FileList = null when some error happens, this will cause format later
        else if (TypeInfo.Assigned(this.FileList))
        {
            let Idx = Line.indexOf(' ', 0);
            let Name = Line.substr(0, Idx);
            if (Name.length > 0)
            {
                let Size = parseInt(Line.substr(Idx + 1, Line.length));

                // 24 = max file length of device supported
                if (Name.length > 24 || isNaN(Size) || Size < 0 || Size > 32768)
                    this.FileList = null;
                else if (FILE_CLEAR_EXCLUDES.indexOf(Name) === -1 && this.ExcludeFiles.indexOf(Name) === -1)
                    this.FileList.push({Name: Name, Size: Size});
            }
            else
                this.FileList = null;
        }
    }

    private SyncDeletingNext()
    {
        let name = this.DeletingFiles.pop();

        this.Proxy.RemoveFile(name)
            .then(() =>
            {
                if (this.DeletingFiles.length > 0)
                    setTimeout(() => this.SyncDeletingNext(), 0);
                else
                    this.Deleting.complete();
            })
            .catch(err => console.log(err.message));
    }

    Proxy: TShell;
    FileList: Array<{Name: string, Size: number}> = [];
    ExcludeFiles: Array<string>;

    Deleting: Subject<void> = null;
    DeletingFiles = new Array<string>();
}

/* TOTARequest */

export class TOTARequest extends TProxyShellRequest
{
    Start(Proxy: TShell, Firmware: ArrayBuffer): void
    {
        this.SendedPercent = 0;
        this.replyPackets = 0;
        let view = this.getViewDataWithMultipleOf16(Firmware);
        let crc = THashCrc16.Get(view).Value();

        this.PackPacketWithCRC(view);

        this.cmdHeader = '>ota -s=' + view.length + ' -c=' + crc;
        this.StartSendOtaHeader(this.cmdHeader);   
    }

    Notification(Line: string)
    {
        //console.log('notify: ' + Line);
        if (Line.includes('jump'))
        {
            console.log('notify: ' + Line);
            //setTimeout(() => this.StartSendOtaHeader(this.cmdHeader), 500);
            this.error(new Error('jump ota'));
        }
        if (Line === '0: ok [ota]')
        {
            if (this.SendedPercent === 0)
                this.StartSendingPacket();
            else
                this.complete();
        }
        else if (Line === '32768: err [ota]')
            this.error(new Error('ota failure'));
        else if (Line === 'crc error')
            this.error(new Error('crc error'));
        else if (Line === '32770: invalid parameter')
            this.error(new Error('invalid parameter'));
        else
            this.handleReplyPacket(Line);
    }

    private StartSendOtaHeader(cmd: string)
    {
        console.log('Ensure the connection before send ota header');
        this.Shell.Connect()
            .then(() =>
            {
                setTimeout(() => this.Shell.PromiseSend(cmd)
                    .catch(err => this.error(new Error('send failed'))), 800);
            })
            .catch(() => this.error(new Error('connect failed')))
    }

    private getViewDataWithMultipleOf16(firmware: ArrayBuffer): Uint8Array
    {
        let viewData: Uint8Array;
        let multipleLeft = firmware.byteLength % 16;
        if (multipleLeft !== 0)
        {
            viewData = new Uint8Array(firmware.byteLength + 16 - multipleLeft);
            viewData.set(new Uint8Array(firmware), 0);
        }
        else
            viewData = new Uint8Array(firmware);

        return viewData;
    }

    private PackPacketWithCRC(data: Uint8Array)
    {
        this.SendSplitPacketCount = data.length / 16;
        this.SendPacket = new Uint8Array(this.SendSplitPacketCount * 20);
        console.log('packet size: ' + this.SendPacket.length);
        for (let i = 0; i < this.SendSplitPacketCount; i++)
        {
            let packet = new Uint8Array(20);
            let view = data.subarray(i * 16, i * 16 + 16);
            packet.set(view, 4);

            let view16 = new Uint16Array(packet.buffer, 0, 2);
            view16[0] = i * 16;
            view16[1] = THashCrc16.Get(view).Value();

            this.SendPacket.set(packet, i * 20);
        }
    }

    private StartSendingPacket()
    {
        if (! TypeInfo.Assigned(this.SendPacket))
            return;

        let sendOffset = 0;
        let resendCount = 0;
        let loopSendCount = Math.ceil(this.SendSplitPacketCount / 64);

        var that = this;

        function loopSendBlock()
        {
            that.StartSendingSplitBlock(sendOffset)
                .then(() =>
                {
                    console.log('send ' + sendOffset + ' block success');
                    resendCount = 0;
                    sendOffset ++;
                    if (sendOffset < loopSendCount)
                    {
                        that.StartWaitReplyBeforeSend(sendOffset).then(() => loopSendBlock())
                            .catch(() => that.error(new Error('send failed')));
                    }
                    else
                    {
                        console.log('send all packet!!');
                        that.StartWaitReplyAllPackets()
                            .then(() => {if (! that.isStopped) that.complete()})
                            .catch(() => {});
                    }
                })
                .catch(() =>
                {
                    console.log('send err, resend: ' + sendOffset);
                    if (resendCount < 3)
                        setTimeout(() => loopSendBlock(), 500);
                    else
                        that.error(new Error('send failed'));

                    resendCount ++;
                    that.RefreshTimeout();
                });
        }

        setTimeout(() => loopSendBlock(), 10);
    }

    private StartWaitReplyBeforeSend(sendOffset: number): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            let waitTime = 0;
            let sendedPackets = sendOffset * 64;
            let sendRplyInterval = sendedPackets - this.replyPackets;

            console.log('send: ' + sendedPackets + ' reply: ' + this.replyPackets);
            if (sendRplyInterval > 40)
                waitTime = 2000;
            else if (sendRplyInterval > 10)
                waitTime = 1500;
            else if (sendRplyInterval > 5)
                waitTime = 1000;
            else
                waitTime = 500;

            let waitTimer = Timer.startNew(100, Infinity, waitTime);
            waitTimer.subscribe((counter) =>
            {
                if (waitTime >= 5000 || (sendedPackets - this.replyPackets <= 5))
                {
                    console.log('wait ' + waitTime + 'ms' + ' reply: ' + this.replyPackets);
                    waitTimer.stop();

                    if (sendedPackets - this.replyPackets >= 4 * 64)
                        reject();
                    else
                        resolve();
                }

                waitTime += 100;
                this.RefreshTimeout();
            });
        });
    }

    private StartWaitReplyAllPackets(): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            let waitTime = 2000;
            let waitTimer = Timer.startNew(1000, Infinity, waitTime);
            waitTimer.subscribe((counter) =>
            {
                waitTime += 1000;
                if (this.SendSplitPacketCount === this.replyPackets)
                {
                    console.log('all packet replied, send ota success');
                    waitTimer.stop();
                    resolve();
                }
                else
                    console.log('wait ' + waitTime + 'ms');

                if (waitTime > 60 * 1000)
                {
                    console.log('wait timeout after send all packet');
                    waitTimer.stop();
                    reject();
                }

                this.RefreshTimeout();
            });
        });
    }

    private StartSendingSplitBlock(offset: number): Promise<number>
    {
        let start = offset * 20 * 64;
        let end = (offset + 1) * 20 * 64;

        if (end > this.SendPacket.length)
            end = this.SendPacket.length;

        console.log('send block ' + offset +  ' start: ' + start + ' end: ' + end);

        return new Promise<number>((resolve, reject) =>
        {
            this.Shell.ObserveSend(this.SendPacket.subarray(start, end))
                .then((observer) =>
                {
                    observer.subscribe(count =>
                    {
                        //console.log('send: ' + count / 20);
                        if (count === (end - start))
                            return resolve();

                        this.RefreshTimeout();
                    });
                })
                .catch((err) =>
                {
                    reject();
                });
        });
    }

    private handleReplyPacket(Line: string)
    {
        let replyPacket = Number(Line) / 16;
        if (this.replyPackets < replyPacket + 1)
            this.replyPackets = replyPacket + 1;

        let newSendedPercent = Math.floor(this.replyPackets / this.SendSplitPacketCount * 100);
        if (this.SendedPercent < newSendedPercent)
        {
            this.SendedPercent = newSendedPercent;
            this.next(this.SendedPercent);
        }
    }

    private SendPacket: Uint8Array;
    private SendSplitPacketCount: number = 0;
    private SendedPercent: number = 0;

    private replyPackets: number = 0;
    private cmdHeader: string = '';
}
