import {TypeInfo, Exception, TPersistable} from '../../UltraCreation/Core'
import {ASCII, TUtf8Encoding} from '../../UltraCreation/Encoding'

export class EInvalidFile extends Exception
{
    constructor()
    {
        super('e_invalid_file');
    }
};

const CURRENT_VERSION = 1;
export const MAX_FREQ = 1200;
export const MAX_Pulse = 400;

const DEF_FREQ = 54;
const DEF_Pulse = 100;
const DEF_REPEAT = 1;
const DEF_INTERVAL = 0;
const DEF_CLUSTER = 1;

/* TRange */

export interface IRange
{
    Low: number;
    High: number;

    IsEqual(to: IRange): boolean;
    Update(Value: number): void;
    Join(From: IRange): void;

    Print(Unit?: string): string;
}

export class TRange implements IRange
{
    constructor ()
    {
        this.Low = Number.MAX_SAFE_INTEGER;
        this.High = Number.MIN_SAFE_INTEGER;
    }

    Low: number;
    High: number;

    IsEqual(to: IRange | null): boolean
    {
        return TypeInfo.Assigned(to) && this.High === to.High && this.Low === to.Low;
    }

    Update(Value: number): void
    {
        if (Value < this.Low)
            this.Low = Value;
        if (Value > this.High)
            this.High = Value;
    }

    Join(From: IRange): void
    {
        if (From.Low < this.Low)
            this.Low = From .Low;
        if (From.High > this.High)
            this.High = From.High;
    }

    Print(Unit?: string): string
    {
        if (! TypeInfo.Assigned(Unit))
            Unit = '';

        if (this.Low === this.High)
            return this.Low.toString() + Unit;
        else
            return this.Low.toString() + Unit + '~' + this.High.toString() + Unit;
    }

    toString(): string
    {
        return this.Print();
    }
}


/* TSnap */

export interface ISnap
{
    ClusterFreqRange: IRange;
    EffectiveFreqRange: IRange;
    PulseRange: IRange;

    Update(Block: TBlock): void;
    Join(From: ISnap): void;

    Print(): string;
}

class TSnap implements ISnap
{
    constructor ()
    {
        this.EffectiveFreqRange = new TRange();
        this.ClusterFreqRange = new TRange();
        this.PulseRange = new TRange();
    }

    EffectiveFreqRange: IRange;
    ClusterFreqRange: IRange;
    PulseRange: IRange;

    Update(Block: TBlock): void
    {
        this.EffectiveFreqRange.Update(Block.EffectiveFreq);
        this.ClusterFreqRange.Update(Block.Freq);
        this.PulseRange.Update(Block.Pulse);
    }

    Join(From: ISnap)
    {
        this.EffectiveFreqRange.Join(From.EffectiveFreqRange);
        this.ClusterFreqRange.Join(From.ClusterFreqRange);
        this.PulseRange.Join(From.PulseRange);
    }

    Print(): string
    {
        if (this.EffectiveFreqRange.IsEqual(this.ClusterFreqRange))
        {
            return 'Effective Frequency: ' + this.EffectiveFreqRange.Print('Hertz') + '<br>' +
                'Pulse Width: ' + this.PulseRange.Print('us');
        }
        else
        {
            return 'Effective Frequency: ' + this.EffectiveFreqRange.Print('Hertz') + '<br>' +
                'Cluster Frequency: ' + this.ClusterFreqRange.Print('Hertz') + '<br>' +
                'Pulse Width: ' + this.PulseRange.Print('us');
        }
    }
}

/* TFile */

export class TFile extends TPersistable
{
    get Version(): number
    {
        return this._Version;
    }

    TimeEst(): number
    {
        let RetVal = 0;
        let Precalc = new Array<number>();

        for (let Section of this.Sections)
        {
            let Est = Section.TimeEst();
            RetVal += Est;
            Precalc.push(Est);
        };
        for (let Loopback of this.SectionLoopback)
            RetVal += Precalc[Loopback.Idx];

        return RetVal;
    }

    Snap(): Array<ISnap>
    {
        let RetVal = new Array<ISnap>();

        let Prev: ISnap = null;
        for (let i = 0; i < this.Sections.length; i++)
        {
            let Snap = this.Sections[i].Snap();

            if (TypeInfo.Assigned(Prev) &&
                (Prev.ClusterFreqRange.IsEqual(Snap.ClusterFreqRange) && Prev.PulseRange.IsEqual(Snap.PulseRange)))
            {
                Prev.Join(Snap)
            }
            else
                RetVal.push(Snap);
            Prev = Snap;
        }
        return RetVal;
    }

    LoadFrom(File: string | Uint8Array)
    {
        if (TypeInfo.IsString(File))
            File = TUtf8Encoding.Instance.Encode(File);

        let token = new TToken();
        let Idx = 0;
        let Section: TSection = null;
        let Block: TBlock = null;
        let LastBlock: TBlock = null;

        while (Idx < File.byteLength)
        {
            Idx = token.Next(File, Idx);
            if (Idx === -1)
                break;

            switch(token.Type)
            {
            case TTokenType.Version:
                this._Version = token.Version;
                continue;
            case TTokenType.DigitBase:
                this.DigitBase = token.DigitBase;
                continue;

            case TTokenType.SectionStart:
                Section = new TSection();
                continue;
            case TTokenType.SectionEnd:

                Section.Blocks.push(Block);
                this.Sections.push(Section);

                Section = null;
                LastBlock = Block = null;
                continue;

            case TTokenType.BlockSingle:
                if (TypeInfo.Assigned(Block))
                {
                    LastBlock = Block;
                    Section.Blocks.push(Block);
                    // console.log(Block);
                }
                Block = new TBlock(LastBlock);
                continue;

            case TTokenType.BlockStart:
                Block = new TBlock(LastBlock);
                continue;
            case TTokenType.BlockEnd:
                LastBlock = Block;
                Section.Blocks.push(Block);
                Block = null;
                continue;


            case TTokenType.LoopStart:
            case TTokenType.LoopEnd:
                continue;
            case TTokenType.LoopSection:
                let Loop = this.Sections[token.Value - 1];
                this.SectionLoopback.push({Idx: token.Value - 1, Section: Loop});
                continue;
            }

            if (token.SectionDepth > 0)
            {
                // console.log(TTokenType[token.Type] + ' ' + token.Value.toString(16));
                if (token.BlockDepth > 0)
                    Block.PushToken(token)
                else
                    Section.PushToken(token)
            };
        }
    }

    DigitBase: number = 16;
    Sections: Array<TSection> = [];
    SectionLoopback: Array<ISectionLoopback> = [];

    private _Version: number = CURRENT_VERSION;
}

/* TSection */

interface ISectionLoopback
{
    Idx: number;
    Section: TSection;
};

export class TSection extends TPersistable
{
    Interval: number = DEF_INTERVAL;
    Repeat: number = DEF_REPEAT;

    TimeEst()
    {
        let RetVal: number = 0;

        for (let Block of this.Blocks)
            RetVal += Block.TimeEst();

        return (RetVal + this.Interval) * this.Repeat;
    }

    Snap(): ISnap
    {
        let RetVal: ISnap = new TSnap();

        let TimeEst: number = 0;

        for (let Block of this.Blocks)
        {
            TimeEst += Block.TimeEst();
            RetVal.Update(Block);
        }
        return RetVal;
    }

    PushToken(token: TToken): void
    {
        switch (token.Type)
        {
        case TTokenType.Repeat:
            this.Repeat = token.Value;
            break;

        case TTokenType.Interval:
            this.Interval = token.Value;
            break;

        default:
            throw new EInvalidFile();
        };
    }

    Serialization(DigitBase: number): string
    {
        let RetVal = String.fromCharCode(TTokenType.SectionStart);
        if (this.Repeat !== 1)
            RetVal += String.fromCharCode(TTokenType.Repeat) + this.Repeat.toString(DigitBase).toLowerCase();
        if (this.Interval !== 0)
            RetVal += String.fromCharCode(TTokenType.Interval) + this.Interval.toString(DigitBase).toLowerCase();

        return RetVal + this.SerializationBlocks(DigitBase) + String.fromCharCode(TTokenType.SectionEnd);
    }

    private SerializationBlocks(DigitBase: number): string
    {
        let RetVal = '{';
        if (this.Repeat !== 1)
            RetVal += 'R' + this.Repeat.toString(DigitBase).toLowerCase();
        if (this.Interval !== 0)
            RetVal += 'I' + this.Interval.toString(DigitBase).toLowerCase();

        let Prev: TBlock = null;
        for (let i = 0; i < this.Blocks.length; i ++)
        {
            RetVal += this.Blocks[i].Serialization(DigitBase, Prev);
            Prev = this.Blocks[i];
        }

        return RetVal + '}';
    }

    Blocks: Array<TBlock> = [];
}

/* TBlock */

export class TBlock extends TPersistable
{
    constructor(Ref?: TBlock)
    {
        super();

        if (TypeInfo.Assigned(Ref))
        {
            this.Freq = Ref.Freq;
            this.Pulse = Ref.Pulse;
            this.Cluster = Ref.Cluster;
            this.Interval = Ref.Interval;
            this.Repeat = Ref.Repeat;
        }
    }

    Freq: number = DEF_FREQ;
    Pulse: number = DEF_Pulse;
    Cluster: number = DEF_CLUSTER;

    Interval: number = DEF_INTERVAL;
    Repeat: number = DEF_REPEAT;

    get EffectiveFreq(): number
    {
        return Math.round(1 / (1 / this.Freq * this.Cluster + this.Interval / 1000) * 10) / 10;
    }

    TimeEst(): number
    {
        return (1000 / this.Freq * this.Cluster + this.Interval) * this.Repeat;
    }


    PushToken(token: TToken): void
    {
        switch(token.Type)
        {
        case TTokenType.Interval:
            this.Interval = token.Value;
            break;

        case TTokenType.Repeat:
            this.Repeat = token.Value;
            break;

        case TTokenType.FreqT:
            this.Freq = token.Value / 10;
            break;
        case TTokenType.Freq:
            this.Freq = token.Value;
            break;

        case TTokenType.Pulse:
            this.Pulse = token.Value;
            break;

        case TTokenType.Cluster:
            this.Cluster = token.Value;
            break;

        default:
            throw new EInvalidFile();
        }
    }

    Serialization(DigitBase: number, Prev: TBlock | null): string
    {
        let RetVal = String.fromCharCode(ASCII.VerticalBar);

        if (TypeInfo.Assigned(Prev))
        {
            if (this.Repeat !== DEF_REPEAT)
                RetVal += 'R' + this.Repeat.toString(DigitBase).toLowerCase();
            if (this.Interval !== DEF_INTERVAL)
                RetVal += 'I' + this.Interval.toString(DigitBase).toLowerCase();
            if (this.Freq !== DEF_FREQ)
                RetVal += 'F' + this.Freq.toString(DigitBase).toLowerCase();
            if (this.Pulse !== DEF_Pulse)
                RetVal += 'P' + this.Pulse.toString(DigitBase).toLowerCase();
            if (this.Cluster !== DEF_CLUSTER)
                RetVal += 'C' + this.Cluster.toString(DigitBase).toLowerCase();
        }
        else
        {
            if (this.Repeat !== Prev.Repeat)
                RetVal += 'R' + this.Repeat.toString(DigitBase).toLowerCase();
            if (this.Interval !== Prev.Interval)
                RetVal += 'I' + this.Interval.toString(DigitBase).toLowerCase();
            if (this.Freq !== Prev.Freq)
                RetVal += 'F' + this.Freq.toString(DigitBase).toLowerCase();
            if (this.Pulse !== Prev.Pulse)
                RetVal += 'P' + this.Pulse.toString(DigitBase).toLowerCase();
            if (this.Cluster !== Prev.Cluster)
                RetVal += 'C' + this.Cluster.toString(DigitBase).toLowerCase();
        }

        return RetVal;
    }
}

/* TToken */

enum TTokenType
{
    Version         = ASCII.UPPER_V,
    DigitBase       = ASCII.UPPER_D,

    LoopStart       = ASCII.LessThan,
    LoopEnd         = ASCII.GreaterThan,
    LoopSection     = ASCII.UPPER_S,

    SectionStart    = ASCII.LeftBrace,
    SectionEnd      = ASCII.RightBrace,

    BlockSingle     = ASCII.VerticalBar,
    BlockStart      = ASCII.LeftSquareBracket,
    BlockEnd        = ASCII.RightSquareBracket,

    Repeat          = ASCII.UPPER_R,
    Interval        = ASCII.UPPER_I,
    Freq            = ASCII.UPPER_F,
    FreqT           = ASCII.UPPER_T,
    Pulse         = ASCII.UPPER_P,
    Cluster         = ASCII.UPPER_C
}

class TToken
{
    Next(View: Uint8Array, Idx: number): number
    {
        if (! TypeInfo.Assigned(TTokenType[View[Idx]]))
            throw new EInvalidFile();
        this._Type = View[Idx ++];

        switch(this._Type)
        {
        case TTokenType.BlockSingle:
            if (this._BlockDepth > 0)
                this._BlockDepth --;
        case TTokenType.BlockStart:
            this._BlockDepth ++;
            if (this._BlockDepth !== 1)
                throw new EInvalidFile();
            break;

        case TTokenType.BlockEnd:
            this._BlockDepth --;
            if (this._BlockDepth !== 0)
                throw new EInvalidFile();
            break;

        case TTokenType.SectionStart:
            this._SectionDepth ++;
            if (this._SectionDepth !== 1)
                throw new EInvalidFile();
            break;

        case TTokenType.SectionEnd:
            this._SectionDepth --;
            this._BlockDepth = 0;

            if (this._SectionDepth !== 0)
                throw new EInvalidFile();
            break;
        }

        let ValueStr: string = '';
        for (; Idx < View.length; Idx ++)
        {
            if (! TToken.IsDigit(View[Idx]))
                break;
            ValueStr += String.fromCharCode(View[Idx]);
        }

        switch(this._Type)
        {
        case TTokenType.Version:
            this._Value = parseInt(ValueStr, 10);   // version always base 10
            this._Version =  this._Value;
            break;
        case TTokenType.DigitBase:
            this._Value = parseInt(ValueStr, 10);   // base always base 10
            this._DigitBase =  this._Value;
            break;

        case TTokenType.LoopStart:
            if (this._SectionDepth !== 0 || this._BlockDepth !== 0)
                throw new EInvalidFile();
            break;
        case TTokenType.LoopEnd:
            if (this._SectionDepth !== 0 || this._BlockDepth !== 0)
                throw new EInvalidFile();
            Idx = View.byteLength;
            break;
        case TTokenType.LoopSection:
            this._Value = parseInt(ValueStr, 10);   // Loop always base 10
            break;

        default:
            this._Value = parseInt(ValueStr, this._DigitBase);
        }

        return Idx;
    }

    get Version(): number
    {
        return this._Version;
    }

    get DigitBase(): number
    {
        return this._DigitBase;
    }

    get Type(): TTokenType
    {
        return this._Type;
    }

    get Value(): number
    {
        return this._Value;
    }

    get SectionDepth(): number
    {
        return this._SectionDepth;
    }

    get BlockDepth(): number
    {
        return this._BlockDepth;
    }

    private static IsDigit(Value: number): boolean
    {
        return (Value >= ASCII.Zero && Value <= ASCII.Nine) ||
            (Value >= ASCII.LOWER_A && Value <= ASCII.LOWER_F);
    }

    private _Type: TTokenType
    private _Value: number;

    private _DigitBase: number = 10;
    private _Version: number = 1;

    private _SectionDepth: number = 0;
    private _BlockDepth: number = 0;
}
