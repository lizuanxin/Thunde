import {Injectable}  from '@angular/core';

import {TypeInfo, IPersistable, TPersistable, TPersistPropRule, TGuid, HexConv} from '../UltraCreation/Core'
import {TBase64Encoding} from '../UltraCreation/Encoding'
import {TSqlQuery, TSqliteStorage} from '../UltraCreation/Storage';
import {const_data} from './const_data'
import * as Loki from './loki/file';

module Queries
{
    export const GetCategories = 'SELECT Category.*, ObjectName, Name, Desc FROM Asset INNER JOIN Category ON Category.Id = Asset.Id'
    export const GetFileList = `SELECT ScriptFile.*, ObjectName, Asset.Name, Asset.Desc FROM ScriptFile INNER JOIN Asset ON Asset.Id = ScriptFile.Id
        WHERE Category_Id = "?" ORDER BY Asset.Id`;
    export const GetBodyUsage = `SELECT ObjectName, Name, Desc FROM ScriptFile_Body
        INNER JOIN Body ON Body.Id = ScriptFile_Body.Body_Id INNER JOIN Asset BodyAsset ON BodyAsset.Id = Body.Id
        WHERE ScriptFile_Id = "?" ORDER BY Body.Id`;
    export const GetFileDesc = `SELECT ScriptFileDesc.*, ObjectName, Asset.Name, Asset.Desc FROM ScriptFileDesc INNER JOIN Asset ON Asset.Id = ScriptFileDesc.Id
        WHERE ScriptFile_Id= "?" ORDER BY Idx`
}

@Injectable()
export class TAssetService
{
    constructor ()
    {
        this.Storage = new TSqliteStorage(const_data.DatabaseName, this.IdGenerator);
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

    get BodyParts(): Array<const_data.IBodyPart>    // for the debug
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

    FileList(Category_Id: string): Promise<Array<TScriptFile>>
    {
        return this.Storage.ExecQuery(new TSqlQuery(Queries.GetFileList, [Category_Id]))
            .then(DataSet =>
            {
                let RetVal = new Array<TScriptFile>();

                while (! DataSet.Eof)
                {
                    let F = new TScriptFile();
                    F.Assign(DataSet.Curr);
                    RetVal.push(F);

                    if ((! TypeInfo.Assigned(F.Duration) || F.Duration === 0) && TypeInfo.Assigned(F.Content))
                    {
                        let LokiFile = new Loki.TFile();
                        LokiFile.LoadFrom(F.Content);

                        F.Edit();
                        F.Duration = Math.trunc(((LokiFile.TimeEst() / 1000) + 30) / 60) * 60;
                        this.Save(F);
                    }

                    DataSet.Next();
                }

                return RetVal;
            });
    }

    FileDesc(ScriptFile: TScriptFile): Promise<void>
    {
        return this.Storage.ExecQuery(new TSqlQuery(Queries.GetFileDesc, [ScriptFile.Id]))
            .then(DataSet =>
            {
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

                        Details.push(Desc);
                    }

                    return this.Save(Details)
                        .catch(err => console.log(err.message));
                }
            })
            .then(() =>
            {
                if (ScriptFile.BodyParts.length === 0)
                {
                    return this.Storage.ExecQuery(new TSqlQuery(Queries.GetBodyUsage, [ScriptFile.Id]))
                        .then(DataSet =>
                        {
                            let BodyParts = new Array<TBody>();
                            while (! DataSet.Eof)
                            {
                                let body = new TBody();
                                body.Assign(DataSet.Curr);
                                BodyParts.push(body);

                                DataSet.Next();
                            }

                            ScriptFile.BodyParts = BodyParts;
                        })
                }
            })
    }

    private IdGenerator(KeyProps: Array<string>, Obj: IPersistable): Promise<void>
    {
        if ( ! (Obj instanceof TAsset))
            return Promise.reject(new Error('Object is not a Asset'));

       (Obj as any)['Id'] = TGuid.Generate();
        return Promise.resolve();
    }

    private static _Categories: Array<TCategory> = [];
    private Storage: TSqliteStorage;
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

export class TBody extends TAsset
{
    constructor()
    {
        super('Body');
    }

    get IconChar(): string
    {
        if (TypeInfo.Assigned(this.Icon))
            return String.fromCharCode(this.Icon);
        else
            return '';
    }

    get DescIconString(): string
    {
        let Icons = JSON.parse(this.Desc) as Array<number>;
        let RetVal: string = '';

        for (let i = 0; i < Icons.length; i ++)
            RetVal += '&#x' + Icons[i].toString(16) + '; ';

        return RetVal;
    }

    get DescIconChars(): Array<string>
    {
        let RetVal = new Array<string>();
        let Icons = JSON.parse(this.Desc) as Array<number>;

        for (let i = 0; i < Icons.length; i ++)
            RetVal.push(String.fromCharCode(Icons[i]));
        return RetVal;
    }

    Icon: number = null;
}

/* TCategory */

export class TCategory extends TAsset
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

    get IconChar(): string
    {
        if (TypeInfo.Assigned(this.Icon))
            return String.fromCharCode(this.Icon);
        else
            return '';
    }

    Icon: number = null;
    Files: Array<TScriptFile> = [];
}

/* TScriptFile */

export class TScriptFile extends TAsset
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

    Category_Id: string = null;
    Mode_Id: string = null;
    // @do not use this: dummy for bluetens
    Body_Id: string = null;

    Content: string = null;
    Md5: string = null;
    Duration: number = null;
    Author: string = null;
    Professional: boolean = null;

    Details: Array<TScriptFileDesc> = [];
    BodyParts: Array<TBody> = [];

    get Md5Name(): string
    {
        let x = TBase64Encoding.Instance.EncodeToString(HexConv.HexToBin(this.Md5));
        console.log(TBase64Encoding.Instance.Decode(x));

        return x;
    }
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

    BodyParts: Array<const_data.IBodyPart> = [];
}
