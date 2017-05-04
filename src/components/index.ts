import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '../UltraCreation/ng-ion/translate'

import {SwiperComp} from './Swiper'

import {FileListDialComp} from './FileListDial';
import {FileListBodyComp} from './FileListBody';
import {FileListCardComp} from './FileListCard';

import {ScanDeviceComp} from './ScanDevice';
import {IntensityDialComp} from './IntensityDial';
import {ProfileComp} from './Profile'

import {FileListSlideComp} from './FileListSlide';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
    ],
    exports: [
        SwiperComp, FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp,
        ScanDeviceComp, IntensityDialComp,
        ProfileComp
    ],
    declarations: [
        SwiperComp, FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp,
        ScanDeviceComp, IntensityDialComp,
        ProfileComp
    ],
    entryComponents: [
    ]
})
export class ComponentsModule
{
}
