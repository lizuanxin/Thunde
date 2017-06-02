import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '../UltraCreation/ng-ion/translate'


import {ScanDeviceComp} from './ScanDevice';
import {IntensityDialComp} from './intensity.dial';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
    ],
    exports: [
        ScanDeviceComp, IntensityDialComp,
    ],
    declarations: [
        ScanDeviceComp, IntensityDialComp,
    ],
    entryComponents: [
    ]
})
export class ComponentModule
{
}
