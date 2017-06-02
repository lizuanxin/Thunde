import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '../UltraCreation/ng-ion/translate'

import {ScanBleComp} from './scan.ble';
import {IntensityDialComp} from './intensity.dial';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
    ],
    exports: [
        ScanBleComp, IntensityDialComp,
    ],
    declarations: [
        ScanBleComp, IntensityDialComp,
    ],
    entryComponents: [
    ]
})
export class ComponentModule
{
}
