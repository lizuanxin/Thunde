import {Component, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';

import * as USB from '../../UltraCreation/Native/USB';
import * as BLE from '../../UltraCreation/Native/BluetoothLE';
import * as Svc from '../../providers';

@Component({selector: 'discover-peripheral', templateUrl: 'discover.html', providers: [Svc.TDiscoverService]})
export class DiscoverComp implements OnInit, OnDestroy
{
    constructor(private Discover: Svc.TDiscoverService)
    {
    }

    ngOnInit(): void
    {
        if (! USB.OTG.IsAttached)
        {
            BLE.IsEnable().then(Enabled =>
            {
                if (Enabled)
                    return this.Start();

                if (App.IsAndroid)
                {
                    BLE.Enable().then(Opend =>
                    {
                        if (Opend)
                            this.Start();
                        else
                            this.Error('hint.open_ble');
                    });
                }
                else
                    this.Error('hint.open_ble');
            })
            .catch(err => App.ShowError(err));
        }
        else
            this.Start();
    }

    ngOnDestroy(): void
    {
        if (TypeInfo.Assigned(this.ScanSub))
        {
            this.ScanSub.unsubscribe();
            this.ScanSub = undefined;
        }

        this.Discover.Stop();
    }

    Start(): void
    {
        this.PeripheralList = this.Discover.PeripheralList;

        // discover from connected device
        if (TypeInfo.Assigned(Svc.Loki.TShell.RunningInstance))
        {
            let Peripheral = Svc.PeripheralFactory.GetCached(Svc.Loki.TShell.RunningInstance.DeviceId);
            if (TypeInfo.Assigned(Peripheral))
                this.Discover.ManualDiscover(Peripheral);
        }

        this.SingletonTimeoutId = setTimeout(() =>
        {
            if (this.PeripheralList.length === 0)
            {
                App.HideLoading();
                this.IsShowPluginDevice = true;
            }
        }, 2000);

        this.ScanSub = this.Discover.Start().subscribe(Peripheral =>
        {
            if (Peripheral.Status.IsPNP)
                return this.SelectionDevice(Peripheral);

            this.PeripheralList = this.Discover.PeripheralList;

            if (this.PeripheralList.length === 1)
            {
                if (TypeInfo.Assigned(this.SingletonTimeoutId))
                    clearTimeout(this.SingletonTimeoutId);

                this.SingletonTimeoutId = setTimeout(() =>
                {
                    this.SingletonTimeoutId = null;

                    if (this.PeripheralList.length === 1)
                        this.SelectionDevice(this.PeripheralList[0]);
                }, 2000);
            }

            if (this.PeripheralList.length > 1)
            {
                App.HideLoading();

                if (TypeInfo.Assigned(this.SingletonTimeoutId))
                {
                    clearTimeout(this.SingletonTimeoutId);
                    this.SingletonTimeoutId = null;
                }
            }
        });
    }

    SelectionDevice(Peripheral: Svc.TPeripheral | undefined): void
    {
        if (TypeInfo.Assigned(this.ScanSub))
        {
            this.ScanSub.unsubscribe();
            this.ScanSub = undefined;
        }

        this.Discover.Stop().then(() =>
        {
            this.PeripheralList = [];
            this.OnSelection.emit(Peripheral);
        });
    }

    Error(Ident: string): void
    {
        setTimeout(() => this.OnSelection.next());
        App.ShowToast(App.Translate(Ident));
    }

    @Output() OnSelection = new EventEmitter<Svc.TPeripheral | undefined>();

    private ScanSub: Subscription | undefined;
    private SingletonTimeoutId: any;
    private PeripheralList: Array<Svc.TPeripheral> = [];
    private IsShowPluginDevice: boolean = false;
}
