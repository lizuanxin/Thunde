import {Component, OnInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs/Rx'
import {Platform, NavController, ViewController, NavParams} from 'ionic-angular';

import {TypeInfo} from '../../UltraCreation/Core';

import {BLE, Loki, TApplication, TLocalizeService, TAssetService, TCategory, TScriptFile, TDistributeService} from '../services';
import {RunningPage} from '../running/running';
import {OtaUpdatePage} from '../ota_update/ota_update';

@Component({selector: 'page-go', templateUrl: 'go.html'})
export class GoPage implements OnInit, OnDestroy
{
    constructor(public nav: NavController, private view: ViewController, private navParams: NavParams, private platform: Platform,
        private app: TApplication, private Localize: TLocalizeService, private Asset: TAssetService, private DisSvc: TDistributeService)
    {
        this.Category = navParams.get('Category');
        this.ScriptFile = navParams.get('ScriptFile');
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

    SelectionDevice(Device: BLE.IScanDiscovery)
    {
        this.Start(Device.id);
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

        this.nav.push(RunningPage, params)
            .then(() => this.nav.remove(1, this.view.index, {animate: false}));

        // this.CheckOtaUpdate(DeviceId).then((newVer) => 
        // {
        //     if (newVer > 0)
        //     {
        //         params.Version = newVer;
        //         this.app.ShowAlert({
        //             title: 'New Firwmare: ' + this.getVersionStr(newVer) + ' available, Do you want to update',
        //             buttons: 
        //             [ 
        //                 {text: 'YES', handler: () => this.GoToOtaUpdatePage(params)},
        //                 {text: 'NO', handler: () => this.GoToRunningPage(params)}
        //             ]
        //         })
        //     }
        //     else
        //         this.GoToRunningPage(params);
        // });
    }

    private CheckOtaUpdate(deviceId: string): Promise<number>
    {
        let shell = Loki.TShell.Get(deviceId);

        return shell.VersionRequest()
            .then((version) => 
            {
                if (this.DisSvc.IsNeedToUpdateFirmware(version))
                    return this.DisSvc.GetNewFirmwareVer(version);
                else
                    return 0;
                
            })
            .catch(() => 
            {
                return 0;
            });
    }

    private getVersionStr(value: number): string
    {
        let retStr: string = '';
        let minor = value % 10000;
        let middle = (value - minor) % (10000 * 1000);
        let major = Math.floor(value / 1000 / 10000);
        retStr = major.toString() + '.' + middle.toString() + '.' + minor.toString();
        return retStr;
    }

    private GoToRunningPage(params: any)
    {
        this.nav.push(RunningPage, params)
            .then(() => this.nav.remove(1, this.view.index, {animate: false}));
    }

    private GoToOtaUpdatePage(params: any)
    {
        this.nav.push(OtaUpdatePage, params)
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

    Category: TCategory;
    ScriptFile: TScriptFile;

    DeviceList: Array<BLE.IScanDiscovery> = [];
    IsShowingDeviceList: boolean = false;
    private ScanSubscription: Subscription;
}
