import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {EAbort} from '../../UltraCreation/Core/Exception';
import {TAbstractShell, TShellRequest, ERequestTimeout} from '../../UltraCreation/Native/Abstract.Shell';

import * as BLE from '../../UltraCreation/Native/BluetoothLE';
import * as USB from '../../UltraCreation/Native/USB';

import {IShell, TLinearTable, IScriptFile} from './shell.intf';
import {TListDefaultFile} from './shell.list_default';
import {TCatRequest} from './shell.cat';
import {TClearFileSystemRequest} from './shell.clear_fs';
import {TOTARequest, EUSBRestarting} from './shell.ota';

export {ERequestTimeout, EUSBRestarting};

const REQUEST_TIMEOUT = 3000;
export const BLE_CONNECTION_TIMEOUT = 5000;

const DEF_LINEAR_TABLE = '4v';

/* TShell */

export enum TShellNotify
    {Shutdown, Disconnected, NoLoad, Stopped, Intensity, HardwareError, LowBattery, Battery, Ticking}
export type TShellNotifyEvent = Subject<TShellNotify>;

export class TShell extends TAbstractShell implements IShell
{
    /// @override
    static Get(DeviceId: string): TShell
    {
        let RetVal = this.Cached.get(DeviceId);

        if (! TypeInfo.Assigned(RetVal))
        {
            if (DeviceId === 'USB')
            {
                if (! TypeInfo.Assigned(this.UsbProxy))
                    this.UsbProxy = new TProxyUsbShell();
                RetVal = new this(this.UsbProxy, DeviceId);
            }
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

    static RunningInstance: TShell | undefined;
    static DefaultFileList: Array<string> = [];
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
    LastFileMd5: string;
    DefaultFileMd5: string;

    private Proxy: IProxyShell | undefined;

    private _Version: number;
    private _BatteryLevel: number;

    private _Intensity: number = 0;
    private IntensityChanging: Promise<any> | undefined;

    private _Ticking: number = 0;
    private TickIntervalId: any = null;

    // private _DefaultFileList: Array<string> = ['shoulder', 'sore', 'pain'];

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
            return Promise.reject(new EAbort());
    }

    Disconnect(): Promise<void>
    {
        if (TypeInfo.Assigned(this.Proxy))
            return this.Proxy.Disconnect();
        else
            return Promise.reject(new EAbort());
    }

    Execute(Cmd: string, Timeout: number = 0, IsResponseCallback: (Line: string) => boolean): Promise<any>
    {
        if (TypeInfo.Assigned(this.Proxy))
            return this.Proxy.Execute(Cmd, Timeout, IsResponseCallback);
        else
            return Promise.reject(new EAbort());
    }

    RequestStart(RequestClass: typeof TShellRequest, Timeout: number = 0, ...args: any[]): Promise<TShellRequest>
    {
        if (TypeInfo.Assigned(this.Proxy))
            return this.Proxy.RequestStart(RequestClass, Timeout, this, ...args);
        else
            return Promise.reject(new EAbort());
    }

/** shell functions */

    Shutdown(): Promise<void>
    {
        return this.StopOutput();
        // return this.Execute('>shdn', REQUEST_TIMEOUT).catch(err => console.log('shutdown.err:' + err.message));
    }

    Reset()
    {
        return this.Execute('>rst', 10, Line => true).catch(err => {});
    }

    SetLinearTable(n: TLinearTable): Promise<void>
    {
        let Idx = 3;
        switch (n)
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
            if (Idx < (this.constructor as typeof TShell).DefaultFileList.length)
                (this.constructor as typeof TShell).DefaultFileList[Idx] = FileName;
            else
                (this.constructor as typeof TShell).DefaultFileList.push(FileName);
        });
    }

    ListDefaultFile(): Promise<Array<string>>
    {
        return this.RequestStart(TListDefaultFile, REQUEST_TIMEOUT)
            .then(Request => Request.toPromise() as Promise<Array<string>>)
            .then(List =>
            {
                // this._DefaultFileList = List;
                (this.constructor as typeof TShell).DefaultFileList = List;
                return List;
            });
    }

    FileMd5(FileName: string): Promise<string>
    {
        return this.Execute('>md5 ' + FileName, REQUEST_TIMEOUT, Line => {return true; });
    }

    CatFile(s: IScriptFile): Promise<Observable<number>>
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
        return this.RequestStart(TClearFileSystemRequest, REQUEST_TIMEOUT, ExcludeFiles.concat((this.constructor as typeof TShell).DefaultFileList))
            .then(Request => Request.toPromise())
            .then(() => {});
    }

    StartScriptFile(s: IScriptFile): Promise<void>
    {
        return this.Execute('>ssta ' + s.Name, REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line))
            .then(() =>
            {
                this.RefFile = s;
                (this.constructor as typeof TShell).RunningInstance = this;
            })
            .then(() =>
            {
                this._Intensity = 1;
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity));
            })
            .then(() => this.StartTicking());
    }

    StopOutput()
    {
        return this.Execute('>osto', REQUEST_TIMEOUT, Line => this.IsStatusRetVal(Line))
            .then(() => this.StopTicking());
    }

    SetIntensity(Value: number): void
    {
        if (! this.IsAttached)
            return;
        if (Value < 1 || Value > 60) // this._Intensity === 0 ||
            return;

        if (TypeInfo.Assigned(this.IntensityChanging))
            return;

        this.IntensityChanging = this.Execute('>str ' + Value, REQUEST_TIMEOUT,
            (Line: string): boolean =>
            {
                let strs = Line.split('=');
                if (strs.length === 2 && strs[0] === 'str')
                {
                    this._Intensity = parseInt(strs[1], 10);
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
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity));
                return this._Intensity;
            })
            .catch(err => console.log(err.message))
            .then(() => this.IntensityChanging = undefined);
    }

    OTARequest(Firmware: ArrayBuffer): Promise<TShellRequest>
    {
        return this.RequestStart(TOTARequest, REQUEST_TIMEOUT, Firmware);
    }

    get Ticking(): number
    {
        if (this._Ticking !== 0)
        {
            let dt = new Date();
            return Math.trunc((dt.getTime() -  this._Ticking) / 1000);
        }
        else
            return 0;
    }

    get TickingDownHint(): string
    {
        let RetVal = '';

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

    // get DefaultFileList(): Array<string>
    // {
    //     return this._DefaultFileList;
    // }

    private StatusRequest(): Promise<void>
    {
        return this.Execute('>stat', REQUEST_TIMEOUT, Line => (Line.indexOf('tick', 0) !== -1 || Line.indexOf('md5', 0) !== -1))
            .then(Line =>
            {
                let strs = Line.split(',');
                for (let str of strs)
                {
                    let keyvalue = str.split('=');
                    if (keyvalue.length > 1)
                    {
                        switch (keyvalue[0])
                        {
                        case 'tick':
                            let ticking = parseInt(keyvalue[1], 10);
                            if (ticking !== 0)
                                this.StartTicking(ticking);
                            break;

                        case 'str':
                            this._Intensity = parseInt(keyvalue[1], 10);
                            break;

                        case 'dmd5':
                            this.DefaultFileMd5 = keyvalue[1].toUpperCase();
                            break;

                        case 'md5':
                        case 'lmd5':
                            this.LastFileMd5 = keyvalue[1].toUpperCase();
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
                setTimeout(() => this.OnNotify.next(TShellNotify.Battery));
                return this._BatteryLevel;
            })
        */
    }

    /*
    private IntensityRequest(): Promise<number>
    {
        let strs: string[];

        return this.Execute('>str', REQUEST_TIMEOUT,
            Line =>
            {
                strs = Line.split('=');
                return strs.length > 1 && strs[0] === 'str';
            })
            .then(Line =>
            {
                this._Intensity = parseInt(strs[1]);
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity));
                return this._Intensity;
            })
    }
    */

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
                this._Version = (parseInt(keyvalue[1], 10) * 1000 + parseInt(keyvalue[2], 10)) * 10000 + parseInt(keyvalue[3], 10);
                console.log('firmware version: ' + this._Version);
                return this._Version;
            });
    }

    private StartTicking(Shift: number = 0): void
    {
        let dt = new Date();
        this._Ticking = dt.getTime() - Shift * 1000;

        this.TickIntervalId = setInterval(() =>
        {
            setTimeout(() => this.OnNotify.next(TShellNotify.Ticking));

            let Duration = (this.RefFile.Duration ? this.RefFile.Duration : 0);
            if (Duration <= this.Ticking && this.OnNotify.observers.length === 0)
                this.Detach();
        }, 1000);
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
            return ! isNaN(parseInt(Status, 10));
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
            .then(() =>
                this.VersionRequest())
            .then(ary =>
                this.StatusRequest())
            .then(() =>
            {
                let SelfType = this.constructor as typeof TShell;

                if (SelfType.LinearTable !== DEF_LINEAR_TABLE)
                    return this.SetLinearTable(SelfType.LinearTable);
            });
    }

    _DeviceDisconnected(Proxy: IProxyShell)
    {
        if (Proxy !== this.Proxy)
            return;

        this._DeviceNotification(Proxy, ['NOTIFY', 'disconnect']);
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
                    .then((level: number) =>
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

        switch (Params[1])
        {
        case 'disconnect':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.Disconnected));
            this.Detach();
            break;

        case 'shutdown':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.Shutdown));
            this.Detach();
            break;

        case 'noload':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.NoLoad));
            this.Detach();
            break;

        case 'low': // battery':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.LowBattery));
            this.Detach();
            break;

        case 'error': // stop':
            this.StopTicking();
            setTimeout(() => this.OnNotify.next(TShellNotify.HardwareError));
            this.Detach();
            break;

        case 'stop':
            this.StopTicking();
            setTimeout(() => (this.OnNotify.next(TShellNotify.Stopped)));
            break;

        case 'strength':
            this._Intensity = parseInt(Params[2], 10);
            if (this._Intensity >= 0)
                setTimeout(() => this.OnNotify.next(TShellNotify.Intensity));
            break;
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
    protected OnConnectionTimeout(): void
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
    protected OnConnectionTimeout(): void
    {
        (this.Owner as TShell)._DeviceTimeout(this);
        super.OnConnectionTimeout();
    }
}
