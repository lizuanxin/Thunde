import {Injectable, Injector} from '@angular/core';

import {TSqliteStorage} from '../UltraCreation/Storage';
import {TAppController} from '../UltraCreation/ng-ion/appcontroller'

import * as USBSerial from '../UltraCreation/Native/UsbSerialOTG';
import {TypeInfo} from '../UltraCreation/Core/TypeInfo'

import {translate_en, translate_zh} from './localize'
import {TShell} from './loki/shell'

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
                        if (TypeInfo.Assigned(TShell.RunningInstance))
                        {
                            TShell.RunningInstance.Detach();
                            TShell.RunningInstance = undefined;
                        }

                        this.Platform.exitApp();
                    }
                })
            })
    }

    static Initialize(Storage: TSqliteStorage): Promise<void>
    {
        this.Storage = Storage;

        return Storage.Get('accepted terms')
            .then(value => { this.AcceptedTerms = value ==='yes'; })
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
        else
            return '';
    }

    get SkinColor(): string
    {
        if (this.warm.indexOf((this.constructor as typeof TApplication).SkinName) === -1)
            return 'text-light';
        else
            return '';
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

    public Skins: Array<string>;
    private deep = ['abstract', 'BlackRed', 'spots'];
    private warm = ['strengths'];
    private HardwareBackButtonDisabled = false;

    private static AcceptedTerms: boolean = false;
    private static SkinName: string = 'skin';
    private static Storage: TSqliteStorage;
}
