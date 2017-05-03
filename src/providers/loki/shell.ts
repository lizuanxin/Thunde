import {Subject} from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';

import {TypeInfo, EAbort} from '../../UltraCreation/Core';
import {TUtf8Encoding} from '../../UltraCreation/Encoding/Utf8';
import {THashCrc16} from '../../UltraCreation/Hash';

import {TAbstractShell, TShellRequest, ERequestTimeout, EDisconnected} from '../../UltraCreation/Native/Abstract.Shell'
export {ERequestTimeout};

import * as BLE from '../../UltraCreation/Native/BluetoothLE';
import * as USBSerial from '../../UltraCreation/Native/UsbSerialOTG';

const REQUEST_TIMEOUT = 3000;

const BLE_FILTER_NAMES: string[] = ['uctenqt3', 'thunderbolt', 'uctenqt1', 'quintic ble', 'ble hw1.0.0', '.blt'];
const BLE_SCAN_TIMEOUT = 60000;
const BLE_CONNECTION_TIMEOUT = 5000;

const FILE_CLEAR_EXCLUDES = ['DefaultFile', 'BLE_Name'];
const FILE_CLEAR_SIZE_LESS_THAN = 4096;
const FILE_CLEAR_MAX_COUNT = 64;

const USB_VENDOR = 0x10C4;
const USB_PRODUCT = 0x0003;
const USB_MTU = 20;
const USB_MIN_WRITE_INTERVAL = 10;

const OTA_WINDOW_SIZE = 24;
const OTA_SPLIT_PACKET_SIZE = 16;
const OTA_PACKET_SIZE = OTA_SPLIT_PACKET_SIZE + 4;

type TLinearTable = '5v' | '3.3v' | '4v';
const DEF_LINEAR_TABLE = '4v';

export class EUSBRestarting extends EAbort
    {}

export enum TShellNotify
    {Shutdown, Disconnected, NoLoad, Stopped, Intensity, HardwareError, LowBattery, Battery, Ticking};
export type TShellNotifyEvent = Subject<TShellNotify>;

export class TShell extends TAbstractShell
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

    static LinearTable: TLinearTable = '4v';

    constructor (private Proxy: IProxyShell)
    {
        super(0);
        Proxy.Owner = this;
    }

/* TAbstractShell */
    Attach(): void
    {
        this.Proxy.Attach();
    }

    get IsAttached(): boolean
    {
        return TypeInfo.Assigned(this.Proxy) && this.Proxy.IsAttached;
    }

    Detach(): void
    {
        this.StopTicking();

        this.Proxy.Detach();
        this.Proxy = null;
    }

    Connect(): Promise<void>
    {
        return this.Proxy.Connect();
    }

    Disconnect(): Promise<void>
    {
        return this.Proxy.Disconnect();
    }

    Execute(Cmd: string, Timeout: number = 0, IsResponseCallback?: (Line: string) => boolean): Promise<any>
    {
        return this.Proxy.Execute(Cmd, Timeout, IsResponseCallback);
    }

    RequestStart(RequestClass: typeof TShellRequest, Timeout: number = 0, ...args: any[]): Promise<TShellRequest>
    {
        return this.Proxy.RequestStart(RequestClass, Timeout, this, ...args);
    }

/* USB only */
    static StartOTG(): USBSerial.OTG
    {
        this.UsbProxy = new TProxyUsbShell();
        return USBSerial.OTG.Start(USB_VENDOR, USB_PRODUCT, USB_MTU, USB_MIN_WRITE_INTERVAL);
    }

    static get IsUsbPlugin(): boolean
    {
        return TypeInfo.Assigned(this.UsbProxy) && this.UsbProxy.IsAttached;
    }

/** BLE only */
    static EnableBLE(): Promise<boolean>
    {
        return BLE.Enable();
    }

    static get FakeDevice(): boolean
    {
        return BLE.TGatt.BrowserFakeDevice;
    }

    static StartScan(): Subject<Array<BLE.IScanDiscovery>>
    {
        BLE.TGatt.BrowserFakeDevice = true;
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

    StartScriptFile(FileName: string): Promise<void>
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

        return this.Execute('>str ' + Value, REQUEST_TIMEOUT,
            Line =>
            {
                let strs = Line.split('=');
                if (strs.length === 2 && strs[0] === 'str')
                {
                    this._Intensity = parseInt(strs[1]);
                    return true;
                }
                else if (strs.length === 1)
                {
                    let v =  +Line;
                    if (! isNaN(v))
                    {
                        this._Intensity = v;
                        return true;
                    }
                }
                else
                    return false;
            })
            .then(Line =>
            {
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity), 0);
                return this._Intensity;
            });
    }

    SetLinearTable(n : TLinearTable): Promise<void>
    {
        let Idx = 3;
        switch(n)
        {
        case '5v':
            Idx = 1;
            break;
        case '3.3v':
            Idx = 2;
            break;
        default:
            Idx = 3;
            break;
        }

        return this.Execute('>sstab ' + Idx, REQUEST_TIMEOUT,
            Line =>
            {
                console.log(Line);
                return this.IsStatusRetVal(Line);
            })
            .then(value => {});
    }

    OTARequest(Firmware: ArrayBuffer): Promise<TShellRequest>
    {
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
        this.SetIntensity(Value)
            .catch(err =>console.log('set Intensity() ', err.message));
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
                            let ticking = parseInt(keyvalue[1]);
                            if (ticking !== 0)
                                this.StartTicking(ticking);
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

    /*
    private BatteryRequest(): Promise<number>
    {
        let strs: string[];

        return this.Execute('>bat', REQUEST_TIMEOUT,
            Line =>
            {
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
    */

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

    private VersionRequest(): Promise<number>
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

    private StartTicking(Shift: number = 0): void
    {
        let dt = new Date();
        this._Ticking = dt.getTime() - Shift * 1000;

        this.TickIntervalId = setInterval(() =>
        {
            setTimeout(() => this.OnNotify.next(TShellNotify.Ticking), 0);
        }, 1000)
    }

    StopTicking(): void
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

/* proxy to shell */
    // @private called from Proxy
    _DeviceConnected(Proxy: IProxyShell): Promise<void>
    {
        if (Proxy !== this.Proxy)
            return Promise.reject(new EAbort());

        return this.StatusRequest()
            //.then(() => this.BatteryRequest())
            .then(() => this.VersionRequest())
            .then(() =>
            {
                let Cls = this.constructor as typeof TShell;
                if (Cls.LinearTable !== DEF_LINEAR_TABLE)
                    return this.SetLinearTable(Cls.LinearTable);
            });
    }

    _DeviceDisconnected(Proxy: IProxyShell)
    {
        if (Proxy !== this.Proxy)
            return;
        this._DeviceNotification(Proxy, ['NOTIFY', 'disconnect'])
    }

    // @private called from Proxy
    _DeviceTimeout(Proxy: IProxyShell): void
    {
        if (Proxy !== this.Proxy)
        {
            this.Detach();
            return;
        }

        this.VersionRequest()
            .then(() => {})
            .catch(err => {});
        /*
        this.BatteryRequest()
            .then(() => {})
            .catch(err => {});
        */
    }

    // @private called from Proxy
    _DeviceNotification(Proxy: IProxyShell, Params: string[])
    {
        if (Proxy !== this.Proxy)
        {
            this.Detach();
            return;
        }

        switch(Params[1])
        {
        case 'strength':
            this._Intensity = parseInt(Params[2]);
            if (this._Intensity >= 0)
            {
                this.OnNotify.next(TShellNotify.Intensity);
                break;
            }
            else
            {
                // continue to shutdown
            }
        case 'shutdown':
            this.StopTicking();
            this.OnNotify.next(TShellNotify.Shutdown);
            break;

        case 'disconnect':
            this.StopTicking();
            this.OnNotify.next(TShellNotify.Disconnected);
            break;

        case 'noload':
            this.StopTicking();
            this.OnNotify.next(TShellNotify.NoLoad);
            break;

        case 'low': // battery':
            this.StopTicking();
            this.OnNotify.next(TShellNotify.LowBattery);
            break;

        case 'error': // stop':
            this.StopTicking();
            this.OnNotify.next(TShellNotify.HardwareError);
            break;

        case 'stop':
            this.StopTicking();
            this.OnNotify.next(TShellNotify.Stopped);
            break;
        }
    }

    OnNotify: TShellNotifyEvent = new Subject<TShellNotify>();

    private _Ticking: number = 0;
    private TickIntervalId: any = null;

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

export class TProxyBLEShell extends BLE.TShell implements IProxyShell
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

        Proxy.FileMd5(FileName)
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
        if (! Proxy.IsAttached)
        {
            this.error(new EDisconnected());
            return;
        }
        this.NoConnectionTimeout();

        this.FirmwareSize = Firmware.byteLength;
        this.CRC = this.SplitPacket(Firmware);

        this.Shell.PromiseSend('>ota -s=' + this.FirmwareSize + ' -c=' + this.CRC)
            .catch(err => this.error(err));
    }

    Notification(Line: string)
    {
        console.log('OTA Notification: ' + Line);

        this.RefreshTimeout();

        let Strs = Line.split(':');
        let Status = 0;
        if (Strs.length > 1)
        {
            Status = parseInt(Strs[0]);

            if (Status === 0)
            {
                if (this.Sent === 0)
                    this.StartSendingPacket();
                else
                    this.complete();
            }
            else if ((Status & 0x8000) !== 0)
            {
                console.log('OTA error ' + Line);
                this.error(new Error('e_ota_failure'));
            }
        }
        else if (Line === 'crc error')
        {
            console.log('OTA crc error');
            this.error(new Error('e_ota_failure'));
        }
        else if (Line.indexOf('jump') !== -1)
        {
            console.log('usb resetting...');
            this.error(new EUSBRestarting());
        }
        else
            this.HandleReponse(Line);
    }

    SplitPacket(Firmware: ArrayBuffer): number
    {
        let Count = Math.trunc((Firmware.byteLength + OTA_SPLIT_PACKET_SIZE - 1) / OTA_SPLIT_PACKET_SIZE);
        this.PacketBuffer = new ArrayBuffer(Count * OTA_PACKET_SIZE);

        let CRC = new THashCrc16();
        for (let i = 0; i < Firmware.byteLength; i += OTA_SPLIT_PACKET_SIZE)
        {
            let ViewSRC: Uint8Array;
            if (Firmware.byteLength - i > OTA_SPLIT_PACKET_SIZE)
                ViewSRC = new Uint8Array(Firmware, i, OTA_SPLIT_PACKET_SIZE);
            else
                ViewSRC = new Uint8Array(Firmware, i, Firmware.byteLength - i);
            CRC.Update(ViewSRC);

            let Offset = i / OTA_SPLIT_PACKET_SIZE * OTA_PACKET_SIZE;
            let DataView = new Uint8Array(this.PacketBuffer, Offset + 4, OTA_SPLIT_PACKET_SIZE);
            DataView.set(ViewSRC);

            let HeadView = new Uint16Array(this.PacketBuffer, Offset, 2);
            HeadView[0] = i;
            HeadView[1] = THashCrc16.Get(DataView).Value();
        }

        CRC.Final();
        return CRC.Value();
    }

    private StartSendingPacket()
    {
        setTimeout(() =>
        {
            this.SendPacket(0, OTA_WINDOW_SIZE);
            this.MonitorOutgoing(0);
        }, 1000);
    }

    private SendPacket(Offset: number, Count: number)
    {
        if (this.isStopped)
            return;
        if (this.LastSentOffset === this.FirmwareSize)
            return;
        this.LastSentOffset = Offset + Count * OTA_SPLIT_PACKET_SIZE;

        Offset = Offset / OTA_SPLIT_PACKET_SIZE * OTA_PACKET_SIZE;
        let Size = Count * OTA_PACKET_SIZE;

        if (Offset + Size > this.PacketBuffer.byteLength)
        {
            Size = this.PacketBuffer.byteLength - Offset;
            Count = Size / OTA_PACKET_SIZE;
            this.LastSentOffset = this.FirmwareSize;
        }

        let View = new Uint8Array(this.PacketBuffer, Offset, Size);

        this.OutgoingCount += Count;
        this.Shell.PromiseSend(View)
            .then(value => this.next(this.LastSentOffset / this.FirmwareSize))
            .catch(err => this.error(err));
    }

    private HandleReponse(Line: string)
    {
        if (! this.isStopped)
        {
            if (this.OutgoingCount > 0)
                this.OutgoingCount --;

            // somehow android received error BLE notify packet, but it ok to continue
            /*
            let Offset = parseInt(Line);
            if (isNaN(Offset))
            {
                this.error(new Error('NaN offset'));
                return;
            }
            */

            if (this.OutgoingCount < Math.trunc(OTA_WINDOW_SIZE / 4))
                this.SendPacket(this.LastSentOffset, OTA_WINDOW_SIZE - this.OutgoingCount);
        }
    }

    private MonitorOutgoing(LastCount: number)
    {
        if (! this.isStopped)
        {
            // for a long time OutgoingCount has not been changed=
            if (LastCount <= OTA_WINDOW_SIZE / 4 && LastCount === this.OutgoingCount)
            {
                console.log('OTA reset outgoing counter');
                // reset outgoing window
                this.OutgoingCount = 0;
                this.SendPacket(this.LastSentOffset, OTA_WINDOW_SIZE);
            }

            if (this.OutgoingCount > 0)
                setTimeout(() => this.MonitorOutgoing(this.OutgoingCount), 1500);
        }
    }

    private NoConnectionTimeout()
    {
        if (! this.isStopped)
        {
            this.Shell.RefreshConnectionTimeout();
            setTimeout(() => this.NoConnectionTimeout(), 1000);
        }
    }

    private PacketBuffer: ArrayBuffer;
    private CRC: number;
    private Sent: number = 0;
    private LastSentOffset: number;
    private FirmwareSize: number;
    private OutgoingCount: number = 0;
}
