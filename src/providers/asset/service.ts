import {Injectable}  from '@angular/core';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {TSqlQuery, TSqliteStorage} from '../../UltraCreation/Storage';

import {TDistributeService} from '../distribute';
import {const_data, IBodyPart, Loki} from '..'
import {TCategory, TScriptFile, TScriptFileDesc} from './asset.scriptfile'

module Queries
{
    export const GetCategories = `SELECT Category.*, ObjectName, Name, Desc
        FROM Asset INNER JOIN Category ON Category.Id = Asset.Id`
    export const GetFileList = `SELECT ScriptFile.*, ObjectName, Asset.Name, Asset.Desc
        FROM ScriptFile INNER JOIN Asset ON Asset.Id = ScriptFile.Id
        WHERE Category_Id = "?" ORDER BY Asset.Id`;
    export const GetFileBodyList = `SELECT ScriptFile_Id, Body.*
        FROM Body INNER JOIN ScriptFile_Body ON ScriptFile_Body.Body_Id = Body.Id
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
