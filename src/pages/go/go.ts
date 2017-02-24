import { Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs/Rx'
import { Platform, NavController, ViewController, NavParams, ModalController, Content } from 'ionic-angular';

import { TypeInfo, EAbort } from '../../UltraCreation/Core';

import { BLE, Loki, TApplication, TLocalizeService, TDistributeService, TCategory, TScriptFile } from '../services';
import { RunningPage } from '../running/running';
import { OtaUpdatePage } from '../ota_update/ota_update';
//import {FiledetailsPage} from '../filedetails/filedetails';

@Component({
    selector: 'page-go', templateUrl: 'go.html',
})

export class GoPage implements OnInit, OnDestroy {
    @ViewChild(Content) content: Content;

    constructor(public nav: NavController, public modalCtrl: ModalController, private view: ViewController, private navParams: NavParams, private platform: Platform,
        private app: TApplication, private Localize: TLocalizeService, private Distribute: TDistributeService) {
        this.Category = navParams.get('Category');
        this.ScriptFile = navParams.get('ScriptFile');

        if (platform.is('ios'))
            Loki.TShell.LinearTable = '3.3v';
        else if (platform.is('android'))
            Loki.TShell.LinearTable = '5v';

    }

    ngOnInit(): void {
        if (!Loki.TShell.IsUsbPlugin) {
            if (this.platform.is('android'))
                BLE.Enable().then(() => this.StartScan())
            else
                this.StartScan();
        }
    }

    ngOnDestroy(): void {
        if (TypeInfo.Assigned(this.ScanSubscription))
            this.ScanSubscription.unsubscribe();

        Loki.TShell.StopScan().catch(err => { });
    }

    Go() {
        if (!Loki.TShell.IsUsbPlugin) {
            if (this.DeviceList.length === 1)
                this.Start(this.DeviceList[0].id);
            else
                this.IsShowingDeviceList = true;
        }
        else
            this.Start('USB');
    }

    ShowDesc(event) {
        if (!this.IsShowDescIcon) {
            let target = event.target || event.srcElement || event.currentTarget;
            let targetId = target.parentElement.id;
            if (targetId !== '') {
                this.IsShowDescIcon = true;
                this.OutBox = <HTMLElement>document.createElement('div');                
                let Body = <HTMLElement>document.getElementById('content');
                let ELE = <HTMLElement>document.getElementById(targetId);
                this.Point = ELE.getBoundingClientRect();
                this.ShowBox = ELE.cloneNode(true);
                let position = 'position:fixed;z-index:99;';
                let Client = 'width:' + Math.trunc(this.Point.width) + 'px;height:' + Math.trunc(this.Point.height) + 'px;'
                let Param = position + Client + this.StyleDirection + 'top:' + Math.trunc(this.Point.top) + 'px;transform:scale(1)';
                let Fade = position + Client + 'top:42vh;' + this.StyleTransform + '';
                this.OutBox.setAttribute('class', this.app.SkinColor + ' animation');
                this.OutBox.setAttribute('style', Param);
                this.OutBox.appendChild(this.ShowBox);
                this.OutBox.addEventListener("click", this.CloseDesc.bind(this));
                Body.appendChild(this.OutBox);
                setTimeout(() => {
                    this.OutBox.setAttribute('style', Fade);
                }, 100)
            }
        }
    }

    get StyleTransform ():string
    {
        if (this.Point.left < this.Point.width)
            return 'left:25px;transform:scale(2);transform-origin:left 100%;'
        else 
            return 'right:25px;transform:scale(2);transform-origin:100% 100%;'
    }

    get StyleDirection ():string
    {
        if (this.Point.left < this.Point.width)
            return 'left:21px;';
        else
            return 'right:21px;';
    }

    CloseDesc() {
        this.IsShowDescIcon = false;
        this.OutBox.remove();
    }



    ShowFileDetail() {
        
        let gridBody = document.getElementById('gridBody');

        if (this.IsShowFileDetail) {
            this.IsShowFileDetail = false;
        }
        else {
            this.IsShowFileDetail = true;
            if (gridBody.clientHeight > (window).innerHeight)
                this.content.scrollTo(0, this.content.scrollHeight - this.content.contentTop * 2 -16, 1500);
            else
                this.content.scrollTo(0, gridBody.clientHeight - 50 * 2, 1500);
        }         

    }

    FileDetails(): Array<string> {
        let RetVal = new Array<string>();
        for (let d of this.ScriptFile.Details) {
            let obj: { effect_freq: string, cluster_freq?: string, pulse_width: string } = JSON.parse(d.Desc);
            let line: string = '';

            if (this.ScriptFile.Details.length > 1)
                line += this.Localize.Translate('go_page.seq') + d.Name + '<br>';

            line += this.Localize.Translate('go_page.effect_freq') + obj.effect_freq + '<br>';

            if (TypeInfo.Assigned(obj.cluster_freq))
                line += this.Localize.Translate('go_page.cluster_freq') + obj.cluster_freq + '<br>';
            line += this.Localize.Translate('go_page.pulse_width') + obj.pulse_width;

            RetVal.push(line);
        }

        return RetVal;
    }

    SelectionDevice(Device: BLE.IScanDiscovery) {
        this.Start(Device.id);
    }

    private StartScan() {
        this.ScanSubscription = Loki.TShell.StartScan()
            .subscribe((next) => {
                this.DeviceList = next;
            },
            (err) => {
                console.error(err);
            },
            () => {
                if (TypeInfo.Assigned(this.ScanSubscription))
                    setTimeout(() => this.StartScan(), 0);
            });
    }

    private Start(DeviceId: string) {
        if (TypeInfo.Assigned(this.ScanSubscription)) {
            this.ScanSubscription.unsubscribe();
            this.ScanSubscription = null;
        }

        let params = this.navParams.data;
        params.DeviceId = DeviceId;

        this.app.ShowLoading().then(loading => {
            let Shell = Loki.TShell.Get(DeviceId);

            let StopScan: Promise<void> = Promise.resolve();
            if (!Loki.TShell.IsUsbPlugin)
                StopScan = BLE.TGatt.StopScan();

            StopScan.then(() => Shell.Connect())
                .then(() => this.Distribute.ReadFirmware(Shell.Version))
                .then(Buf => {
                    params.Shell = Shell;
                    params.Firmware = Buf;
                    return this.nav.push(OtaUpdatePage, params);
                })
                .catch(err => {
                    if (err instanceof EAbort)
                        this.nav.push(RunningPage, params);
                    else
                        loading.dismiss().then(() => this.app.ShowHintId(err.message));
                })
        });
    }

    Category: TCategory;
    ScriptFile: TScriptFile;

    DeviceList: Array<BLE.IScanDiscovery> = [];
    IsShowingDeviceList: boolean = false;
    IsShowDescIcon: boolean = false;
    IsShowFileDetail: boolean = false;
    CurrentDescIcon: string;
    OutBox:any;
    ShowBox:any;
    Point: any;

    private ScanSubscription: Subscription;

}
