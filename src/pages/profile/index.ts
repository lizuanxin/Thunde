import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '../../UltraCreation/ng-ion/translate'
import {ComponentModule} from '../../components'

import {ProfilePage} from './Profile'
import {TouPage} from './tou/tou'
import {FaqPage} from './faq/faq'

import {DemoPage} from './demo/demo'
import {DemoModeRunningPage} from './demo/demo_mode_running'

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule, ComponentModule,
    ],
    exports: [
        ProfilePage
    ],
    declarations: [
        ProfilePage, TouPage, FaqPage,
        DemoPage, DemoModeRunningPage
    ],
    entryComponents: [
        ProfilePage, TouPage, FaqPage,
        DemoPage, DemoModeRunningPage
    ]
})
export class ProfileModule
{
}


export {TouPage, FaqPage}
