import {TLangAsset} from '.';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {HexConv} from '../../UltraCreation/Core/Conv';
import {TBase64Encoding} from '../../UltraCreation/Encoding';
import {TPersistPropRule} from '../../UltraCreation/Core/Persistable';

import {IBodyPart, ICategory, IScriptFile} from '..';


/* TMode */

export class TMode extends TLangAsset
{
    constructor ()
    {
        super('Mode');
    }

    get IconChar(): string
    {
        return String.fromCharCode(this.Icon);
    }

    Icon: number = null;
    Files: Array<TScriptFile> = [];
}

/*　TBody */

export class TBodyPart extends TLangAsset implements IBodyPart
{
    constructor()
    {
        super('Body');
    }

    get IconChar(): string
    {
        return String.fromCharCode(this.Icon);
    }

    Icon: number | null = null;
}

/* TCategory */

export class TCategory extends TLangAsset implements ICategory
{
    constructor()
    {
        super('Category');
    }

    get IconChar(): string
    {
        return String.fromCharCode(this.Icon);
    }

    /* IPersistable */
    DefinePropRules(PropRules: Array<TPersistPropRule>): void
    {
        super.DefinePropRules(PropRules);
        PropRules.push(new TPersistPropRule('Category', ['Icon']));
    }

    Icon: number | null = null;
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
        PropRules.push(new TPersistPropRule('ScriptFile', ['Category_Id', 'Mode_Id', 'Content', 'Md5', 'Duration', 'Author']));
    }

    get Md5Name(): string
    {
        if (TypeInfo.Assigned(this.Md5))
            return TBase64Encoding.EncodeToString(HexConv.HexToBin(this.Md5));
        else
            return '';
    }

    get DurationSecond(): number
    {
        return this.Duration ? this.Duration : 0;
    }

    get DurationMinute(): number
    {
        return Math.trunc((this.DurationSecond + 30) / 60);
    }

    DrawDuration(Canvas: HTMLCanvasElement)
    {
        this.DrawMinute(Canvas, Canvas.getContext('2d', {}), ['#0095de', '#FFFFFF']);
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
        ColorFills?: string[], Radius?: number, Ox?: number, Oy?: number): void
    {
        if (! TypeInfo.Assigned(Ctx))
            Ctx = Canvas.getContext('2d', {});

        if (! TypeInfo.Assigned(ColorFills))
            ColorFills = [null, Ctx.fillStyle as string];
        if (! TypeInfo.Assigned(Radius))
            Radius = Canvas.height / 2;
        if (! TypeInfo.Assigned(Ox))
            Ox = Radius;
        if (! TypeInfo.Assigned(Oy))
            Oy = Radius;

        let RestoreFillStyle = Ctx.fillStyle;
        let Turns = [1.75, this.DurationSecond / 3600];

        Ctx.beginPath();
        Ctx.moveTo(Ox, Oy);
        Ctx.arc(Ox, Oy, Radius, 0, 2 * Math.PI);
        Ctx.closePath();

        let Alpha = Ctx.globalAlpha;
        Ctx.globalAlpha = Alpha * 0.15;
        Ctx.fillStyle = ColorFills[1] as string;
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
                Ctx.fillStyle = ColorFills[i] as string;
                Ctx.fill();
            }
        }

        Ctx.fillStyle = RestoreFillStyle;
    }

    Icon: number | null = null;
    Category_Id: string | null = null;
    Mode_Id: string | null= null;

    Md5: string | null = null;
    Duration: number | null = null;
    Author: string | null = null;
    Professional: boolean | null = null;

    Content: string | null = null;
    ContentBuffer: Uint8Array | undefined;

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
        PropRules.push(new TPersistPropRule('ScriptFileDesc', ['ScriptFile_Id', 'Idx', 'Professional']));
    }

    ScriptFile_Id: string | null = null;
    Idx: number | null = null;
    Professional: boolean | null = null;
    BodyParts: Array<IBodyPart> = [];
}
