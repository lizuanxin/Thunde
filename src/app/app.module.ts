import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {TranslateModule} from "../UltraCreation/ng-ion/translate";

import {TApplication} from "../providers/application";
import {TAssetService} from '../providers/asset';
import {TDistributeService} from '../providers/distribute'

import {MyApp} from './app.component';

import {TouPage} from '../pages/tou/tou';
import {HomePage} from '../pages/home/home';
import {GoPage} from '../pages/go/go';
import {RunningPage} from '../pages/running/running';
import {OtaUpdatePage} from '../pages/ota_update/ota_update';

import {DemoPage} from '../pages/demo/demo';
import {DemoModeRunningPage} from '../pages/demo/demo_mode_running';
import * as Cmp from '../components/components';

let config = {  // http://ionicframework.com/docs/v2/api/config/Config/
    //iconMode: 'ios',
    activator: 'none',     // "ripple", "highlight"
    // pageTransition: 'ios-transition',
    pageTransitionDelay: 0,
    swipeBackEnabled: false,
    // statusbarPadding: true,
    // animate: false,
    platforms: {
      android: {
        statusbarPadding: true
      }
    }
};

@NgModule({
    imports: [
        BrowserModule,
        IonicModule.forRoot(MyApp, config),
        TranslateModule.forRoot()
    ],
    bootstrap: [IonicApp],

    declarations: [
        MyApp,
        HomePage, TouPage, GoPage, RunningPage, OtaUpdatePage,
        DemoPage, DemoModeRunningPage,
        Cmp.IntensityDial, Cmp.FileListDial, Cmp.FileListBody
    ],

    entryComponents: [
        MyApp,
        HomePage, TouPage, GoPage, RunningPage, OtaUpdatePage,
        DemoPage, DemoModeRunningPage
    ],

    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        TApplication, TAssetService, TDistributeService,
    ],
})
export class AppModule {}
