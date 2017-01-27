import {Component, AfterViewInit} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import 'rxjs/add/operator/toPromise';
import {PowerManagement} from 'ionic-native';

import {TApplication, Loki, TDistributeService} from '../services';

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
export class OtaUpdatePage implements AfterViewInit
{
    constructor(private app: TApplication, private nav: NavController, private navParams: NavParams, 
        private DisSvc: TDistributeService)
    {
        this.Shell = navParams.get('Shell')
        this.Firmware = navParams.get('Firmware');
    }

    ngAfterViewInit()
    {
        /*PowerManagement.acquire()
            .then(() => */this.Shell.OTARequest(this.Firmware)
            .then(Progress =>
            {
                Progress.subscribe(next => this.Percent = Math.trunc(next * 100));
                return Progress.toPromise();
            })
            //.then(() => PowerManagement.release())
            .then(() =>
            {
                this.Shell.Detach();
                return this.nav.pop();
            })
            .catch(err =>
            {
                //PowerManagement.release().catch(err => {});
                this.app.HideLoading()
                    .then(() => this.app.ShowHintId(err.message))
            });
    }

    Percent: number = 0;

    private Shell: Loki.TShell;
    private Firmware: ArrayBuffer;
}