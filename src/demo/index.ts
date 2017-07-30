import {NgModule} from '@angular/core';

import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '@ngx-translate/core';

import {SharedModule} from '../shared';

import {StartPage} from './start/start';
import {DemoRunningPage} from './running/running';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
        SharedModule,
],
    exports: [
        StartPage
    ],
    declarations: [
        StartPage, DemoRunningPage
    ],
    entryComponents: [
        StartPage, DemoRunningPage
    ]
})
export class DemoModule
{
}

export {StartPage};
