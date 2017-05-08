import {isDevMode, Component, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription'

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import * as Svc from '../providers'

@Component({
  selector: 'scan-device',
  template: `
    <div Dev-Mask *ngIf="Visible" (click)="OnCancel.next()" tappable>
        <ion-list [class.fadein]="DeviceList.length>0" margin>
            <ng-template [ngIf]="DeviceList.length>0">
                <ion-item *ngFor="let device of DeviceList" (click)="SelectionDevice(device.id);" tappable>
                    <p>{{'home_page.title'|translate}}</p>
                    <ion-icon app-icon *ngIf="device.rssi<-80" item-right><span f-1-2>{{device.rssi}}</span> &#xe92f;</ion-icon>
                    <ion-icon app-icon *ngIf="device.rssi<-70 && device.rssi>=-80" item-right><span f-1-2>{{device.rssi}}</span> &#xe92e;</ion-icon>
                    <ion-icon app-icon *ngIf="device.rssi<-60 && device.rssi>=-70" item-right><span f-1-2>{{device.rssi}}</span> &#xe92d;</ion-icon>
                    <ion-icon app-icon *ngIf="device.rssi<-50 && device.rssi>=-60" item-right><span f-1-2>{{device.rssi}}</span> &#xe92c;</ion-icon>
                    <ion-icon app-icon *ngIf="device.rssi>=-50" item-right><span f-1-2>{{device.rssi}}</span> &#xe926;</ion-icon>
                </ion-item>
            </ng-template>
            <ion-item *ngIf="DeviceList.length===0" [class.fadein]="DeviceList.length===0">
                <span>{{'go_page.plug_device'|translate}}</span>
            </ion-item>
        </ion-list>
    </div>
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
        if (TypeInfo.Assigned(this.ScanSubscription))
        {
            this.ScanSubscription.unsubscribe();
            this.ScanSubscription = null;
        }
        Svc.Loki.TShell.StopScan();
    }

    SelectionDevice(DeviceId: string)
    {
        let Shell = Svc.Loki.TShell.Get(DeviceId);

        if (isDevMode())
        {
            Shell.Connect()
                .then(() => Shell.StopOutput())
                .catch(err => console.log(err.message))
                .then(() => this.OnSelection.next(DeviceId));
        }
        else
        {
            Shell.Connect()
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
    @Output() OnCancel = new EventEmitter<void>();

    private DeviceList: Array<Svc.IScanDiscovery> = [];
    private ScanSubscription: Subscription;
    private Visible = false;
}
