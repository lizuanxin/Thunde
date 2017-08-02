import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '@ngx-translate/core';

import {SwiperComp} from '../UltraCreation/ng-ion/swiper';
import {FileListDialComp} from './filelist/filelist.dail';
import {FileListBodyComp} from './filelist/filelist.body';
import {FileListCardComp, FileListRecommendComp} from './filelist/filelist.card';
import {FileListSlideComp} from './filelist/filelist.slide';

import {IntensityDialComp} from './intensity.dial';
import {DiscoverComp} from './discover/discover';

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
    ],
    declarations: [
        SwiperComp,
        FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp, FileListRecommendComp,
        IntensityDialComp,
        DiscoverComp,
    ],
    entryComponents: [
    ],
    exports: [
        SwiperComp, FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp, FileListRecommendComp,
        IntensityDialComp,
        DiscoverComp,
    ],
})
export class SharedModule
{
}
