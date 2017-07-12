import {Injectable}  from '@angular/core';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {TSqlQuery} from '../../UltraCreation/Storage';

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
        console.log('TAssetService construct');

        /* ListPeripheral was unknown here */
        let ListPeripheral = (this as any).ListPeripheral;
        if (TypeInfo.Assigned(ListPeripheral) && TypeInfo.IsFunction(ListPeripheral))
            setTimeout(() => ListPeripheral.bind(this)().catch((err: any) => console.log(err)));
    }

    static Initialize(): Promise<void>
    {
        return StorageEngine.ExecQuery(Queries.GetCategories)
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

    get Categories(): Array<TCategory>
    {
        return (this.constructor as typeof TAssetService)._Categories;
    }

    get BodyParts(): Array<IBodyPart>    // for the debug
    {
        return const_data.BodyParts;
    }

    Category_ById(Id: string): TCategory | null
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
        return StorageEngine.Get(Key)
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
            return StorageEngine.Set(Key, JSON.stringify(Value))
        else
            return StorageEngine.Set(Key, Value);
    }

    async FileList(Category_Id: string): Promise<Array<TScriptFile>>
    {
        let DataSet = await StorageEngine.ExecQuery(new TSqlQuery(Queries.GetFileList, [Category_Id]));
        let FileBodyList = await this.FileBodyList();

        let RetVal = new Array<TScriptFile>();
        let Saving = new Array<TScriptFile>();

        while (! DataSet.Eof)
        {
            let F = new TScriptFile();
            RetVal.push(F);

            F.Assign(DataSet.Curr);

            let BodyParts = FileBodyList.get(F.Id as string);
            if (TypeInfo.Assigned(BodyParts))
                F.BodyParts = BodyParts;

            await this.Distribute.ReadScriptFile(F);
            if (F.IsEditing)
                Saving.push(F);

            DataSet.Next();
        }

        if (Saving.length > 0)
        {
            StorageEngine.GetConnection().then(conn =>
            {
                let Promises = new Array<Promise<void>>();
                for (let F of Saving)
                {
                    console.log('saving: ' + F.Name);
                    Promises.push(conn.SaveObject(F).catch(err => console.log(err.message)));
                }
                Promise.all(Promises).catch(err => {}).then(() => conn.Release());
            })
        }

        return RetVal;
    }

    private async FileBodyList(): Promise<Map<string, Array<IBodyPart>>>
    {
        if (this._FileBodyList.size === 0)
        {
            let DataSet = await StorageEngine.ExecQuery(new TSqlQuery(Queries.GetFileBodyList));

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
        let DataSet = await StorageEngine.ExecQuery(new TSqlQuery(Queries.GetFileDesc, [ScriptFile.Id]))
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
        else if (TypeInfo.Assigned(ScriptFile.Content))
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

                for (let d of Details)
                    await StorageEngine.SaveObject(d)
                Details.push(Desc);
            }
        }
    }

    private static _Categories: Array<TCategory> = [];
    private _FileBodyList = new Map<string, Array<IBodyPart>>();
}
