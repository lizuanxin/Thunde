import {Component} from '@angular/core';

import {SplashScreen} from '../UltraCreation/Native/SplashScreen';
import {StatusBar} from '../UltraCreation/Native/StatusBar';

import {HomePage} from '../home';
import * as Svc from '../providers';

@Component({template: `<ion-nav [root]="rootPage"></ion-nav>`})
export class MyApp
{
    constructor(App: Svc.TApplication)
    {
        App.Platform.ready().then((PlatformName) =>
        {
            StatusBar.hide();
            SplashScreen.show();

            if (PlatformName === 'dom')
                Svc.TGatt.BrowserFakeDevice = true;

            if (App.IsIos)
                StatusBar.styleBlackTranslucent();

            Svc.Initialization.Execute()
                .then(() =>
                {
                    this.rootPage = HomePage;

                    setTimeout(() =>
                    {
                        SplashScreen.hide();
                        StatusBar.overlaysWebView(true);
                        let StatusbarTransparent = (window as any).statusbarTransparent;
                        if (StatusbarTransparent)
                            StatusbarTransparent.enable();
                        StatusBar.show();
                    }, 500);
                });
        });
    }

    rootPage: any;
}
