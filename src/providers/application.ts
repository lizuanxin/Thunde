import {Injectable} from '@angular/core';
import {App, Toast,Platform} from 'ionic-angular';

import {TLocalizeService} from "./localize"
import {TSqliteStorage} from '../UltraCreation/Storage';
import {TAppController} from '../UltraCreation/ng2-ion/ion-appcontroller'
import {const_data} from './thunderbolt.const'

@Injectable()
export class TApplication extends TAppController
{
    constructor(public Instance: App, public Localize: TLocalizeService,private platform: Platform)
    {
        super(Instance);
        this.Skins = this.warm.concat(this.deep);
        console.log('TApplication construct');
    }

    static Initialize(Storage: TSqliteStorage): Promise<void>
    {
        return Storage.Get('accepted terms')
            .then(value => this.AcceptedTerms = value ==='yes')
            .catch(err => { })
            .then(() =>Storage.Get('Skin'))
            .then(Name => this.SkinName = Name)
            .catch(err => { })
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
        let msg = this.Localize.Translate('hint.' + Id) as string;

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

        let Storage = new TSqliteStorage(const_data.DatabaseName);
        Storage.Set('Skin', Name);
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

    get IsAndroid(): boolean
    {        
        if (this.platform.is('android'))
            return true;
        else
            return false;
    }

    public Skins: Array<string>;    
    private static SkinName: string = 'abstract';
    private deep = ['abstract', 'BlackRed','spots'];
    private warm = ['strengths'];
}
