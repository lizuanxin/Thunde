import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {BytesConv} from '../../UltraCreation/Core/Conv';
import {EInvalidArg} from '../../UltraCreation/Core/Exception';
import {TLV as BasicTLV, TLVParser as BasicTLVParser, IntTypeSize} from '../../UltraCreation/Core/TLV';

export enum VALUE_TYPE
{
    // common
    BATTERY = 0x01,         // Integer

    PERSISTENT_TYPE_START = 0x20,
    TEMPERATURE = 0x20,     // FixedPoint 0.0000
    HUMIDITY = 0x21,        // FixedPoint 0.0000
    PM2d5 = 0x22,           // Integer
    PM10 = 0x23,            // Integer
};

/* extends TLV */

export class TLV extends BasicTLV
{
    get IsPersistType(): boolean
    {
        return this.Type >= VALUE_TYPE.PERSISTENT_TYPE_START;
    }

    static Decode(View: Uint8Array, StartOffset: number, TypeSize: IntTypeSize = 1, LengthSize: IntTypeSize = 1): Array<TLV>
    {
        return super.Decode(View, StartOffset, TypeSize, LengthSize) as Array<TLV>;
    }

    toString()
    {
        return this.Value;
    }

    public Timestamp: number;
}

/* battery */

class BatteryTLV extends TLV
{
}

/* temperature */

class TemperatureTLV extends TLV
{
    /* Object */

    valueOf(): number
    {
        return Math.round(this.Value / 10000);
    }

    toString(): string
    {
        if (! TypeInfo.Assigned(this.Value) || isNaN(this.Value))
            return '? °C'
        else
            return (Math.round(this.Value / 1000) / 10).toFixed(1) + ' °C'; //  ' °F'
    }
}

/* humidity */

class HumidityTLV extends TLV
{
    /* Object */

    valueOf(): number
    {
        return Math.round(this.Value / 10000);
    }

    toString()
    {
        if (! TypeInfo.Assigned(this.Value) || isNaN(this.Value))
            return '? %rh'
        else
            return (Math.round(this.Value / 1000) / 10).toFixed(1) + ' %rh';
    }
}

/* particulate matter */

class ParticulateMatterTLV extends TLV
{

}

class PM10TLV extends ParticulateMatterTLV
{

}

class PM2d5TLV extends ParticulateMatterTLV
{

}

/* extended TLVParser */

export class TLVParser extends BasicTLVParser
{
    static CreateTLV(Type, Length: number): TLV
    {
        switch(Type)
        {
        case VALUE_TYPE.BATTERY:
            return new BatteryTLV(Type, Length);

        case VALUE_TYPE.TEMPERATURE:
            return new TemperatureTLV(Type, Length);
        case VALUE_TYPE.HUMIDITY:
            return new HumidityTLV(Type, Length);

        case VALUE_TYPE.PM10:
            return new PM10TLV(Type, Length);
        case VALUE_TYPE.PM2d5:
            return new PM2d5TLV(Type, Length);

        default:
            return new TLV(this.Type, Length);
        }
    }

    static TransferTLV(Instance: TLV, Type, Length: number, Value?: any)
    {
        Instance.Type = Type;
        Instance.Length = Length;

        if (TypeInfo.Assigned(Value))
            Instance.Value = Value;
    }
}

/** MeasureTLVParser */

export class MeasureTLVParser extends TLVParser
{
    static DecodeValue(RAW: Uint8Array, Instance: TLV): void
    {
        if (RAW.length !== 8)
            throw new EInvalidArg();

        Instance.Timestamp = BytesConv.AsUint32(RAW, 0);
        Instance.Value = BytesConv.AsInt32(RAW, 4);
    }

    static EncodeValue(Instance: TLV): Uint8Array
    {
        let RetVal = new Uint8Array(8);

        BytesConv.ToUint32(Instance.Timestamp, RetVal, 0);
        BytesConv.ToInt32(Instance.Value, RetVal, 4);

        return RetVal;
    }
}

/** MeasureZippedTLVParser */

export class MeasureZippedTLVParser extends TLVParser
{
    static DecodeValue(RAW: Uint8Array, Instance: TLV): void
    {
        if (RAW.length !== 4)
            throw new EInvalidArg();

        Instance.Timestamp = BytesConv.AsUint16(RAW, 0);
        Instance.Value = BytesConv.AsUint16(RAW, 2);
    }

    static EncodeValue(Instance: TLV): Uint8Array
    {
        let RetVal = new Uint8Array(4);

        BytesConv.ToUint16(Instance.Timestamp, RetVal, 0);
        BytesConv.ToUint16(Instance.Value, RetVal, 2);

        return RetVal;
    }
}

/* BatteryTLVParser */

export class BatteryTLVParser extends MeasureZippedTLVParser
{
    static get Type(): number
    {
        return VALUE_TYPE.BATTERY;
    }
}

/* TemperatureTLVParser */

export class TemperatureTLVParser extends MeasureTLVParser
{
    static get Type(): number
    {
        return VALUE_TYPE.TEMPERATURE;
    }
}

/* TemperatureTLVParser */

export class HumidityTLVParser extends MeasureTLVParser
{
    static get Type(): number
    {
        return VALUE_TYPE.HUMIDITY;
    }
}

/* TemperatureTLVParser */

export class PM10TLVParser extends MeasureZippedTLVParser
{
    static get Type(): number
    {
        return VALUE_TYPE.PM10;
    }
}

/* TemperatureTLVParser */

export class PM2d5TLVParser extends MeasureZippedTLVParser
{
    static get Type(): number
    {
        return VALUE_TYPE.PM2d5;
    }
}

/* TLV register */

TLV.RegisterParser(BatteryTLVParser, 'Battery');
TLV.RegisterParser(TemperatureTLVParser, 'Temperature');
TLV.RegisterParser(HumidityTLVParser, 'Humidity');
TLV.RegisterParser(PM10TLVParser, 'PM10');
TLV.RegisterParser(PM2d5TLVParser, 'PM2.5');
