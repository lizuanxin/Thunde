import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '../../UltraCreation/ng-ion/translate'
import {ProfileComp} from './Profile'

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
    ],
    exports: [
        ProfileComp
    ],
    declarations: [
        ProfileComp
    ],
    entryComponents: [
    ]
})
export class ProfileModule
{
}
