import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '../UltraCreation/ng-ion/translate'

import {SwiperComp} from '../UltraCreation/ng-ion/swiper'

import {FileListDialComp} from './filelist/FileListDial';
import {FileListBodyComp} from './filelist/FileListBody';
import {FileListCardComp, FileListRecommendComp} from './filelist/FileListCard';
import {FileListSlideComp} from './filelist/FileListSlide';
import {FileDurationComp} from './FileDuration'

import {ScanDeviceComp} from './ScanDevice';
import {IntensityDialComp} from './IntensityDial';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
    ],
    exports: [
        SwiperComp,
        FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp, FileDurationComp, FileListRecommendComp,
        ScanDeviceComp, IntensityDialComp,
    ],
    declarations: [
        SwiperComp, FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp, FileDurationComp, FileListRecommendComp,
        ScanDeviceComp, IntensityDialComp,
    ],
    entryComponents: [
    ]
})
export class ComponentModule
{
}
