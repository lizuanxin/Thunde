import {isDevMode, Component, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import * as Svc from '../providers';

@Component({
  selector: 'scan-ble',
  template: `
    <ion-list *ngIf="Visible" [class.fadein]="DeviceList.length>0" margin-horizontal style="margin-top:13vh">
        <ng-template [ngIf]="DeviceList.length>0">
            <ion-item device *ngFor="let device of DeviceList" (click)="SelectionDevice(device.id);$event.stopPropagation()" tappable>
                <p><span ion-text color="dark">{{'home_page.title'|translate}}</span></p>
                <div item-right>
                    <div inner-icon>
                        <ion-icon app-icon [innerHTML]="Intensity(device.rssi)"></ion-icon>
                        <ion-icon app-icon static>&#xe926;</ion-icon>
                    </div>
                </div>
            </ion-item>
        </ng-template>
        <ion-item *ngIf="DeviceList.length===0" [class.fadein]="DeviceList.length===0">
            <span>{{'hint.plug_device'|translate}}</span>
        </ion-item>
    </ion-list>
    `
})
export class ScanBleComp implements OnInit, OnDestroy
{
    constructor()
    {
    }

    ngOnInit()
    {
        console.log('FakeDevice:' + Svc.Loki.TShell.FakeDevice);

        if (Svc.Loki.TShell.IsUsbPlugin)
        {
            Svc.Loki.TShell.StartOTG();
            let Shell = Svc.Loki.TShell.Get('USB');

            App.ShowLoading()
                .then(() => Shell.Connect())
                .then(() => Shell.StopOutput())
                .then(() => this.OnSelection.emit('USB'))
                .catch(err =>
                {
                    App.HideLoading()
                        .then(() => App.ShowError(err));
                    this.OnSelection.emit(null);
                });
        }
        else
        {
            if (App.IsAndroid)
                Svc.Loki.TShell.EnableBLE().then(() => this.StartScan());
            else
                this.StartScan();
        }
    }

    ngOnDestroy()
    {
        console.log('scan.ble destroy');
        this.StopScan();
    }

    Intensity(value: number): string
    {
        if (! value)
            return '';

        if (value >= -50)
            return '&#xe926;';
        if (value < -50 && value >= -60)
            return '&#xe92c;';
        if (value < -60 && value >= -70)
            return '&#xe92d;';
        if (value < -70 && value >= -80)
            return '&#xe92e;';
        if (value < -80)
            return '&#xe92f;';
    }

    SelectionDevice(DeviceId: string)
    {
        this.StopScan().then(() =>
        {
            let Shell = Svc.Loki.TShell.Get(DeviceId);

            if (isDevMode())
            {
                App.ShowLoading()
                    .then(() => Shell.Connect())
                    .then(() => Shell.StopOutput())
                    .catch(err => {})
                    .then(() => this.OnSelection.emit(DeviceId));
            }
            else
            {
                App.ShowLoading()
                    .then(() => Shell.Connect())
                    .then(() => Shell.StopOutput())
                    .then(() => this.OnSelection.emit(DeviceId))
                    .catch(err => this.OnSelection.emit());
            }
        });
    }

    private StartScan()
    {
        if (TypeInfo.Assigned(Svc.Loki.TShell.RunningInstance))
            return this.SelectionDevice(Svc.Loki.TShell.RunningInstance.DeviceId);

        this.ScanSubscription = Svc.Loki.TShell.StartScan().subscribe(
            next =>
                this.DeviceList = next,
            err =>
                console.error(err.message),
            () =>
            {
                if (TypeInfo.Assigned(this.ScanSubscription))
                    this.StopScan().then(() => setTimeout(() => this.StartScan(), 0));
            });

        if (isDevMode())
        {
            setTimeout(() =>
            {
                App.HideLoading()
                    .then(() => this.Visible = true)
                    .catch(err => console.log(err.message));
            }, 500);
        }
        else
        {
            setTimeout(() =>
            {
                if (this.DeviceList.length !== 1)
                {
                    App.HideLoading()
                        .then(() => this.Visible = true)
                        .catch(err => console.log(err.message));
                }
                else
                    this.SelectionDevice(this.DeviceList[0].id);
            }, 2000);
        }
    }

    private StopScan(): Promise<void>
    {
        if (TypeInfo.Assigned(this.ScanSubscription))
        {
            this.ScanSubscription.unsubscribe();
            this.ScanSubscription = null;
        }
        return Svc.Loki.TShell.StopScan().catch(err => console.log(err.message));
    }

    @Output() OnSelection = new EventEmitter<string>();

    private DeviceList: Array<Svc.IScanDiscovery> = [];
    private ScanSubscription: Subscription;
    private Visible = false;
}
