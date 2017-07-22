import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular'
import {TranslateModule} from '@ngx-translate/core';

import {MyApp} from './app.component';
import {HomeModule} from '../home';

import * as Svc from '../providers'

let config = {  // http://ionicframework.com/docs/v2/api/config/Config/
    // iconMode: 'ios',
    activator: 'none',     // "ripple", "highlight"
    // pageTransition: 'ios-transition',
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
        HomeModule,
    ],
    bootstrap: [IonicApp],

    declarations: [
        MyApp,
    ],

    entryComponents: [
        MyApp,
    ],

    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        Svc.TApplication, Svc.TAssetService,
    ],
})
export class AppModule {}
