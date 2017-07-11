import {NgModule} from '@angular/core';

import {IonicPageModule} from 'ionic-angular';
import {TranslateModule} from '@ngx-translate/core'
import {ComponentModule} from '../../components'

import {SwiperComp} from '../../UltraCreation/ng-ion/swiper'
import {FileListDialComp} from './filelist/filelist.dail';
import {FileListBodyComp} from './filelist/filelist.body';
import {FileListCardComp} from './filelist/filelist.card';
import {FileListSlideComp} from './filelist/filelist.slide';

import {ScanBleComp} from './scan.ble';
import {IntensityDialComp} from './intensity.dial';

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
        FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp,
        IntensityDialComp,
        ScanBleComp,
    ],
    declarations: [
        SwiperComp, FileListDialComp, FileListBodyComp, FileListCardComp, FileListSlideComp,
        IntensityDialComp,
        ScanBleComp,
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
