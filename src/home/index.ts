import {NgModule} from '@angular/core';

import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '@ngx-translate/core';

import {SharedModule} from '../shared';
import {ProfileModule} from '../profile';
import {DemoModule} from '../demo';

import {HomePage} from './home';

import {RunningPage} from './running/running';
import {OtaPage} from './ota/ota';
import {DownloadPage} from './download/download';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
        SharedModule,
        ProfileModule,
        DemoModule,
    ],
    exports: [
        HomePage
    ],
    declarations: [
        HomePage,
        RunningPage, OtaPage, DownloadPage,
    ],
    entryComponents: [
        HomePage,
        RunningPage, OtaPage, DownloadPage,
    ]
})
export class HomeModule
{
}

export {HomePage, RunningPage, OtaPage, DownloadPage};
