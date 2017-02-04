import {Component} from '@angular/core';
import {Platform} from 'ionic-angular';
import {Splashscreen} from 'ionic-native/dist/es5/plugins/splashscreen';
import {StatusBar} from 'ionic-native/dist/es5/plugins/statusbar';
//import {Splashscreen, StatusBar} from 'ionic-native';

import {HomePage} from '../pages/home/home';
import {Initialization} from '../pages/services'

@Component({template: `<ion-nav [root]="rootPage"></ion-nav>`})
export class MyApp
{
    constructor(platform: Platform)
    {
        platform.ready().then(() =>
        {
            Splashscreen.show();

            StatusBar.styleDefault();
            StatusBar.hide();

            Initialization.Execute()
                .then(() =>
                {
                    this.rootPage = HomePage;
                    setTimeout(() => Splashscreen.hide(), 500);
                });
        });
    }

    rootPage: any;
}
