import {Injectable, Injector} from '@angular/core';
import {Toast} from 'ionic-angular';

import {TSqliteStorage} from '../UltraCreation/Storage';
import {USBSerial} from '../UltraCreation/Native';
import {TAppController} from '../UltraCreation/ng2-ion/ion-appcontroller'

import {const_data} from './thunderbolt.const'
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

        console.log('TApplication construct');
    }

    static Initialize(Storage: TSqliteStorage): Promise<void>
    {
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
            let Storage = new TSqliteStorage(const_data.DatabaseName);
            Storage.Set('accepted terms', 'yes')
                .then(() => TApplication.AcceptedTerms = true);
        }
    }

    private static AcceptedTerms: boolean = false;

    ShowLoading(Msg?: string): Promise<any>
    {
        return super.ShowLoading({spinner: 'crescent', content: Msg, cssClass: 'loading-s1'});
    }

    ShowHintId(Id: string, Animate: boolean = true): Promise<Toast>
    {
        let msg = this.Translate('hint.' + Id) as string;

        if (msg !== '')
            return this.ShowToast({ message: msg, position: 'middle', cssClass: 'toast-s1', duration: 3000 });
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
        // let Storage = new TSqliteStorage(const_data.DatabaseName);
        // Storage.Set('Skin', Name);
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
    private static SkinName: string = 'abstract';
    private deep = ['abstract', 'BlackRed','spots'];
    private warm = ['strengths'];
}
