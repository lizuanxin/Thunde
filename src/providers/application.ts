import {Injectable, Injector} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {TSqliteStorage} from '../UltraCreation/Storage';
import {TAppController} from '../UltraCreation/ng-ion/appcontroller'
import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import * as USBSerial from '../UltraCreation/Native/UsbSerialOTG';

import {TShell, TShellNotify} from './loki/shell';
import {TScriptFile} from './asset';

import {translate_en, translate_zh} from './localize'

@Injectable()
export class TApplication extends TAppController
{
    constructor(Injector: Injector)
    {
        super(Injector);

        this.Skins = this.warm.concat(this.deep);
        this.AddLanguage('zh', translate_zh);
        this.AddLanguage('en', translate_en);

        /*
        let codes = navigator.language.split('-');
        this.Language = codes[0]; */

        console.log('TApplication construct');

        let ts = new Date().getTime();
        this.Platform.ready()
            .then(() =>
            {
                this.Platform.registerBackButtonAction(() =>
                {
                    if (this.HardwareBackButtonDisabled)
                    {
                        console.log('Hardware GoBack is Disabled');
                        return;
                    }
                    console.log('Hardware GoBack');

                    let nav = this.Instance.getActiveNav();
                    if (nav.canGoBack())
                    {
                        nav.pop();
                        return;
                    }

                    let now = new Date().getTime();
                    if (now - ts > 500)
                    {
                        if (now - ts > 3000)
                            this.ShowToast(this.Translate('hint.back_twice_exit'));
                        ts = now;
                    }
                    else
                    {
                        this.Destory();
                        this.Platform.exitApp();
                    }
                })
            })
    }

    static Initialize(Storage: TSqliteStorage): Promise<void>
    {
        this.Storage = Storage;

        return Storage.Get('accepted terms')
            .then(value => this.AcceptedTerms = value ==='yes')
            .catch(err => { })
    }

    DisableHardwareBackButton()
    {
        this.HardwareBackButtonDisabled = true;
    }

    EnableHardwareBackButton()
    {
        this.HardwareBackButtonDisabled = false;
    }

    IsSupportedOTG(): Promise<boolean>
    {
        if (this.IsIos)
            return Promise.resolve(true);
        else
            return USBSerial.OTG.IsSupported();
    }

    get AcceptedTerms(): boolean
    {
        return TApplication.AcceptedTerms;
    }

    set AcceptedTerms(Value: boolean)
    {
        if (Value)
        {
            let Storage = (this.constructor as typeof TApplication).Storage;
            Storage.Set('accepted terms', 'yes')
                .then(() => TApplication.AcceptedTerms = true);
        }
    }

    ShowToast(MsgOrConfig: string | Object): Promise<any>
    {
        if (MsgOrConfig instanceof Object)
            return super.ShowToast(MsgOrConfig)
        else
            return super.ShowToast({message: MsgOrConfig, position: 'center', cssClass: 'toast-s1', duration: 1500});
    }

    ShowLoading(MsgOrConfig?: string | Object): Promise<any>
    {
        if (MsgOrConfig instanceof Object)
            return super.ShowLoading(MsgOrConfig)
        else
            return super.ShowLoading({spinner: 'crescent', content: MsgOrConfig, cssClass: 'loading-s1'});
    }

    ShowError(err: any,
        duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'middle'): Promise<void>
    {
        return super.ShowError(err, {
            duration: duration, position: position,
            style: 'toast-s1',  prefix_lang: 'hint.'});
    }

    Skin(Page: string): string
    {
        if (Page)
            return (this.constructor as typeof TApplication).SkinName + '-' + Page;
        else
            return (this.constructor as typeof TApplication).SkinName + '-default';
    }

    get SkinName(): string
    {
        return (this.constructor as typeof TApplication).SkinName;
    }

    SetSkin(Name: string): void
    {
        (this.constructor as typeof TApplication).SkinName = Name;
    }

    get SkinBorderColor(): string {
        if (this.warm.indexOf((this.constructor as typeof TApplication).SkinName) === -1)
            return 'border-light';
    }

    get SkinColor(): string
    {
        if (this.warm.indexOf((this.constructor as typeof TApplication).SkinName) === -1)
            return 'text-light';
    }

    get SkinShadowColor(): string
    {
        if (this.warm.indexOf((this.constructor as typeof TApplication).SkinName) === -1)
            return '#000000';
        else
            return '#FFFFFF';
    }

    get SkinClass(): string
    {
        let skinName = (this.constructor as typeof TApplication).SkinName;
        return 'skin-' + skinName + '';
    }

    get SkinConFooter(): string
    {
        if (this.warm.indexOf((this.constructor as typeof TApplication).SkinName) === -1)
            return 'light';
        else
            return 'dark';
    }

    // Shell

    GetShell(DeviceId: string): TShell
    {
        let Shell = TShell.Get(DeviceId);

        this.ClearResumeDatas();

        if (TypeInfo.Assigned(this.CurrentRunningShell))
        {
            if (this.CurrentRunningShell.DeviceId !== DeviceId)
            {
                this.CurrentRunningShell.Detach();
                this.CurrentRunningShell = Shell;
            }
        }
        else
            this.CurrentRunningShell = Shell;

        console.log("Shell:" + Shell +　"  CurrentShell:" + this.CurrentRunningShell);
        return this.CurrentRunningShell;
    }

    SetRunningBackground(DeviceId: string, ScriptFile: TScriptFile)
    {
        // if (TypeInfo.Assigned(this.Resume))
        // {
        //     if (this.Resume.DeviceId === 'USB' && DeviceId === 'USB')
        //     {
        //         this.ClearResumeDatas();
        //     }
        //     else if (this.Resume.DeviceId !== DeviceId)
        //     {
        //         this.Destory(this.Resume.DeviceId);
        //     }
        // }

        this.Resume = {DeviceId: DeviceId, ScriptFile: ScriptFile};
        this._BackgroundRunning = true;

        let that = this;
        this.Listenter = this.CurrentRunningShell.OnNotify.subscribe(
            Notify =>
            {
                switch(Notify)
                {
                case TShellNotify.Shutdown:
                    OnEvent('shutdown');
                    break;
                case TShellNotify.Disconnected:
                    OnEvent('disconnected');
                    break;
                case TShellNotify.LowBattery:
                    OnEvent('low_battery');
                    break;
                case TShellNotify.HardwareError:
                    OnEvent('hardware_error');
                    break;
                case TShellNotify.Stopped:
                    OnEvent('');
                    break;
                case TShellNotify.NoLoad:
                    OnEvent('no_load');
                    break;

                case TShellNotify.Ticking:
                    // console.log("Resume.Ticking:" + this.CurrentRunningShell.Ticking);

                    if (this.CurrentRunningShell.Ticking >= ScriptFile.Duration)
                    {
                        this.ClearResumeDatas();
                        this.CurrentRunningShell.StopOutput()
                            .catch(err => console.log(err.message))
                            .then(() => OnEvent('file_finish'));
                    }
                    break;
                }
            },
            err => console.log(err.message));

        function OnEvent(Message: string)
        {
            console.log("OnEvent.Message:" + Message);
            that.ClearResumeDatas();
            that.Destory();
        }
    }

    get ResumeRunningDatas(): {DeviceId: string, ScriptFile: TScriptFile}
    {
        console.log("ResumeRunning");
        let RetVal = null;
        if (TypeInfo.Assigned(this.Resume) &&
            TypeInfo.Assigned(this.CurrentRunningShell) &&
            this.Resume.ScriptFile.Duration - this.CurrentRunningShell.Ticking > 10)
        {
            RetVal = this.Resume;
        }

        this.ClearResumeDatas();
        return RetVal;
    }

    Destory()
    {
        if (TypeInfo.Assigned(this.CurrentRunningShell))
        {
            this.CurrentRunningShell.Detach();
            this.CurrentRunningShell = null;
        }
    }

    private ClearResumeDatas()
    {
        this.Resume = null;
        this._BackgroundRunning = false;

        if (TypeInfo.Assigned(this.Listenter))
        {
            this.Listenter.unsubscribe();
            this.Listenter = null;
        }
    }

    get IsRunning(): boolean
    {
        return this._BackgroundRunning;
    }

    get BackgroundTickingDownHint(): string
    {
        let Hint = "";

        if (TypeInfo.Assigned(this.CurrentRunningShell))
            Hint = this.CurrentRunningShell.TickingDownHint;

        return Hint;
    }

    private _BackgroundRunning: boolean = false;
    private Listenter: Subscription;
    private Resume: {DeviceId: string, ScriptFile: TScriptFile};
    private CurrentRunningShell: TShell;

    public Skins: Array<string>;
    private deep = ['abstract', 'BlackRed', 'spots'];
    private warm = ['strengths'];
    private HardwareBackButtonDisabled = false;

    private static AcceptedTerms: boolean = false;
    private static SkinName: string = 'skin';
    private static Storage: TSqliteStorage;
}
