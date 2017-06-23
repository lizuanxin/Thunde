import {TLangAsset} from './asset.types'

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {HexConv} from '../../UltraCreation/Core/Conv'
import {TBase64Encoding} from '../../UltraCreation/Encoding'
import {TPersistPropRule} from '../../UltraCreation/Core/Persistable'

import {IBodyPart, ICategory, IScriptFile} from '..'

/*　TBody */

export class TBodyPart extends TLangAsset implements IBodyPart
{
    constructor()
    {
        super('Body');
    }

    Icon: number = null;
}

/* TCategory */

export class TCategory extends TLangAsset implements ICategory
{
    constructor()
    {
        super('Category');
    }

    /* IPersistable */
    DefinePropRules(PropRules: Array<TPersistPropRule>): void
    {
        super.DefinePropRules(PropRules);
        PropRules.push(new TPersistPropRule('Category', ['Icon']))
    }

    Icon: number = null;
    Files: Array<TScriptFile> = [];
}

/* TScriptFile */

export type TScriptFileList = Array<TScriptFile>;

export class TScriptFile extends TLangAsset implements IScriptFile
{
    constructor()
    {
        super('ScriptFile');
    }

    /* IPersistable */
    DefinePropRules(PropRules: Array<TPersistPropRule>): void
    {
        super.DefinePropRules(PropRules);
        PropRules.push(new TPersistPropRule('ScriptFile', ['Category_Id', 'Mode_Id', 'Content', 'Md5', 'Duration', 'Author']))
    }

    get Md5Name(): string
    {
        return TBase64Encoding.Instance.EncodeToString(HexConv.HexToBin(this.Md5));
    }

    get DurationMinute(): number
    {
        return Math.trunc((this.Duration + 30) / 60);
    }

    get DurationString(): string
    {
        let Time = '00:00';
        let Min = Math.trunc(this.Duration / 60);
        if (Min === 0)
            Time = '00:';
        else if (Min < 10)
            Time = '0' + Min + ':';
        else
            Time = Min + ':';

        let Sec = this.Duration % 60;
        if (Sec === 0)
            Time += '00';
        else if (Sec < 10)
            Time += '0' + Sec;
        else
            Time += Sec + '';

        return Time;
    }

   /**
     *  https://en.wikipedia.org/wiki/Degree_(angle)
     *  https://en.wikipedia.org/wiki/Radian
     *  http://www.w3schools.com/tags/canvas_arc.asp
     *
     *  turn[0.0~1.0]   degree[0°~360°]     radian[0~2π]:
     *      90°         = 0.25 turn         = 0.5π
     *      180°        = 0.5 turn          = 1π
     *      360°        = 1 turn            = 2π
     **/
    DrawMinute(Canvas: HTMLCanvasElement, Ctx: CanvasRenderingContext2D,
        Radius: number, Ox: number, Oy: number)// , Turns: number[])
    {
        let RestoreFillStyle = Ctx.fillStyle;
        let Turns = [1.75, this.Duration / 3600];

        let ColorFills: string[] = [null, Ctx.fillStyle as string];

        Ctx.beginPath();
        Ctx.moveTo(Ox, Oy);
        Ctx.arc(Ox, Oy, Radius, 0, 2 * Math.PI);
        Ctx.closePath();

        let Alpha = Ctx.globalAlpha;
        Ctx.globalAlpha = Alpha * 0.15;
        Ctx.fillStyle = ColorFills[1];
        Ctx.lineWidth = 1;
        Ctx.fill();

        Ctx.globalAlpha = Alpha;

        for (let i = 0, StartArc = 0, EndArc = 0; i < Turns.length; i++ , StartArc = EndArc)
        {
            EndArc = EndArc + Turns[i] * Math.PI * 2;

            Ctx.beginPath();
            Ctx.moveTo(Ox, Oy);
            Ctx.arc(Ox, Oy, Radius, StartArc, EndArc);
            Ctx.closePath();

            if (TypeInfo.Assigned(ColorFills[i]))
            {
                Ctx.fillStyle = ColorFills[i];
                Ctx.fill();
            }
        }

        Ctx.fillStyle = RestoreFillStyle;
    }

    Icon: number = null;
    Category_Id: string = null;
    Mode_Id: string = null;

    Md5: string = null;
    Duration: number = null;
    Author: string = null;
    Professional: boolean = null;

    Content: string = null;
    ContentBuffer: Uint8Array;

    BodyParts: Array<IBodyPart> = [];
    Details: Array<TScriptFileDesc> = [];
}

/* TScriptFileDesc */

export class TScriptFileDesc extends TLangAsset
{
    constructor()
    {
        super('ScriptFileDesc');
    }

    /* IPersistable */
    DefinePropRules(PropRules: Array<TPersistPropRule>): void
    {
        super.DefinePropRules(PropRules);
        PropRules.push(new TPersistPropRule('ScriptFileDesc', ['ScriptFile_Id', 'Idx', 'Professional']))
    }

    ScriptFile_Id: string = null;
    Idx: number = null;
    Professional: boolean = null;

    BodyParts: Array<IBodyPart> = [];
}
