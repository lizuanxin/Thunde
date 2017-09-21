import {Injectable, Injector} from '@angular/core';

import {TAppController} from '../UltraCreation/ng-ion/appcontroller';
import * as USB from '../UltraCreation/Native/USB';
import {TypeInfo} from '../UltraCreation/Core/TypeInfo';

import {translate_en, translate_zh_cn, translate_zh_hk} from './localize';
import {TShell} from './loki/shell';

declare global
{
    /* extends Application to window global variable */
    var App: TApplication | undefined;

    interface Window
    {
        App: TApplication | undefined;
    }
}

@Injectable()
export class TApplication extends TAppController
{
    constructor(Injector: Injector)
    {
        super(Injector);

        console.log('TApplication: initialize Application Global Variable');
        window.App = this;

        this.InitLanguage();
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

                    if (App.Nav.canGoBack())
                    {
                        App.Nav.pop();
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
                });
            });
    }

    private InitLanguage()
    {
        // this.AddLanguage('en', translate_en);
        this.AddLanguage('zh_cn', translate_zh_cn);
        let CurLanguage = this.Translation.getBrowserCultureLang().toLowerCase().replace('-', '_');
        console.log('CurLanguage:' + CurLanguage);

        switch (CurLanguage)
        {
            case 'zh_tw':
            case 'zh_hk':
                this.AddLanguage('zh_hk', translate_zh_hk);
                this.Language = 'zh_hk';
                break;

            // case 'zh_cn':
            //     this.AddLanguage('zh_cn', translate_zh_cn);
            //     this.Language = 'zh_cn';
            //     break;

            default:
                this.Language = 'zh_cn';
                break;
        }
    }

    static Initialize(): Promise<void>
    {
        return StorageEngine.Get('accepted terms')
            .then(value => { this.AcceptedTerms = value === 'yes'; })
            .catch(err => { });
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
            return USB.OTG.IsSupported();
    }

    get AcceptedTerms(): boolean
    {
        return TApplication.AcceptedTerms;
    }

    set AcceptedTerms(Value: boolean)
    {
        if (Value)
        {
            StorageEngine.Set('accepted terms', 'yes')
                .then(() => TApplication.AcceptedTerms = true);
        }
    }

    ShowToast(MsgOrConfig: string | Object): Promise<any>
    {
        if (MsgOrConfig instanceof Object)
            return super.ShowToast(MsgOrConfig);
        else
            return super.ShowToast({message: MsgOrConfig, position: 'center', cssClass: 'toast-s1', duration: 1500});
    }

    ShowLoading(MsgOrConfig?: string | Object): Promise<any>
    {
        if (MsgOrConfig instanceof Object)
            return super.ShowLoading(MsgOrConfig);
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


    private HardwareBackButtonDisabled = false;
    private static AcceptedTerms: boolean = false;
}
