import {Subject, Observable} from 'rxjs';
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {EAbort} from '../../UltraCreation/Core/Exception';
import {TUtf8Encoding} from '../../UltraCreation/Encoding/Utf8';
import {THashCrc16} from '../../UltraCreation/Hash';
import {TAbstractShell, TShellRequest, ERequestTimeout, EDisconnected} from '../../UltraCreation/Native/Abstract.Shell'

import * as BLE from '../../UltraCreation/Native/BluetoothLE';
import * as USB from '../../UltraCreation/Native/USB';

export {ERequestTimeout};

const REQUEST_TIMEOUT = 3000;

const BLE_FILTER_NAMES: string[] = ['uctenqt3', 'thunderbolt', 'uctenqt1', 'quintic ble', 'ble hw1.0.0', '.blt', 'bluetensx'];
const BLE_SCAN_TIMEOUT = 60000;
export const BLE_CONNECTION_TIMEOUT = 5000;

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

/* TShell */

export enum TShellNotify
    {Shutdown, Disconnected, NoLoad, Stopped, Intensity, HardwareError, LowBattery, Battery, Ticking};
export type TShellNotifyEvent = Subject<TShellNotify>;

interface IScriptFile
{
    Name?: string | null;
    Md5?: string | null;
    Content?: string | null;
    ContentBuffer?: Uint8Array | null;
    Duration?: number | null;
};

export class TShell extends TAbstractShell
{
    /// @override
    static Get(DeviceId: string): TShell
    {
        let RetVal = this.Cached.get(DeviceId);

        if (! TypeInfo.Assigned(RetVal))
        {
            if (DeviceId === 'USB')
                RetVal = new this(this.UsbProxy, DeviceId);
            else
                RetVal = new this(TProxyBLEShell.Get(DeviceId, BLE_CONNECTION_TIMEOUT) as TProxyBLEShell, DeviceId);

            this.Cached.set(DeviceId, RetVal);
        }

        if (TypeInfo.Assigned(this.RunningInstance) && this.RunningInstance !== RetVal)
        {
            let Instance = this.RunningInstance;
            Instance.StopOutput()
                .then(() => Instance.Detach())
                .catch(err => console.log(err.message))
                .then(() => this.RunningInstance = undefined);
        }

        return RetVal;
    }

/* USB only */

    static StartOTG(): USB.OTG
    {
        this.UsbProxy = new TProxyUsbShell();
        return USB.OTG.Start(USB_VENDOR, USB_PRODUCT, USB_MTU, USB_MIN_WRITE_INTERVAL);
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

    static set FakeDevice(v: boolean)
    {
        BLE.TGatt.BrowserFakeDevice = v;
    }

    static StartScan(): Subject<Array<BLE.IScanDiscovery>>
    {
        //BLE.TGatt.BrowserFakeDevice = true;
        return BLE.TGattScaner.Start([], this.ScanFilter, BLE_SCAN_TIMEOUT);
    }

    static StopScan(): Promise<void>
    {
        return BLE.TGattScaner.Stop();
    }

    private static ScanFilter(Device: BLE.IScanDiscovery): boolean
    {
        let adv = Device.advertising;
        let name: string | null = null;

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

    static RunningInstance: TShell | undefined;
    static DefaultFileList: Array<string> = []
    static Cached = new Map<string, TShell>();
    static LinearTable: TLinearTable = '4v';
    static UsbProxy: TProxyUsbShell;

/* Instance */

    constructor (Proxy: IProxyShell, public DeviceId: string)
    {
        super();

        this.Proxy = Proxy;
        Proxy.Owner = this;
    }

    OnNotify: TShellNotifyEvent = new Subject<TShellNotify>();
    RefFile: IScriptFile;

    private Proxy: IProxyShell | undefined;

    private _Version: number;
    private _BatteryLevel: number = 0;

    private _Intensity: number = 0;
    private IntensityTick = 0;
    private IntensityChanging: Promise<any> | undefined;

    private _Ticking: number = 0;
    private TickIntervalId: any = null;

    private _DefaultFileList: Array<string> = [];

/* TAbstractShell */

    Attach(): void
    {
        if (TypeInfo.Assigned(this.Proxy))
            this.Proxy.Attach();
    }

    get IsAttached(): boolean
    {
        return TypeInfo.Assigned(this.Proxy) && this.Proxy.IsAttached;
    }

    Detach(): void
    {
        this.StopTicking();

        if (TypeInfo.Assigned(this.Proxy))
        {
            this.Proxy.Detach();
            this.Proxy = undefined;
        }

        if ((this.constructor as typeof TShell).Cached.delete(this.DeviceId))
            console.log('Shell detached.DeviceId:' + this.DeviceId);
    }

    Connect(): Promise<void>
    {
        if (TypeInfo.Assigned(this.Proxy))
            return this.Proxy.Connect();
        else
            return Promise.reject(new EAbort())
    }

    Disconnect(): Promise<void>
    {
        if (TypeInfo.Assigned(this.Proxy))
            return this.Proxy.Disconnect();
        else
            return Promise.reject(new EAbort())
    }

    Execute(Cmd: string, Timeout: number = 0, IsResponseCallback: (Line: string) => boolean): Promise<any>
    {
        if (TypeInfo.Assigned(this.Proxy))
            return this.Proxy.Execute(Cmd, Timeout, IsResponseCallback);
        else
            return Promise.reject(new EAbort())
    }

    RequestStart(RequestClass: typeof TShellRequest, Timeout: number = 0, ...args: any[]): Promise<TShellRequest>
    {
        if (TypeInfo.Assigned(this.Proxy))
            return this.Proxy.RequestStart(RequestClass, Timeout, this, ...args);
        else
            return Promise.reject(new EAbort())
    }

/** shell functions */

    Shutdown(): Promise<void>
    {
        return this.StopOutput();
        //return this.Execute('>shdn', REQUEST_TIMEOUT).catch(err => console.log('shutdown.err:' + err.message));
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

    SetDefaultFile(FileName: string, Idx: number = 0): Promise<void>
    {
        let Cmd: string = '>sdef ' + FileName;
        if (Idx !== 0)
            Cmd = Cmd + '=' + Idx;

        return this.Execute(Cmd, REQUEST_TIMEOUT, Line =>
        {
            let strs = Line.split('=');
            return strs.length >= 1 && strs[0] === 'sdef';
        })
        .then(() =>
        {
            if (Idx < this.DefaultFileList.length)
                this.DefaultFileList[Idx] = FileName;
            else
                this.DefaultFileList.push(FileName);
        });
    }

    ListDefaultFile(): Promise<Array<string>>
    {
        return this.RequestStart(TListDefaultFile, REQUEST_TIMEOUT)
            .then(Request => Request.toPromise() as Promise<Array<string>>)
            .then(List =>
            {
                this._DefaultFileList = List;
                (this.constructor as typeof TShell).DefaultFileList = List;
                return List;
            });
    }

    StartScriptFile(s: IScriptFile): Promise<void>
    {
        return this.Execute('>ssta ' + s.Name, REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line))
            .then(() =>
            {
                this.RefFile = s;
                (this.constructor as typeof TShell).RunningInstance = this;
            })
            .then(() => setTimeout(() => this.IntensityRequest().catch(err => {}), 200))
            .then(() => this.StartTicking());
    }

    /*
    StartOutput()
    {
        return this.Execute('>osta', REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line))
            .then(() => setTimeout(() => this.IntensityRequest().catch(err => {}), 300))
            .then(() =>
            {
                this.StartTicking();
            });
    }
    */

    StopOutput()
    {
        this.StopTicking();
        return this.Execute('>osto', REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line));
    }

    CatFile(s: IScriptFile): Promise<Subject<number>>
    {
        this.RefFile = s;
        return this.RequestStart(TCatRequest, REQUEST_TIMEOUT, s.Name, s.ContentBuffer, s.Md5);
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
        return this.RequestStart(TClearFileSystemRequest, REQUEST_TIMEOUT, ExcludeFiles.concat(this.DefaultFileList))
            .then(Request => Request.toPromise())
            .then(() => {});
    }

    SetIntensity(Value: number): void
    {
        if (! this.IsAttached)
            return;
        if (this._Intensity === 0 || Value < 1 || Value > 60)
            return;

        if (TypeInfo.Assigned(this.IntensityChanging))
            return;

        this.IntensityChanging = this.Execute('>str ' + Value, REQUEST_TIMEOUT,
            (Line: string): boolean =>
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

                return false;
            })
            .then(Line =>
            {
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity), 0);
                return this._Intensity;
            })
            .catch(err => console.log(err.message))
            .then(() => this.IntensityChanging = undefined)
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

    get TickingDownHint(): string
    {
        let RetVal = "";

        if (TypeInfo.Assigned(this.RefFile))
        {
            let Duration = (this.RefFile.Duration ? this.RefFile.Duration : 0);
            let TickingDown = Duration - this.Ticking;

            if (TickingDown > 0)
            {
                let Min = Math.trunc((TickingDown) / 60);
                let Sec = TickingDown % 60;

                if (Sec < 0)
                {
                    if (Min > 0)
                        Sec += 60;
                    else
                        Sec = 0;
                }

                if (Min > 0)
                    RetVal = (Min < 10 ? '0' : '') + Min.toString() + ':' + (Sec < 10 ? '0' : '') + Sec.toString();
                else
                    RetVal = '00:' + (Sec < 10 ? '0' : '') + Sec.toString();
            }
            else
                RetVal = '00:00';
        }

        return RetVal;
    }

    get DurationMinuteHint(): string
    {
        let Duration = 0;
        if (TypeInfo.Assigned(this.RefFile) && TypeInfo.Assigned(this.RefFile.Duration))
            Duration = this.RefFile.Duration;

        let Time = '00:00';
        let Min = Math.trunc(Duration / 60);

        if (Min === 0)
            Time = '00:';
        else if (Min < 10)
            Time = '0' + Min + ':';
        else
            Time = Min + ':';

        let Sec = Duration % 60;
        if (Sec === 0)
            Time += '00';
        else if (Sec < 10)
            Time += '0' + Sec;
        else
            Time += Sec + '';

        return Time;
    }

    get Version(): number
    {
        return this._Version;
    }

    get Intensity(): number
    {
        return this._Intensity;
    }

    get BatteryLevel(): number
    {
        return this._BatteryLevel;
    }

    get DefaultFileList(): Array<string>
    {
        return this._DefaultFileList;
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

                        case "str":
                            this._Intensity = parseInt(keyvalue[1]);
                            break;

                        case "dmd5":
                        case "lmd5":
                            break;
                        }
                    }
                }
            })
            .catch(err => console.log(err.message));
    }

    private BatteryRequest(): Promise<number>
    {
        return Promise.resolve(5000);
        /*
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
        */
    }

    private IntensityRequest(): Promise<number>
    {
        let dt = new Date();
        let strs: string[];

        if (dt.getTime() - this.IntensityTick < 300)
            return Promise.resolve(this.Intensity);
        this.IntensityTick = dt.getTime();

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

            let Duration = (this.RefFile.Duration ? this.RefFile.Duration : 0);
            if (Duration <= this.Ticking && this.OnNotify.observers.length === 0)
                this.Detach();
        }, 1000)
    }

    StopTicking(): void
    {
        this._Ticking = 0;
        (this.constructor as typeof TShell).RunningInstance = undefined;

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

        return this.ListDefaultFile()
            .then((any) => this.StatusRequest())
            .then(() => this.VersionRequest())
            .then(() =>
            {
                let Cls = this.constructor as typeof TShell;

                if (Cls.LinearTable !== DEF_LINEAR_TABLE)
                    return this.SetLinearTable(Cls.LinearTable);
                else
                    return;
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

        if (this.OnNotify.observers.length !== 0)
        {
            if (! TypeInfo.Assigned(this._BatteryLevel))
            {
                this.BatteryRequest()
                    .then((level: number)=>
                    {
                        if (! TypeInfo.Assigned(this._BatteryLevel))
                            return this.VersionRequest();
                        else
                            return;
                    })
                    .catch((err: any) => {});
            }
            else
                this.VersionRequest().catch(err => {});
        }
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
        case 'disconnect':
            // this.StopTicking();
            this.OnNotify.next(TShellNotify.Disconnected);
            this.Detach();
            break;

        case 'shutdown':
            // this.StopTicking();
            this.OnNotify.next(TShellNotify.Shutdown);
            this.Detach();
            break;

        case 'noload':
            // this.StopTicking();
            this.OnNotify.next(TShellNotify.NoLoad);
            this.Detach();
            break;

        case 'low': // battery':
            // this.StopTicking();
            this.OnNotify.next(TShellNotify.LowBattery);
            this.Detach();
            break;

        case 'error': // stop':
            // this.StopTicking();
            this.OnNotify.next(TShellNotify.HardwareError);
            this.Detach();
            break;

        case 'stop':
            this.StopTicking();
            this.OnNotify.next(TShellNotify.Stopped);
            break;

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
        }
    }
}

/* IProxyShell */

export interface IProxyShell extends TAbstractShell
{
    Owner: TShell | undefined;
}

/** Proxy to BLE Shell */

export class TProxyBLEShell extends BLE.TShell implements IProxyShell
{
    Owner: TShell | undefined;

    /// @override
    protected AfterConnected(): Promise<void>
    {
        return (this.Owner as TShell)._DeviceConnected(this);
    }

    /// @override
    protected OnDisconnected(): void
    {
        (this.Owner as TShell)._DeviceDisconnected(this);
        this.Owner = undefined;
        super.OnDisconnected();
    }

    /// @override
    protected OnRead(Line: string): void
    {
        const NOTIFY = 'NOTIFY ';

        if (Line.substring(0, NOTIFY.length) === NOTIFY)
            (this.Owner as TShell)._DeviceNotification(this, Line.split(' '));
        else
            super.OnRead(Line);
    }

    /// @override
    protected OnConnectionTimeout():void
    {
        (this.Owner as TShell)._DeviceTimeout(this);
        // ignore timeout
        this.Connection.RefreshTimeout();

        super.OnConnectionTimeout();
    }
}

/** Proxy to USB Shell */

export class TProxyUsbShell extends USB.TShell implements IProxyShell
{
    constructor()
    {
        super();
    }

    Owner: TShell | undefined;

    /// @override
    protected AfterConnected(): Promise<void>
    {
        return (this.Owner as TShell)._DeviceConnected(this);
    }

    /// @override
    protected OnDisconnected(): void
    {
        (this.Owner as TShell)._DeviceDisconnected(this);
        this.Owner = undefined;

        super.OnDisconnected();
    }

    /// @override
    protected OnRead(Line: string): void
    {
        const NOTIFY = 'NOTIFY ';

        if (Line.substring(0, NOTIFY.length) === NOTIFY)
            (this.Owner as TShell)._DeviceNotification(this, Line.split(' '));
        else
            super.OnRead(Line);
    }

    /// @override
    protected OnConnectionTimeout():void
    {
        (this.Owner as TShell)._DeviceTimeout(this);
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
                if (value.toUpperCase() === Md5)
                    return Promise.reject(new EAbort());
                else
                    return Promise.resolve();
            })
            .then(() => Proxy.RemoveFile(FileName))
            .then(() =>
            {
                if (TypeInfo.Assigned(this.Shell))
                    return this.Shell.PromiseSend('>cat '+ FileName + ' -l=' + FileBuffer.byteLength)
                else
                    return Promise.reject(new EAbort())
            })
            .then(() =>
            {
                if (TypeInfo.Assigned(this.Shell))
                    return this.Shell.ObserveSend(FileBuffer)
                else
                    return Promise.reject(new EAbort())
            })
            .then((Observer: Observable<number>) =>
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
            .catch(err => this.error(err));
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
            .catch(err => this.error(err));
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
        let name = this.DeletingFiles.pop() as string;

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
    FileList: (Array<{Name: string, Size: number}>) | null = [];
    ExcludeFiles: Array<string>;

    Deleting: Subject<void>;
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

        if (TypeInfo.Assigned(this.Shell))
        {
            this.Shell.PromiseSend(View)
                .then(value => this.next(this.LastSentOffset / this.FirmwareSize))
                .catch(err => this.error(err));
        }
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
