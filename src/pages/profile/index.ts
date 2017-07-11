import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '@ngx-translate/core'
import {ComponentModule} from '../../components'

import {ProfilePage} from './profile'
import {TouPage} from './tou/tou'
import {FaqPage} from './faq/faq'

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
    ],
    entryComponents: [
        ProfilePage, TouPage, FaqPage,
    ]
})
export class ProfileModule
{
}

export {TouPage, FaqPage}
