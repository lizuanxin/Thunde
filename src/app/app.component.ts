import {Component} from '@angular/core';
import {Platform} from 'ionic-angular';

import {SplashScreen} from '../UltraCreation/Native/SplashScreen';
import {StatusBar} from '../UltraCreation/Native/StatusBar';
import {HomePage} from '../pages/home/home';
import {Initialization} from '../pages/services'

@Component({template: `<ion-nav [root]="rootPage"></ion-nav>`})
export class MyApp
{
    constructor(platform: Platform)
    {
        platform.ready().then(() =>
        {
            StatusBar.hide();
            SplashScreen.show();

            if (platform.is('ios'))
            {
                StatusBar.styleBlackTranslucent();
            }
            Initialization.Execute()
                .then(() =>
                {
                    this.rootPage = HomePage;
                    setTimeout(() =>
                    {
                        SplashScreen.hide();
                        StatusBar.overlaysWebView(true);
                        let StatusbarTransparent = (window as any).statusbarTransparent;
                        if(StatusbarTransparent)
                            StatusbarTransparent.enable();
                        StatusBar.show();
                    }, 500);
                });
        });
    }

    rootPage: any;
}
