import {Injectable}  from '@angular/core';

import {TypeInfo, IPersistable, TPersistable, TPersistPropRule, TGuid} from '../UltraCreation/Core'
import {HexToBin} from '../UltraCreation/StrUtils'
import {TBase64Encoding} from '../UltraCreation/Encoding'
import {TSqlQuery, TSqliteStorage} from '../UltraCreation/Storage';
import {const_data} from './thunderbolt.const'
import * as Loki from './loki/file';

module Queries
{
    export const GetCategories = 'SELECT Category.*, ObjectName, Name, Desc FROM Asset INNER JOIN Category ON Category.Id = Asset.Id'
    export const GetFileList = `SELECT ScriptFile.*, ObjectName, Asset.Name, Asset.Desc FROM ScriptFile INNER JOIN Asset ON Asset.Id = ScriptFile.Id
        WHERE Category_Id = "?" ORDER BY Asset.Id`;
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
                        F.Duration = Math.trunc(((LokiFile.TimeEst() / 1000) + 30) / 60 * 60);
                        this.Save(F);
                    }

                    DataSet.Next();
                }

                return RetVal;
            });
    }

    FileDesc(ScriptFile: TScriptFile): Promise<Array<TScriptFileDesc>>
    {
        return this.Storage.ExecQuery(new TSqlQuery(Queries.GetFileDesc, [ScriptFile.Id]))
            .then(DataSet =>
            {
                let RetVal = new Array<TScriptFileDesc>();
                if (DataSet.RecordCount > 0)
                {
                    while (! DataSet.Eof)
                    {
                        let Desc = new TScriptFileDesc();
                        Desc.Assign(DataSet.Curr)
                        RetVal.push(Desc)

                        DataSet.Next();
                    }

                    return RetVal;
                }
                else
                {
                    let f = new Loki.TFile();
                    f.LoadFrom(ScriptFile.Content)
                    for (let i = 0; i < f.Sections.length; i ++)
                    {
                        let snap = f.Sections[i].Snap();
                        let Desc = new TScriptFileDesc();

                        Desc.ScriptFile_Id = ScriptFile.Id;
                        Desc.Idx = i + 1;
                        Desc.Name = 'SEQ ' + Desc.Idx;
                        Desc.Desc = snap.Print();

                        RetVal.push(Desc);
                    }

                    return this.Save(RetVal).then(() => RetVal);
                }
            })
    }

    private IdGenerator(KeyProps: Array<string>, Obj: IPersistable): Promise<void>
    {
        if ( ! (Obj instanceof TAsset))
            return Promise.reject(new Error('Object is not a Asset'));

        let ClassName = TypeInfo.NameOf(Obj);
        switch (ClassName)
        {
        case 'TScriptFile':
           (Obj as any)['ObjectName'] = 'ScriptFile';
            break;
        case 'TScriptFileDesc':
           (Obj as any)['ObjectName'] = 'ScriptFileDesc';
            break;

        default:
            return Promise.reject(new Error('Object ' + ClassName + ' is not Supported by this Service.'));
        }

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

    get Name_LangId(): string { return (this.ObjectName + '.' + this.Name).toLowerCase(); }
    get Desc_LangId(): string { return (this.ObjectName + '.' + this.Desc).toLowerCase(); }

    ObjectName: string = null;
    Name: string = null;
    Desc: string = null;
    ExtraProp: string = null;
}

/* TCategory */

export class TCategory extends TAsset
{
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

    Description: Array<TScriptFileDesc> = [];

    get Md5Name(): string
    {
        let x = TBase64Encoding.Instance.EncodeToString(HexToBin(this.Md5));
        console.log(TBase64Encoding.Instance.Decode(x));

        return x;
    }
}

/* TScriptFileDesc */

export class TScriptFileDesc extends TAsset
{
    /* IPersistable */
    DefinePropRules(PropRules: Array<TPersistPropRule>): void
    {
        super.DefinePropRules(PropRules);
        PropRules.push(new TPersistPropRule('ScriptFileDesc', ['ScriptFile_Id', 'Idx', 'Professional']))
    }

    ScriptFile_Id: string = null;
    Idx: number = null;
    Professional: boolean = null;
}
