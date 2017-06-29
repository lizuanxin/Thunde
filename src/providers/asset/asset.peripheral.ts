import {Subject} from 'rxjs/Subject';
import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {ENotImplemented} from '../../UltraCreation/Core/Exception';
import {HexConv} from '../../UltraCreation/Core/Conv';
import {TAbstractShell} from '../../UltraCreation/Native/Abstract.Shell';
import {TStream} from '../../UltraCreation/Core/Stream'

import {TAsset} from './asset.types'
import {TLV, VALUE_TYPE} from './tlv.types'

export const PERPHERIAL_TIMEOUT = 6000;
const ULTRACREATION_AD_FLAG = 0xFFBC;

/* TPeripheral */

export class TPeripheral extends TAsset
{
    static ClassName: string = '';
    static ProductName: string = '';
    static AdName: string[] = [];       // peripheral discover adversting name(s)
    static AdFlag = ULTRACREATION_AD_FLAG;

    static IsImaginative = false;       // peripheral is pure imaginative no physically exist
    static IsVisible = true;            // peripheral is visiable to discover UI

/* Instance */
    constructor()
    {
        super('');

        let Type = (this.constructor as typeof TPeripheral);

        this.ObjectName = 'Peripheral.' + Type.ClassName;
        this.Name = Type.ProductName;
    }

    get IsImaginative()
    {
        return (this.constructor as typeof TPeripheral).IsImaginative;
    }

    get IsVisible()
    {
        return (this.constructor as typeof TPeripheral).IsVisible;
    }

    get IsObjectSaved()
    {
        return TypeInfo.Assigned(this.Timestamp);
    }

    get Icon_Id(): number
    {
        return this.ExtraProps.get('Icon');
    }

    get ValueList(): Array<TLV>
    {
        let RetVal = new Array<TLV>();

        this.ValueHash.forEach(iter =>
        {
            if (iter.IsPersistType)
                RetVal.push(iter)
        });

        return RetVal;
    }

    Value(Type?: number): TLV | undefined
    {
        if (TypeInfo.Assigned(Type))
            return this.ValueHash.get(Type);
        else
            return undefined;
    }

    // called from disover service
    SignalUpdate(IsOnline: boolean, RSSI: number | undefined)
    {
        this.Status.IsOnline = IsOnline;
        this.Status.RSSI = RSSI;

        if (! IsOnline)
        {
            PeripheralFactory.UpdateAggregate(this, []);
            // notify disconnect
            this.OnValueUpdate.next(null);
        }
    }

    UpdateTLValues(ValueList: Array<TLV>, ...args: any[]): Array<TLV>
    {
        let Updated: Array<TLV> = [];
        this.LastActivity = new Date().getTime();

        for (let iter of ValueList)
        {
            // try parse TLV value
            let Value = iter.Value;
            if (! TypeInfo.Assigned(Value))
                continue;

            let OldValue = this.ValueHash.get(iter.Type);
            if (! TypeInfo.Assigned(OldValue))
            {
                this.ValueHash.set(iter.Type, iter);

                this.UpdateValue(iter);
                Updated.push(iter);
            }
            else if ((OldValue as any).Timestamp !== iter.Timestamp)
            {
                this.ValueHash.set(iter.Type, iter);

                this.UpdateValue(iter);
                Updated.push(iter);
            }
        }

        return Updated;
    }

    protected UpdateValue(v: TLV, ...args: any[])
    {
        switch(v.Type)
        {
        case VALUE_TYPE.BATTERY:
            this.Status.BatteryLevel = v.Value;
            break;

        default:
            setTimeout(() => this.OnValueUpdate.next(v));
            break;
        }
    }

    async Repack(Stream: TStream): Promise<void>
    {
        await Stream.WriteUint16((this.constructor as typeof TPeripheral).AdFlag);
        await Stream.WriteUint16(this.Version);
        await Stream.WriteUint24(parseInt('0x' + this.Id) % 16777216);

        let values = this.ValueHash.values();
        for (let iter = values.next(); ! iter.done; iter = values.next())
            await iter.value.Encode(Stream);
    }

    Version: number;
    LastActivity = new Date().getTime();

    ValueHash = new Map<number, TLV>();
    Status = new TPeripheralStatus();

    OnValueUpdate = new Subject<TLV | null>();
};

/* TPeripheralStatus */

export class TPeripheralStatus
{
    IsOnline?: boolean;
    RSSI?: number;
    BatteryLevel?: number;
    IsBusying?: boolean;
}

/* TAggregatePeripheral */

export abstract class TAggregatePeripheral extends TPeripheral
{
    static AggregateType: typeof TPeripheral;
    static AggregatedTimeout = PERPHERIAL_TIMEOUT;
    /// @override: the aggregate peripheral usually to be pure imaginative
    static IsImaginative = true;

/* Instance */
    /// @override & overload: aggregate peripheral can only aggregate persistent types
    UpdateTLValues(ValueList: Array<TLV>, Ref: TPeripheral): Array<TLV>
    {
        let Now = new Date().getTime();
        let AggregatedTimeout = (this.constructor as typeof TAggregatePeripheral).AggregatedTimeout;

        this.Refs.add(Ref);
        // remove discover timeouts
        let Timeouts: Array<TPeripheral> = [];
        this.Refs.forEach(Iter =>
        {
            if (Now - Iter.LastActivity > AggregatedTimeout)
                Timeouts.push(Iter);
        })
        for (let Iter of Timeouts)
            this.Refs.delete(Iter);

        if (ValueList.length > 0)
        {
            for (let v of ValueList)
                this.UpdateValue(v, Ref, Now, Timeouts);
        }
        else
            this.UpdateValue(null, Ref, Now, Timeouts);

        return ValueList;
    }

    /// @override: derived class must to implements to update OnAggregateUpdate && OnValueChanged subject
    protected abstract UpdateValue(v: TLV | null, Ref: TPeripheral, Now: number, Timeouts: Array<TPeripheral>): void;

    protected Refs = new Set<TPeripheral>();
    OnAggregateUpdate = new Subject<any>();
}

/* TConnectablePeripheral */

export abstract class TConnectablePeripheral extends TPeripheral
{
    abstract get Shell(): TAbstractShell

    get ConnectId(): string
    {
        return this.ExtraProps.get('ConnectId');
    }

    set ConnectId(v: string)
    {
        this.ExtraProps.set('ConnectId', v);
    }
}

/* TProxyPeripheral */

export abstract class TProxyPeripheral extends TConnectablePeripheral
{
    ProxyTo: TPeripheral;
}

/* PeripheralFactory */

export class PeripheralFactory
{
    static Register(PeripheralClass: typeof TPeripheral)
    {
        if (! TypeInfo.Assigned(PeripheralClass.ClassName) || PeripheralClass.ClassName === '')
            throw new ENotImplemented('Peripheral must implement the ClassName')

        let ObjectName = 'Peripheral.' + PeripheralClass.ClassName;
        this.Repository.set(ObjectName, PeripheralClass);

        console.log('PeripheralFactory: ' + ObjectName + ' registered')
    }

    static GetCached(Id: string): TPeripheral | undefined
    {
        return this.Cached.get(Id);
    }

    static Cache(Peripheral: TPeripheral): void
    {
        if (TypeInfo.Assigned(Peripheral.Id))
        {
            this.Cached.set(Peripheral.Id, Peripheral);

            if (Peripheral instanceof TAggregatePeripheral)
                this.CachedAggregate.push(Peripheral);
        }
    }

    static Uncache(Id: string): boolean
    static Uncache(Peripheral: TPeripheral): boolean
    static Uncache(Peripheral: TPeripheral | string): boolean
    {
        if (TypeInfo.IsString(Peripheral))
            return this.Cached.delete(Peripheral);
        else if (TypeInfo.Assigned(Peripheral.Id))
            return this.Cached.delete(Peripheral.Id);
        else
            return false;
    }

    static ExistsClass(Cls: typeof TPeripheral): boolean
    static ExistsClass(ClassName: string): boolean
    static ExistsClass(NameOrCls: string | typeof TPeripheral): boolean
    {
        let PeripheralClass: typeof TPeripheral | undefined;
        if (TypeInfo.IsString(NameOrCls))
            PeripheralClass = this.Repository.get('Peripheral.' + NameOrCls);
        else
            PeripheralClass = NameOrCls

        return TypeInfo.Assigned(PeripheralClass) && this.CachedClass.has(PeripheralClass);
    }

    static Get(Id: string, Cls: typeof TPeripheral): any | undefined
    static Get(Id: string, ObjectName: string): TPeripheral | undefined
    static Get(Id: string, NameOrCls: string | typeof TPeripheral): TPeripheral | undefined
    {
        let Obj = this.Cached.get(Id);

        if (! TypeInfo.Assigned(Obj))
        {
            let ObjectName = '';
            if (TypeInfo.IsString(NameOrCls))
                ObjectName = NameOrCls;
            else
                ObjectName = 'Peripheral.' + NameOrCls.ClassName;

            let PeripheralClass = this.Repository.get(ObjectName);

            if (TypeInfo.Assigned(PeripheralClass))
            {
                Obj = new PeripheralClass();
                Obj.Id = Id;

                this.Cache(Obj);
                this.CachedClass.add(PeripheralClass);
            }
            else
                Obj = undefined;
        }

        return Obj;
    }

    static GetFromAd(AdName: string, data: Uint8Array, ScanId: string): TPeripheral | null
    {
        let ad = 0;
        let ver = 0;
        let id: string = ScanId;
        let connect_id = ScanId;

        if (data.byteLength >= 7)
        {
            // manufactory AD type
            ad = data[0] * 256 + data[1];
            if (ad === ULTRACREATION_AD_FLAG)
            {
                // firmware version
                ver = data[2] * 256 + data[3];
                // device'id 08:7C:BE:92:C0:94
                // id = (data[4] * 65536 + data[5] * 256 + data[6]).toString(16);
                id = ('08:7C:BE:' +  HexConv.Uint8ToHex(data[6])+ ':' + HexConv.Uint8ToHex(data[5]) + ':' +
                    HexConv.Uint8ToHex(data[4])).toUpperCase();
            }
        };

        let Peripheral = this.Cached.get(id);

        if (! TypeInfo.Assigned(Peripheral))
        {
            let Repository = PeripheralFactory.Repository.entries();
            for (let Iter = Repository.next(); ! Iter.done; Iter = Repository.next())
            {
                let PeripheralClass = Iter.value[1] as (typeof TPeripheral);

                if ((PeripheralClass.AdFlag !== ULTRACREATION_AD_FLAG && PeripheralClass.AdFlag === ad)
                    || (PeripheralClass.AdName.indexOf(AdName) !== -1))
                {
                    Peripheral = new PeripheralClass();
                    Peripheral.Id = id;
                    Peripheral.Name = PeripheralClass.ProductName;

                    this.Cache(Peripheral);
                    this.CachedClass.add(PeripheralClass);
                }
            }
        }

        if (TypeInfo.Assigned(Peripheral))
        {
            Peripheral.Id = id;
            Peripheral.Version = ver;

            if (Peripheral instanceof TConnectablePeripheral)
                Peripheral.ConnectId = connect_id;

            let Updated = Peripheral.UpdateTLValues(TLV.Decode(data, 7, 1, 1));
            if (Updated.length > 0)
               this.UpdateAggregate(Peripheral, Updated);

            return Peripheral;
        }
        else
            return null;
    }

    static UpdateAggregate(Ref: TPeripheral, ValueList: Array<TLV>)
    {
        let Type = Ref.constructor as typeof TPeripheral;
        this.CachedAggregate.forEach(Iter =>
        {
            let AggregateType = Iter.constructor as typeof TAggregatePeripheral;

            if (AggregateType.AggregateType === Type)
                Iter.UpdateTLValues(ValueList, Ref);
        })
    }

    static get AdNames(): string[]
    {
        let RetVal: string[] = [];

        let Repository = PeripheralFactory.Repository.values();
        for (let Iter = Repository.next(); ! Iter.done; Iter = Repository.next())
        {
            let PeripheralClass = Iter.value as (typeof TPeripheral)
            RetVal = RetVal.concat(PeripheralClass.AdName);
        }
        return RetVal;
    }

    private static Cached = new Map<string, TPeripheral>();
    private static CachedAggregate = new Array<TAggregatePeripheral>();
    private static CachedClass = new Set<typeof TPeripheral>();

    static Repository = new Map<string, typeof TPeripheral>();
}
