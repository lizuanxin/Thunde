import {Injectable, Injector} from '@angular/core';
import {Toast} from 'ionic-angular';

import {TSqliteStorage} from '../UltraCreation/Storage';
import {USBSerial} from '../UltraCreation/Native';
import {TAppController} from '../UltraCreation/ng2-ion/ion-appcontroller'

import {translate_en, translate_zh} from './localize'

@Injectable()
export class TApplication extends TAppController
{
    constructor(Injector: Injector)
    {
        super(Injector);

        this.Skins = this.warm.concat(this.deep);
        this.AddLanguage('en', translate_en);
        this.AddLanguage('zh', translate_zh);

        console.log(navigator.language);
        let codes = navigator.language.split('-');
        this.Language = codes[0];

        console.log('TApplication construct');

        let ts = new Date().getTime();
        this.Platform.ready()
            .then(() =>
            {
                this.Platform.registerBackButtonAction(() =>
                {
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
                        ts = now;
                        this.ShowHintId('back_twice_exit', 'bottom', 1500);
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

    private static AcceptedTerms: boolean = false;

    ShowLoading(Msg?: string): Promise<any>
    {
        return super.ShowLoading({spinner: 'crescent', content: Msg, cssClass: 'loading-s1'});
    }

    ShowHintId(Id: string, Position: 'top' | 'bottom' | 'middle' = 'middle', Duration = 3000): Promise<Toast>
    {
        let msg = this.Translate('hint.' + Id) as string;

        if (msg !== '')
            return this.ShowToast({message: msg, position: Position, cssClass: 'toast-s1', duration: Duration});
        else
            return Promise.resolve(null);
    }

    Skin(Page: string): string
    {
        return (this.constructor as typeof TApplication).SkinName + '-' + Page;
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

    private static SkinName: string = 'strengths';
    private static Storage: TSqliteStorage;
}
