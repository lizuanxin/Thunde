import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular'
import {TranslateModule} from '../UltraCreation/ng-ion/translate';

import {MyApp} from './app.component';

import * as View from '../pages'
import * as Cmp from '../components';
import * as Svc from '../providers'

let config = {  // http://ionicframework.com/docs/v2/api/config/Config/
    //iconMode: 'ios',
    activator: 'none',     // "ripple", "highlight"
    pageTransition: 'ios-transition',
    backButtonText: '',
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
        TranslateModule.forRoot(),

        Cmp.ComponentModule,
        View.TensModule, View.ProfileModule,
    ],
    bootstrap: [IonicApp],

    declarations: [
        MyApp,
        View.HomePage
    ],

    entryComponents: [
        MyApp,
        View.HomePage,
    ],

    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        Svc.TApplication, Svc.TAssetService, Svc.TDistributeService,
    ],
})
export class AppModule {}
