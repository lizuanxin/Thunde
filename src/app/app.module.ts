import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';

import {CommonModule} from './module.common'

import {TAssetService} from '../providers/asset';
import {TDistributeService} from '../providers/distribute'
import {TLocalizeService} from '../providers/localize'

import {MyApp} from './app.component';
import {AgreementPage} from '../pages/agreement/agreement';
import {HomePage} from '../pages/home/home';
import {SkinPage} from '../pages/skin/skin';
import {GoPage} from '../pages/go/go';
import {RunningPage} from '../pages/running/running';

let config = {  // http://ionicframework.com/docs/v2/api/config/Config/
    prodMode: true,
    //iconMode: 'ios',
    activator: 'none',     // "ripple", "highlight"
    pageTransition: 'ios',
    pageTransitionDelay: 0,
    // animate: false,
};

@NgModule({
    imports: [
        IonicModule.forRoot(MyApp, config),
        CommonModule,
    ],
    bootstrap: [IonicApp],

    declarations: [
        MyApp,
        HomePage, AgreementPage, SkinPage, GoPage, RunningPage,
    ],

    entryComponents: [
        MyApp,
        HomePage, AgreementPage, SkinPage, GoPage, RunningPage,
    ],

    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        TLocalizeService, TAssetService, TDistributeService
    ],
})
export class AppModule {}
