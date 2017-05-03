import {Component, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription'

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import * as Svc from '../providers'

@Component({
  selector: 'scan-device',
  template: `
    <ion-list absolute *ngIf="Visible" [ngStyle]="{zIndex:1,top:0,left:0,right:0}" [class.fadein]="DeviceList.length>0">
        <ng-template [ngIf]="DeviceList.length>0">
            <ion-item *ngFor="let device of DeviceList" (click)="SelectionDevice(device.id)" tappable>
                <p>{{'home_page.title'|translate}}</p>
                <ion-icon app-icon *ngIf="device.rssi<-80" item-right><span f-12>{{device.rssi}}</span>&#xe92f;</ion-icon>
                <ion-icon app-icon *ngIf="device.rssi<-70 && device.rssi>=-80" item-right><span f-12>{{device.rssi}}</span>&#xe92e;</ion-icon>
                <ion-icon app-icon *ngIf="device.rssi<-60 && device.rssi>=-70" item-right><span f-12>{{device.rssi}}</span>&#xe92d;</ion-icon>
                <ion-icon app-icon *ngIf="device.rssi<-50 && device.rssi>=-60" item-right><span f-12>{{device.rssi}}</span>&#xe92c;</ion-icon>
                <ion-icon app-icon *ngIf="device.rssi>=-50" item-right><span f-12>{{device.rssi}}</span>&#xe926;</ion-icon>
            </ion-item>
        </ng-template>
        <ion-item *ngIf="DeviceList.length===0" [class.fadein]="DeviceList.length===0">
            <span>{{'go_page.plug_device'|translate}}</span>
        </ion-item>
    </ion-list>`
})
export class ScanDevice implements OnInit, OnDestroy
{
    constructor(private app: Svc.TApplication)
    {

    }

    ngOnInit()
    {
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
        console.log('destroy scan device');

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

    @Output() OnSelection = new EventEmitter<string>();

    private DeviceList: Array<Svc.IScanDiscovery> = [];
    private ScanSubscription: Subscription;
    private Visible = false;
}
