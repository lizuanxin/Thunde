import {Component, OnInit, OnDestroy, ElementRef, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs/Rx'
import {Platform, NavController, ViewController, NavParams, ModalController, Content} from 'ionic-angular';

import {TypeInfo, EAbort} from '../../UltraCreation/Core';

import {BLE, Loki, TApplication, TDistributeService, TCategory, TScriptFile} from '../services';
import {RunningPage} from '../running/running';
import {OtaUpdatePage} from '../ota_update/ota_update';

//import {FiledetailsPage} from '../filedetails/filedetails';

@Component({selector: 'page-go', templateUrl: 'go.html'})
export class GoPage implements OnInit, OnDestroy
{
    constructor(public nav: NavController, public modalCtrl: ModalController, private view: ViewController, private navParams: NavParams, private platform: Platform,
        private app: TApplication, private Distribute: TDistributeService)
    {
        this.Category = navParams.get('Category');
        this.ScriptFile = navParams.get('ScriptFile');

        if (platform.is('ios'))
            Loki.TShell.LinearTable = '3.3v';
        else if (platform.is('android'))
            Loki.TShell.LinearTable = '5v';
    }

    ngOnInit(): void
    {
        if (!Loki.TShell.IsUsbPlugin)
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

        Loki.TShell.StopScan().catch(err => console.log(err.message));
    }

    Go()
    {
        if (!Loki.TShell.IsUsbPlugin)
        {
            if (this.DeviceList.length === 1)
                this.Start(this.DeviceList[0].id);
            else
                this.IsShowingDeviceList = true;
        }
        else
            this.Start('USB');
    }

    ShowDesc(event)
    {
        if (!this.IsShowDescIcon)
        {
            let target = event.target || event.srcElement || event.currentTarget;
            let targetId = target.parentElement.id;
            if (targetId !== '')
            {
                this.IsShowDescIcon = true;
                let ELE = <HTMLElement>document.getElementById(targetId);
                this.Point = ELE.getBoundingClientRect();
                this.ShowBox = ELE.cloneNode(true);
                this.InitPosition();         
                this.enlarge.nativeElement.appendChild(this.ShowBox);                
                this.enlarge.nativeElement.addEventListener("click", this.CloseDesc.bind(this));              

                setTimeout(() => 
                {                    
                    if (this.Point.left < this.Point.width)
                    {
                        this.enlarge.nativeElement.style.transformOrigin = 'left 100%';                        
                        this.enlarge.nativeElement.style.left = '25px';
                        
                    }
                    else
                    {
                        this.enlarge.nativeElement.style.transformOrigin = '100% 100%';
                        this.enlarge.nativeElement.style.right = '25px';                        
                    }
                    this.enlarge.nativeElement.style.top = '42vh';
                    this.enlarge.nativeElement.style.transform = 'scale(2)';
                    
                }, 100);
            }
        }
    }

    InitPosition()
    {
        this.enlarge.nativeElement.style.zIndex = 99;
        this.enlarge.nativeElement.style.position = 'fixed';
        this.enlarge.nativeElement.style.width = Math.trunc(this.Point.width) + 'px';
        this.enlarge.nativeElement.style.height = Math.trunc(this.Point.height) + 'px';
        this.enlarge.nativeElement.style.top = Math.trunc(this.Point.top) + 'px';
        this.enlarge.nativeElement.style.transform = 'scale(1)';

        if (this.Point.left < this.Point.width)
            this.enlarge.nativeElement.style.left = '21px';
        else
            this.enlarge.nativeElement.style.right = '21px';
    }

    CloseDesc()
    {        
        this.InitPosition();
        setTimeout(() => this.IsShowDescIcon = false, 600);
        setTimeout(() =>
        {           
            if (this.enlarge.nativeElement.childNodes.length === 0) return;
            this.enlarge.nativeElement.removeAttribute('style');
            this.enlarge.nativeElement.removeChild(this.ShowBox);
        }, 1000)
    }

    ShowFileDetail()
    {
        let gridBody = document.getElementById('gridBody');

        if (this.IsShowFileDetail)
        {
            this.IsShowFileDetail = false;
        }
        else
        {
            this.IsShowFileDetail = true;
            if (gridBody.clientHeight > (window).innerHeight)
                this.content.scrollTo(0, this.content.scrollHeight - this.content.contentTop * 2 -16, 1500);
            else
                this.content.scrollTo(0, gridBody.clientHeight - 50 * 2, 1500);
        }
    }

    FileDetails(): Array<string>
    {
        let RetVal = new Array<string>();
        for (let d of this.ScriptFile.Details)
        {
            let obj: { effect_freq: string, cluster_freq?: string, pulse_width: string } = JSON.parse(d.Desc);
            let line: string = '';

            if (this.ScriptFile.Details.length > 1)
                line += this.app.Translate('go_page.seq') + d.Name + '<br>';

            line += this.app.Translate('go_page.effect_freq') + obj.effect_freq + '<br>';

            if (TypeInfo.Assigned(obj.cluster_freq))
                line += this.app.Translate('go_page.cluster_freq') + obj.cluster_freq + '<br>';
            line += this.app.Translate('go_page.pulse_width') + obj.pulse_width;

            RetVal.push(line);
        }

        return RetVal;
    }

    SelectionDevice(Device: BLE.IScanDiscovery)
    {
        this.Start(Device.id);
    }

    private StartScan()
    {
        this.ScanSubscription = Loki.TShell.StartScan()
            .subscribe((next) => this.DeviceList = next,
            (err) => console.error(err),
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

            let StopScan: Promise<void>;
            if (Loki.TShell.IsUsbPlugin)
                StopScan = Promise.resolve();
            else
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
                        return this.nav.push(RunningPage, params);
                    else
                        return loading.dismiss().then(() => this.app.ShowHintId(err.message));
                })
        });
    }

    @ViewChild(Content) content: Content;
    @ViewChild('enlarge') enlarge: ElementRef;

    Category: TCategory;
    ScriptFile: TScriptFile;

    DeviceList: Array<BLE.IScanDiscovery> = [];
    IsShowingDeviceList: boolean = false;
    IsShowDescIcon: boolean = false;
    IsShowFileDetail: boolean = false;
    CurrentDescIcon: string;
    ShowBox:any;
    Point: any;

    private ScanSubscription: Subscription;
}
