import {NgModule} from '@angular/core';
import {CommonModule} from './module.common'
import {DemoPage} from '../pages/demo/demo';
import {DemoModeRunningPage} from '../pages/demo/demo_mode_running';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        DemoPage,
        DemoModeRunningPage
    ],
    entryComponents: [
        DemoPage,
        DemoModeRunningPage
    ],
    providers: [
    ]
})
export class DemoModule {}
