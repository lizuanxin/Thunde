import {Component, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import * as Svc from '../../providers';

@Component({selector: 'discover-peripheral', templateUrl: 'discover.html', providers: [Svc.TDiscoverService]})
export class DiscoverComp implements OnInit, OnDestroy
{
    constructor(private Discover: Svc.TDiscoverService)
    {
    }

    ngOnInit(): void
    {
        this.PeripheralList = this.Discover.PeripheralList;
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
                this.IsShowDeviceList = true;
                App.HideLoading();

                if (TypeInfo.Assigned(this.SingletonTimeoutId))
                {
                    clearTimeout(this.SingletonTimeoutId);
                    this.SingletonTimeoutId = null;
                }
            }
        });
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

    SelectionDevice(Peripheral: Svc.TPeripheral): void
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

    @Output() OnSelection = new EventEmitter<Svc.TPeripheral>();

    private ScanSub: Subscription | undefined;
    private SingletonTimeoutId: any;
    private PeripheralList: Array<Svc.TPeripheral>;
    private IsShowDeviceList: boolean = false;
}
