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

            Svc.Initialization.Execute()
                .then(() =>
                {
                    this.rootPage = HomePage;

                    setTimeout(() =>
                    {
                        SplashScreen.hide();
                        
                        if (App.IsIos)
                        {
                            StatusBar.overlaysWebView(false);
                            StatusBar.backgroundColorByHexString('#6590f7');
                            // StatusBar.styleBlackTranslucent();
                            // StatusBar.overlaysWebView(true);
                        }
                        else
                        {
                            StatusBar.overlaysWebView(true);
                            let StatusbarTransparent = (window as any).statusbarTransparent;
                            if (StatusbarTransparent)
                                StatusbarTransparent.enable();
                        }
                        StatusBar.show();
                    }, 500);
                });
        });
    }

    rootPage: any;
}
