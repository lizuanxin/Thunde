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

/* TPerpherial */

export class TPerpherial extends TAsset
{
    static ClassName: string = '';
    static ProductName: string = '';
    static AdName: string[] = [];       // perpherial discover adversting name(s)
    static AdFlag = ULTRACREATION_AD_FLAG;

    static IsImaginative = false;       // perpherial is pure imaginative no physically exist
    static IsVisible = true;            // perpherial is visiable to discover UI

/* Instance */
    constructor()
    {
        super('');

        let Type = (this.constructor as typeof TPerpherial);

        this.ObjectName = 'Perpherial.' + Type.ClassName;
        this.Name = Type.ProductName;
    }

    get IsImaginative()
    {
        return (this.constructor as typeof TPerpherial).IsImaginative;
    }

    get IsVisible()
    {
        return (this.constructor as typeof TPerpherial).IsVisible;
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

    Value(Type?: number): TLV
    {
        return this.ValueHash.get(Type);
    }

    // called from disover service
    SignalUpdate(IsOnline: boolean, RSSI: number | undefined)
    {
        this.Status.IsOnline = IsOnline;
        this.Status.RSSI = RSSI;

        if (! IsOnline)
        {
            PerpherialFactory.UpdateAggregate(this, []);
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
            else if (OldValue.Timestamp !== iter.Timestamp)
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
        await Stream.WriteUint16((this.constructor as typeof TPerpherial).AdFlag);
        await Stream.WriteUint16(this.Version);
        await Stream.WriteUint24(parseInt('0x' + this.Id) % 16777216);

        let values = this.ValueHash.values();
        for (let iter = values.next(); ! iter.done; iter = values.next())
            await iter.value.Encode(Stream);
    }

    Version: number;
    LastActivity = new Date().getTime();

    ValueHash = new Map<number, TLV>();
    Status = new TPerpherialStatus();

    OnValueUpdate = new Subject<TLV | null>();
};

/* TPerpherialStatus */

export class TPerpherialStatus
{
    IsOnline?: boolean;
    RSSI?: number;
    BatteryLevel?: number;
    IsBusying?: boolean;
}

/* TAggregatePerpherial */

export abstract class TAggregatePerpherial extends TPerpherial
{
    static AggregateType: typeof TPerpherial;
    static AggregatedTimeout = PERPHERIAL_TIMEOUT;
    /// @override: the aggregate perpherial usually to be pure imaginative
    static IsImaginative = true;

/* Instance */
    /// @override & overload: aggregate perpherial can only aggregate persistent types
    UpdateTLValues(ValueList: Array<TLV>, Ref: TPerpherial): Array<TLV>
    {
        let Now = new Date().getTime();
        let AggregatedTimeout = (this.constructor as typeof TAggregatePerpherial).AggregatedTimeout;

        this.Refs.add(Ref);
        // remove discover timeouts
        let Timeouts: Array<TPerpherial> = [];
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
    protected abstract UpdateValue(v: TLV | null, Ref: TPerpherial, Now: number, Timeouts: Array<TPerpherial>);

    protected Refs = new Set<TPerpherial>();
    OnAggregateUpdate = new Subject<any>();
}

/* TConnectablePerpherial */

export abstract class TConnectablePerpherial extends TPerpherial
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

/* TProxyPerpherial */

export abstract class TProxyPerpherial extends TConnectablePerpherial
{
    ProxyTo: TPerpherial;
}

/* PerpherialFactory */

export class PerpherialFactory
{
    static Register(PerpherialClass: typeof TPerpherial)
    {
        if (! TypeInfo.Assigned(PerpherialClass.ClassName) || PerpherialClass.ClassName === '')
            throw new ENotImplemented('Perpherial must implement the ClassName')

        let ObjectName = 'Perpherial.' + PerpherialClass.ClassName;
        this.Repository.set(ObjectName, PerpherialClass);

        console.log('PerpherialFactory: ' + ObjectName + ' registered')
    }

    static GetCached(Id: string): TPerpherial
    {
        return this.Cached.get(Id);
    }

    static Cache(Perpherial: TPerpherial): void
    {
        this.Cached.set(Perpherial.Id, Perpherial);

        if (Perpherial instanceof TAggregatePerpherial)
            this.CachedAggregate.push(Perpherial);
    }

    static Uncache(Id: string): boolean
    static Uncache(Perpherial: TPerpherial): boolean
    static Uncache(Perpherial: TPerpherial | string): boolean
    {
        if (TypeInfo.IsString(Perpherial))
            return this.Cached.delete(Perpherial);
        else
            return this.Cached.delete(Perpherial.Id);
    }

    static ExistsClass(Cls: typeof TPerpherial): boolean
    static ExistsClass(ClassName: string): boolean
    static ExistsClass(NameOrCls: string | typeof TPerpherial): boolean
    {
        let PerpherialClass: typeof TPerpherial;
        if (TypeInfo.IsString(NameOrCls))
            PerpherialClass = this.Repository.get('Perpherial.' + NameOrCls);
        else
            PerpherialClass = NameOrCls

        return TypeInfo.Assigned(PerpherialClass) && this.CachedClass.has(PerpherialClass);
    }

    static Get(Id: string, Cls: typeof TPerpherial): any | null
    static Get(Id: string, ObjectName: string): TPerpherial | null
    static Get(Id: string, NameOrCls: string | typeof TPerpherial): TPerpherial | null
    {
        let Obj = this.Cached.get(Id);

        if (! TypeInfo.Assigned(Obj))
        {
            let ObjectName = '';
            if (TypeInfo.IsString(NameOrCls))
                ObjectName = NameOrCls;
            else
                ObjectName = 'Perpherial.' + NameOrCls.ClassName;

            let PerpherialClass = this.Repository.get(ObjectName);

            if (TypeInfo.Assigned(PerpherialClass))
            {
                Obj = new PerpherialClass();
                Obj.Id = Id;

                this.Cache(Obj);
                this.CachedClass.add(PerpherialClass);
            }
            else
                Obj = null;
        }

        return Obj;
    }

    static GetFromAd(AdName: string, data: Uint8Array, ScanId: string): TPerpherial | null
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

        let Perpherial: TPerpherial = this.Cached.get(id);

        if (! TypeInfo.Assigned(Perpherial))
        {
            let Repository = PerpherialFactory.Repository.entries();
            for (let Iter = Repository.next(); ! Iter.done; Iter = Repository.next())
            {
                let PerpherialClass = Iter.value[1] as (typeof TPerpherial);

                if ((PerpherialClass.AdFlag !== ULTRACREATION_AD_FLAG && PerpherialClass.AdFlag === ad)
                    || (PerpherialClass.AdName.indexOf(AdName) !== -1))
                {
                    Perpherial = new PerpherialClass();
                    Perpherial.Id = id;
                    Perpherial.Name = PerpherialClass.ProductName;

                    this.Cache(Perpherial);
                    this.CachedClass.add(PerpherialClass);
                }
            }
        }

        if (TypeInfo.Assigned(Perpherial))
        {
            Perpherial.Id = id;
            Perpherial.Version = ver;

            if (Perpherial instanceof TConnectablePerpherial)
                Perpherial.ConnectId = connect_id;

            let Updated = Perpherial.UpdateTLValues(TLV.Decode(data, 7, 1, 1));
            if (Updated.length > 0)
               this.UpdateAggregate(Perpherial, Updated);

            return Perpherial;
        }
        else
            return null;
    }

    static UpdateAggregate(Ref: TPerpherial, ValueList: Array<TLV>)
    {
        let Type = Ref.constructor as typeof TPerpherial;
        this.CachedAggregate.forEach(Iter =>
        {
            let AggregateType = Iter.constructor as typeof TAggregatePerpherial;

            if (AggregateType.AggregateType === Type)
                Iter.UpdateTLValues(ValueList, Ref);
        })
    }

    static get AdNames(): string[]
    {
        let RetVal: string[] = [];

        let Repository = PerpherialFactory.Repository.values();
        for (let Iter = Repository.next(); ! Iter.done; Iter = Repository.next())
        {
            let PerpherialClass = Iter.value as (typeof TPerpherial)
            RetVal = RetVal.concat(PerpherialClass.AdName);
        }
        return RetVal;
    }

    private static Cached = new Map<string, TPerpherial>();
    private static CachedAggregate = new Array<TAggregatePerpherial>();
    private static CachedClass = new Set<typeof TPerpherial>();

    static Repository = new Map<string, typeof TPerpherial>();
}
