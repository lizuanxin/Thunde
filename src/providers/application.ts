import {Injectable, Injector} from '@angular/core';

import {TSqliteStorage} from '../UltraCreation/Storage';
import {TAppController} from '../UltraCreation/ng-ion/appcontroller'
import * as USBSerial from '../UltraCreation/Native/UsbSerialOTG';

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
                            this.ShowError('back_twice_exit', 1500, 'bottom');
                        ts = now;
                    }
                    else
                        this.Platform.exitApp();
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

    ShowLoading(Msg?: string): Promise<any>
    {
        return super.ShowLoading({spinner: 'crescent', content: Msg, cssClass: 'loading-s1'});
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

    public Skins: Array<string>;
    private deep = ['abstract', 'BlackRed', 'spots'];
    private warm = ['strengths'];
    private HardwareBackButtonDisabled = false;

    private static AcceptedTerms: boolean = false;
    private static SkinName: string = 'skin';
    private static Storage: TSqliteStorage;
}
