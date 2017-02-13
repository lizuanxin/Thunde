import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs/Rx'
import {Platform, NavController, ViewController, NavParams,ModalController} from 'ionic-angular';

import {TypeInfo, EAbort} from '../../UltraCreation/Core';

import {BLE, Loki, TApplication, TLocalizeService, TDistributeService,
    TCategory, TScriptFile, TScriptFileDesc} from '../services';
import {RunningPage} from '../running/running';
import {OtaUpdatePage} from '../ota_update/ota_update';
import {FiledetailsPage} from '../filedetails/filedetails';

@Component({selector: 'page-go', templateUrl: 'go.html'})
export class GoPage implements OnInit, OnDestroy
{
    constructor(public nav: NavController,public modalCtrl: ModalController, private view: ViewController, private navParams: NavParams, private platform: Platform,
        private app: TApplication, private Localize: TLocalizeService, private Distribute: TDistributeService)
    {
        this.Category = navParams.get('Category');
        this.ScriptFile = navParams.get('ScriptFile');
        this.FileDetails = navParams.get('FileDetails');

        if (platform.is('ios'))
            Loki.TShell.LinearTable = '3.3v';
    }

    ngOnInit(): void
    {
        if (! Loki.TShell.IsUsbPlugin)
        {
            if (this.platform.is('android'))
                BLE.Enable().then(() => this.StartScan())
            else
                this.StartScan();
        }

        let F = new Loki.TFile();
        F.LoadFrom(this.ScriptFile.Content);
        for (let iter of F.Snap())
            console.log(iter.Print());
    }

    ngOnDestroy(): void
    {
        if (TypeInfo.Assigned(this.ScanSubscription))
            this.ScanSubscription.unsubscribe();

        Loki.TShell.StopScan().catch(err =>{});
    }

    Go()
    {
        if (! Loki.TShell.IsUsbPlugin)
        {
            if (this.DeviceList.length === 1)
                this.Start(this.DeviceList[0].id);
            else
                this.IsShowingDeviceList = true;
        }
        else
            this.Start('USB');
    }

    GoManufactoryMode()
    {
        Loki.TShell.LinearTable = '3.3v';
        this.Go();
    }

    OpenFileDetail()
    {
        let modal = this.modalCtrl.create(FiledetailsPage,{FileDetails:this.FileDetails});
        modal.present();
    }

    SelectionDevice(Device: BLE.IScanDiscovery)
    {
        this.Start(Device.id);
    }

    private StartScan()
    {
        this.ScanSubscription = Loki.TShell.StartScan()
            .subscribe((next) =>
            {
                this.DeviceList = next;
            },
            (err) =>
            {
                console.error(err);
            },
            () =>
            {
                if (TypeInfo.Assigned(this.ScanSubscription))
                    setTimeout(() => this.StartScan(), 0);
            });
    }

    private Start(DeviceId: string)
    {
        if (TypeInfo.Assigned(this.ScanSubscription))
        {
            this.ScanSubscription.unsubscribe();
            this.ScanSubscription = null;
        }

        let params = this.navParams.data;
        params.DeviceId = DeviceId;

        this.app.ShowLoading().then(loading =>
        {
            let Shell = Loki.TShell.Get(DeviceId);

            let StopScan: Promise<void> = Promise.resolve();
            if (! Loki.TShell.IsUsbPlugin)
                StopScan = BLE.TGatt.StopScan();

            StopScan.then(() => Shell.Connect())
                .then(() => this.Distribute.ReadFirmware(Shell.Version))
                .then(Buf =>
                {
                    params.Shell = Shell;
                    params.Firmware = Buf;
                    return this.nav.push(OtaUpdatePage, params);
                })
               .catch(err =>
               {
                   if (err instanceof EAbort)
                        this.nav.push(RunningPage, params);
                    else
                       loading.dismiss().then(() => this.app.ShowHintId(err.message));
               })
        });
    }

    Category: TCategory;
    ScriptFile: TScriptFile;
    FileDetails: Array<TScriptFileDesc>;

    DeviceList: Array<BLE.IScanDiscovery> = [];
    IsShowingDeviceList: boolean = false;
    private ScanSubscription: Subscription;
}
