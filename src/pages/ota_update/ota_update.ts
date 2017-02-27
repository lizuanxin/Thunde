import {Component, AfterViewInit, OnDestroy} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

import {TApplication, Loki} from '../services';

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
    constructor(private app: TApplication, private nav: NavController, private navParams: NavParams, private view: ViewController)
    {
        this.Shell = navParams.get('Shell')
        this.Firmware = navParams.get('Firmware');
    }

    ngAfterViewInit()
    {
        this.nav.remove(1, this.view.index - 1, {animate: false})
            .then(() => this.Start());
    }

    ngOnDestroy()
    {
        this.Shell.Detach();
        this.app.HideLoading();
    }

    private Start()
    {
        /*PowerManagement.acquire()
            .then(() => */this.Shell.OTARequest(this.Firmware)
            .then(Progress =>
            {
                Progress.subscribe(next => this.Percent = Math.trunc(next * 100), err => {}, () => {});
                return Progress.toPromise();
            })
            //.then(() => PowerManagement.release())
            .then(() => this.nav.pop())
            .catch(err =>
            {
                //PowerManagement.release().catch(err => {});

                if (err instanceof Loki.EUSBRestarting)
                {
                    setTimeout(() =>
                    {
                        Loki.TShell.StartOTG();
                        this.Shell = Loki.TShell.Get('USB');
                    }, 1500);

                    setTimeout(() => this.Start(), 3000);
                }
                else
                {
                    if (this.Percent >= 100)    // last packet may never received
                        this.nav.pop();
                    else
                        this.app.ShowHintId(err.message).then(() => this.nav.pop());
                }
            });
    }

    Percent: number = 0;

    private Shell: Loki.TShell;
    private Firmware: ArrayBuffer;
}