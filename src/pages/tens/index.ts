import {NgModule} from '@angular/core';

import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '../../UltraCreation/ng-ion/translate'
import {ComponentModule} from '../../components'

import {SwiperComp} from '../../UltraCreation/ng-ion/swiper'
import {FileListDialComp} from './filelist/filelist.dail';
import {FileListBodyComp} from './filelist/filelist.body';
import {FileListCardComp, FileListRecommendComp} from './filelist/filelist.card';
import {FileListSlideComp} from './filelist/filelist.slide';
import {FileDurationComp} from './file.duration'

import {RunningPage} from './running/running'
import {OtaPage} from './ota/ota'
import {DownloadPage} from './download/download'

import {DemoPage} from './demo/demo'
import {DemoRunningPage} from './demo/demo.running'

@NgModule({
    imports: [
        IonicPageModule,
        TranslateModule,
        ComponentModule
    ],
    exports: [
        SwiperComp,
        FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp, FileListRecommendComp,
        FileDurationComp,
    ],
    declarations: [
        SwiperComp, FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp, FileListRecommendComp,
        FileDurationComp,
        RunningPage, OtaPage, DownloadPage,
        DemoPage, DemoRunningPage
    ],
    entryComponents: [
        RunningPage, OtaPage, DownloadPage,
        DemoPage, DemoRunningPage
    ]
})
export class TensModule
{
}

export {RunningPage, OtaPage, DownloadPage, DemoPage, DemoRunningPage}
