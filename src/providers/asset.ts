import {Injectable}  from '@angular/core';

import {TypeInfo, IPersistable, TPersistable, TPersistPropRule, TGuid, HexConv} from '../UltraCreation/Core'
import {TBase64Encoding} from '../UltraCreation/Encoding'
import {TSqlQuery, TSqliteStorage} from '../UltraCreation/Storage';

import {const_data, IBodyPart, ICategory, IScriptFile, Loki} from '.'
import {TDistributeService} from './distribute';

module Queries
{
    export const GetCategories = 'SELECT Category.*, ObjectName, Name, Desc FROM Asset INNER JOIN Category ON Category.Id = Asset.Id'
    export const GetFileList = `SELECT ScriptFile.*, ObjectName, Asset.Name, Asset.Desc FROM ScriptFile INNER JOIN Asset ON Asset.Id = ScriptFile.Id
        WHERE Category_Id = "?" ORDER BY Asset.Id`;
    export const GetFileBodyList = `SELECT ScriptFile_Id, Body.* FROM Body INNER JOIN ScriptFile_Body ON ScriptFile_Body.Body_Id = Body.Id
        ORDER BY ScriptFile_Id`;
    /*
    export const GetBodyUsage = `SELECT ObjectName, Name, Desc FROM ScriptFile_Body
        INNER JOIN Body ON Body.Id = ScriptFile_Body.Body_Id INNER JOIN Asset BodyAsset ON BodyAsset.Id = Body.Id
        WHERE ScriptFile_Id = "?" ORDER BY Body.Id`;
    */
    export const GetFileDesc = `SELECT ScriptFileDesc.*, ObjectName, Asset.Name, Asset.Desc FROM ScriptFileDesc INNER JOIN Asset ON Asset.Id = ScriptFileDesc.Id
        WHERE ScriptFile_Id= "?" ORDER BY Idx`
}

@Injectable()
export class TAssetService
{
    constructor(private Distribute: TDistributeService)
    {
        this.Storage = new TSqliteStorage(const_data.DatabaseName);
        console.log('TAssetService construct');
    }

    static Initialize(Storage: TSqliteStorage): Promise<void>
    {
        return Storage.ExecQuery(new TSqlQuery(Queries.GetCategories))
            .then(DataSet =>
            {
                while (! DataSet.Eof)
                {
                    let Category = new TCategory();
                    Category.Assign(DataSet.Curr);
                    (this as typeof TAssetService)._Categories.push(Category);

                    DataSet.Next();
                }
            });
    }

    Save(Obj: TScriptFile | Array<TScriptFileDesc>): Promise<void>
    {
        if (Obj instanceof TScriptFile)
            return this.Storage.SaveObject(Obj);
        else
        {
            let Promises = new Array<Promise<void>>();
            for (let i = 0; i < Obj.length; i ++)
                Promises.push(this.Storage.SaveObject(Obj[i]));
            return Promise.all(Promises).then(() => {});
        }
    }

    get Categories(): Array<TCategory>
    {
        return (this.constructor as typeof TAssetService)._Categories;
    }

    get BodyParts(): Array<IBodyPart>    // for the debug
    {
        return const_data.BodyParts;
    }

    Category_ById(Id: string): TCategory
    {
        for (let iter of (this.constructor as typeof TAssetService)._Categories)
        {
            if (iter.Id === Id)
                return iter;
        };
        return null;
    }

    GetKey(Key: string): Promise<string | Object>
    {
        return this.Storage.Get(Key)
            .then(Value =>
            {
                if (Value.length > 0 && Value[0] === '{')
                    return JSON.parse(Value)
                else
                    return Value;
            });
    }

    SetKey(Key: string, Value: string | Object): Promise<void>
    {
        if (Value instanceof Object)
            return this.Storage.Set(Key, JSON.stringify(Value))
        else
            return this.Storage.Set(Key, Value);
    }

    async FileList(Category_Id: string): Promise<Array<TScriptFile>>
    {
        let DataSet = await this.Storage.ExecQuery(new TSqlQuery(Queries.GetFileList, [Category_Id]));
        let FileBodyList = await this.FileBodyList();

        let RetVal = new Array<TScriptFile>();

        while (! DataSet.Eof)
        {
            let F = new TScriptFile();
            RetVal.push(F);

            F.Assign(DataSet.Curr);
            F.BodyParts = FileBodyList.get(F.Id);

            /*
            if ((! TypeInfo.Assigned(F.Duration) || F.Duration === 0) && TypeInfo.Assigned(F.Content))
            {
                let LokiFile = new Loki.TFile();
                LokiFile.LoadFrom(F.Content);

                F.Edit();
                F.Duration = Math.trunc(((LokiFile.TimeEst() / 1000) + 30) / 60) * 60;
                this.Save(F);
            }
            */

            await this.Distribute.ReadScriptFile(F);
            if (F.IsEditing)
            {
                console.log('saving: ' + F.Name);
                this.Save(F).catch(err => console.log(err.message));
            }

            DataSet.Next();
        }

        return RetVal;
    }

    private async FileBodyList(): Promise<Map<string, Array<IBodyPart>>>
    {
        if (this._FileBodyList.size === 0)
        {
            let DataSet = await this.Storage.ExecQuery(new TSqlQuery(Queries.GetFileBodyList));

            while (! DataSet.Eof)
            {
                let entry = this._FileBodyList.get(DataSet.Curr.ScriptFile_Id);
                if (! TypeInfo.Assigned(entry))
                {
                    this._FileBodyList.set(DataSet.Curr.ScriptFile_Id, new Array<IBodyPart>());
                    entry = this._FileBodyList.get(DataSet.Curr.ScriptFile_Id);
                }
                entry.push(DataSet.Curr);

                DataSet.Next();
            }
        }
        return this._FileBodyList;
    }

    async FileDesc(ScriptFile: TScriptFile): Promise<void>
    {
        let DataSet = await this.Storage.ExecQuery(new TSqlQuery(Queries.GetFileDesc, [ScriptFile.Id]))
        let Details = ScriptFile.Details;

        if (DataSet.RecordCount > 0)
        {
            while (! DataSet.Eof)
            {
                let Desc = new TScriptFileDesc();
                Desc.Assign(DataSet.Curr)
                Details.push(Desc)
                DataSet.Next();
            }
        }
        else
        {
            let f = new Loki.TFile();
            f.LoadFrom(ScriptFile.Content)

            let Idx = 1;
            for (let Snap of f.Snap())
            {
                let Desc = new TScriptFileDesc();

                Desc.ScriptFile_Id = ScriptFile.Id;
                Desc.Idx = Idx ++;
                Desc.Name = Desc.Idx.toString();
                Desc.Desc = Snap.Print();

                await this.Save(Details)
                Details.push(Desc);
            }
        }
    }

    private static _Categories: Array<TCategory> = [];

    private Storage: TSqliteStorage;
    private _FileBodyList = new Map<string, Array<IBodyPart>>();
}

/* TAsset */

export interface IAsset extends IPersistable
{
    Id: string;

    Name: string;
    Desc: string;

    ExtraProp: string;
}

export class TAsset extends TPersistable implements IAsset
{
    constructor (public ObjectName: string)
    {
        super();
    }

    /* IPersistable */

    GenerateKeyProps(...args: any[]): Promise<void>
    {
        if (! TypeInfo.Assigned(this.Id))
            this.Id = TGuid.Generate();

        return Promise.resolve();
    }

    DefineKeyProps(KeyProps: Array<string>): void
    {
        KeyProps.push('Id');
    }

    DefinePropRules(PropRules: Array<TPersistPropRule>): void
    {
        super.DefinePropRules(PropRules);
        PropRules.push(new TPersistPropRule('Asset', ['ObjectName', 'Name', 'Desc', 'ExtraProp']))
    }

    Id: string = null;

    get Name_LangId(): string
    {
        return (this.ObjectName + '.' + this.Name).toLowerCase();
    }

    get Desc_LangId(): string
    {
        return (this.ObjectName + '.' + this.Desc).toLowerCase();
    }

    Name: string = null;
    Desc: string = null;
    ExtraProp: string = null;
}

/*　TBody */

export class TBodyPart extends TAsset implements IBodyPart
{
    constructor()
    {
        super('Body');
    }

    Icon: number = null;
}

/* TCategory */

export class TCategory extends TAsset implements ICategory
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

export class TScriptFile extends TAsset implements IScriptFile
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

export class TScriptFileDesc extends TAsset
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
