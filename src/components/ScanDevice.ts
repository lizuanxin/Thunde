import {isDevMode, Component, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription'

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import * as Svc from '../providers'

@Component({
  selector: 'scan-device',
  template: `
    <ion-list *ngIf="Visible" [class.fadein]="DeviceList.length>0" margin-horizontal style="margin-top:13vh">
        <ng-template [ngIf]="DeviceList.length>0">
            <ion-item device *ngFor="let device of DeviceList" (click)="SelectionDevice(device.id);$event.stopPropagation()" tappable>
                <p><span ion-text color="dark">{{'home_page.title'|translate}}</span></p>
                <div item-right>
                    <ion-icon app-icon [innerHTML]="Intensity(device.rssi)"></ion-icon>
                    <ion-icon app-icon static>&#xe926;</ion-icon>
                </div>
            </ion-item>
        </ng-template>
        <ion-item *ngIf="DeviceList.length===0" [class.fadein]="DeviceList.length===0">
            <span>{{'hint.plug_device'|translate}}</span>
        </ion-item>
    </ion-list>
    `
})
export class ScanDeviceComp implements OnInit, OnDestroy
{
    constructor(private app: Svc.TApplication)
    {

    }

    ngOnInit()
    {
        Svc.Loki.TShell.FakeDevice = isDevMode();

        if (! Svc.Loki.TShell.IsUsbPlugin)
        {
            if (this.app.IsAndroid)
                Svc.Loki.TShell.EnableBLE().then(() => this.StartScan())
            else
                this.StartScan();
        }
    }

    ngOnDestroy()
    {
        console.log('scan-device destroy');

        if (TypeInfo.Assigned(this.ScanSubscription))
        {
            this.ScanSubscription.unsubscribe();
            this.ScanSubscription = null;
        }
        Svc.Loki.TShell.StopScan();
    }

    Intensity(value): string
    {
        if (value >= -50) return '&#xe926;'
        if (value < -50 && value >= -60) return '&#xe92c;'
        if (value < -60 && value >= -70) return '&#xe92d;'
        if (value < -70 && value >= -80) return '&#xe92e;'
        if (value < -80) return '&#xe92f;'
    }

    SelectionDevice(DeviceId: string)
    {
        let Shell = Svc.Loki.TShell.Get(DeviceId);

        if (isDevMode())
        {
            this.app.ShowLoading()
                .then(() => Shell.Connect())
                .then(() => Shell.StopOutput())
                .catch(err => console.log(err.message))
                .then(() => this.OnSelection.next(DeviceId));
        }
        else
        {
            this.app.ShowLoading()
                .then(() => Shell.Connect())
                .then(() => Shell.StopOutput())
                .then(() => this.OnSelection.next(DeviceId))
                .catch(err=>
                {
                    this.app.HideLoading()
                        .then(() => this.app.ShowHintId(err.message))
                    this.OnSelection.next(null);
                });
        }
    }

    private StartScan()
    {
        this.ScanSubscription = Svc.Loki.TShell.StartScan().subscribe(
            next =>
                this.DeviceList = next,
            (err) =>
                console.error(err),
            () =>
            {
                if (TypeInfo.Assigned(this.ScanSubscription))
                    setTimeout(() => this.StartScan(), 0);
            });

        if (isDevMode())
        {
            setTimeout(() =>
            {
                this.Visible = true;
                this.app.HideLoading();
            }, 500);
        }
        else
        {
            setTimeout(() =>
            {
                if (this.DeviceList.length !== 1)
                {
                    this.Visible = true;
                    this.app.HideLoading();
                }
                else
                    this.SelectionDevice(this.DeviceList[0].id);
            }, 2000);
        }
    }

    @Output() OnSelection = new EventEmitter<string>();

    private DeviceList: Array<Svc.IScanDiscovery> = [];
    private ScanSubscription: Subscription;
    private Visible = false;
}
