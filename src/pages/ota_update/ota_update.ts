import {Component, AfterViewInit, OnDestroy} from '@angular/core';

import {NavParams, ViewController} from 'ionic-angular';
import {PowerManagement} from '../../UltraCreation/Native/PowerManagement'
import * as Svc from '../../providers';

@Component({
    selector: 'ota-update',
    templateUrl: 'ota_update.html',
    styles: [
        `
        .progress-outer
        {
            width: 96%;
            margin: 10px 2%;
            padding: 3px;
            text-align: center;
            background-color: #f4f4f4;
            border: 1px solid #dcdcdc;
            color: #fff;
            border-radius: 20px;
        }
        .progress-inner
        {
            min-width: 10%;
            white-space: nowrap;
            overflow: hidden;
            padding: 5px;
            border-radius: 20px;
            background-color: #0080ff;
        }
        `
    ]
})
export class OtaUpdatePage implements AfterViewInit, OnDestroy
{
    constructor(private app: Svc.TApplication, private navParams: NavParams, private view: ViewController)
    {
        this.Shell = navParams.get('Shell')
        this.Firmware = navParams.get('Firmware');
    }

    ngOnInit()
    {
        PowerManagement.Acquire();
    }

    ngAfterViewInit()
    {
        this.app.Nav.remove(1, this.view.index - 1, {animate: false})
            .then(() => this.Start());
    }

    ngOnDestroy()
    {
        PowerManagement.Release();
        this.Shell.Detach();
        this.app.HideLoading();
    }

    private Start()
    {
        this.Shell.OTARequest(this.Firmware)
            .then(Progress =>
            {
                Progress.subscribe(next => this.Percent = Math.trunc(next * 100), err => {}, () => {});
                return Progress.toPromise();
            })
            .then(() => this.app.Nav.pop())
            .catch(err =>
            {
                if (err instanceof Svc.Loki.EUSBRestarting)
                {
                    setTimeout(() =>
                    {
                        Svc.Loki.TShell.StartOTG();
                        this.Shell = Svc.Loki.TShell.Get('USB');
                    }, 1500);

                    setTimeout(() => this.Start(), 3000);
                }
                else
                {
                    if (this.Percent >= 100)    // last packet may never received
                        this.app.Nav.pop();
                    else
                        this.app.ShowHintId(err.message).then(() => this.app.Nav.pop());
                }
            });
    }

    Percent: number = 0;

    private Shell: Svc.Loki.TShell;
    private Firmware: ArrayBuffer;
}
