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
// export const MAX_FREQ = 1200;

export class TFile extends TPersistable
{
    get Version(): number
    {
        return this._Version;
    }

    TimeEst(): number
    {
        let RetVal = 0;

        for (let Section of this.Sections)
            RetVal += Section.TimeEst();
        for (let Loopback of this.SectionLoopback)
            RetVal += Loopback.TimeEst();

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
                this.SectionLoopback.push(Loop);
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
    SectionLoopback: Array<TSection> = [];

    private _Version: number = CURRENT_VERSION;
}

export class TSection extends TPersistable
{
    Interval: number = 0;
    Repeat: number = 1;

    TimeEst()
    {
        let RetVal: number = 0;

        for (let Block of this.Blocks)
            RetVal += Block.TimeEst();

        return (RetVal + this.Interval) * this.Repeat;
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

        return RetVal + this.SerializationBlocks() + String.fromCharCode(TTokenType.SectionEnd);
    }

    private SerializationBlocks(): string
    {
        return '';
    }

    Blocks: Array<TBlock> = [];
}

export class TBlock extends TPersistable
{
    constructor(Ref?: TBlock)
    {
        super();

        if (TypeInfo.Assigned(Ref))
        {
            this.Freq = Ref.Freq;
            this.Impulse = Ref.Impulse;
            this.Cluster = Ref.Cluster;
            this.Interval = Ref.Interval;
            this.Repeat = Ref.Repeat;
        }
    }

    Freq: number = 54;
    Impulse: number = 100;
    Cluster: number = 1

    Interval: number = 0;
    Repeat: number = 1;

    TimeEst()
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

        case TTokenType.Impulse:
            this.Impulse = token.Value;
            break;

        case TTokenType.Cluster:
            this.Cluster = token.Value;
            break;

        default:
            throw new EInvalidFile();
        }
    }

    Serialization(): string
    {
        let RetVal = String.fromCharCode(ASCII.VerticalBar);

        return RetVal;
    }
}

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
    Impulse         = ASCII.UPPER_P,
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
