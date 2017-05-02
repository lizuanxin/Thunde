import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription'

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import {EAbort} from '../UltraCreation/Core/Exception'

import * as Svc from '../providers'

@Component({
  selector: 'scan-device',
  template: `
    <ion-col text-center text-light>
        <ion-list absolute [ngStyle]="{zIndex:1,top:0,left:0,right:0}" [class.fadein]="DeviceList.length>0">
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
        </ion-list>
    </ion-col>`
})
export class ScanDevice
{
    constructor(private app: Svc.TApplication)
    {

    }

    @Input() set Enabled(Value: boolean)
    {

    }

    @Output() OnSelection = new EventEmitter<string>();

    SelectionDevice(DeviceId: string)
    {
        if (TypeInfo.Assigned(this.ScanSubscription))
        {
            this.ScanSubscription.unsubscribe();
            this.ScanSubscription = null;
        }

        this.OnSelection.next(DeviceId);
    }

    DeviceList: Array<Svc.IScanDiscovery> = [];
    private ScanSubscription: Subscription;
}
