import {Injectable} from '@angular/core';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {EAbort} from '../../UltraCreation/Core/Exception';
import {THttpClient} from '../../UltraCreation/Core/Http';
import {TAssignable} from '../../UltraCreation/Core/Persistable';
import {TUtf8Encoding} from '../../UltraCreation/Encoding';
import {THashMd5} from '../../UltraCreation/Hash/Md5';

import {const_data, IBodyPart, Loki} from '..';
import {TCategory, TScriptFile, TScriptFileDesc} from './asset.scriptfile';

import {Config} from '../config';

module Queries
{
    export const GetCategories = `SELECT Category.*, ObjectName, Name, Desc
        FROM Asset INNER JOIN Category ON Category.Id = Asset.Id`;
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
        WHERE ScriptFile_Id= "?" ORDER BY Idx`;
}

@Injectable()
export class TAssetService
{
    constructor()
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

    static async LoadTranslate(Name: string, ResponseType: XMLHttpRequestResponseType, Lang?: string, BaseUrl?: string): Promise<any>
    {
        if (! TypeInfo.Assigned(BaseUrl))
            BaseUrl = Config.PATH_TRANSLATE;
        let Http = new THttpClient(ResponseType, BaseUrl);

        if (! TypeInfo.Assigned(Lang))
            Lang = App.Language;

        let LangPath = App.Language.replace('_', '/');
        return Http.Get(LangPath + '/' + Name).toPromise().then(res => res.Content)
            .catch(err => Http.Get('zh/cn/' + Name).toPromise().then(res => res.Content));
    }

    static LoadScriptFile(ScriptFile: TScriptFile): Promise<TScriptFile>
    {
        let Http = new THttpClient('text', 'assets/loki/');

        return Http.Get(ScriptFile.Name + '.lok').toPromise().then(res => res.Content as string)
            .then(Content =>
            {
                let ContentBuffer = TUtf8Encoding.Encode(Content);
                ScriptFile.ContentBuffer = ContentBuffer;

                if (! TypeInfo.Assigned(ScriptFile.Md5))
                {
                    ScriptFile.Edit();
                    ScriptFile.Md5 = THashMd5.Get(ContentBuffer).Print();
                }

                if (! TypeInfo.Assigned(ScriptFile.Duration) || ScriptFile.Duration === 0)
                {
                    let LokiFile = new Loki.TFile();
                    LokiFile.LoadFrom(ContentBuffer);

                    ScriptFile.Edit();
                    ScriptFile.Duration = Math.trunc((LokiFile.TimeEst() + 500) / 1000);
                }
            })
            .then(() => ScriptFile);
    }

    static LoadFirmware(Version: number): Promise<ArrayBuffer>
    {
        let Http = new THttpClient('json', 'assets/upgrade');

        // 1XXXBBBB
        let Major = Math.trunc(Version / 10000000);
        let Rev = Version % 10000000;
        let FileName: string;

        switch (Major)
        {
        case 1:
            if (Rev === 1)
                FileName = 'UCtenQT2';      // USB version
            else
                FileName = 'UCtenQT1';      // BLE Version
            break;
        case 2:
            if (Rev <= 4)                   // hardware 4.3k res
                return Promise.reject(new EAbort());
            if (Version === 20000006)       // do not upgrade 2.0.6 for now
                return Promise.reject(new EAbort());

            FileName = 'UCtenQT3';          // BLE Version
            break;
        case 3:
            FileName = 'UCtenQT2';
            break;

        default:
            return Promise.reject(new EAbort());
        }

        return Http.Get('Firmware.json').toPromise().then(res => res.Content)
            .then(Info =>
            {
                let NewVersionStr = Info[FileName];
                if (! TypeInfo.Assigned(NewVersionStr))
                    return Promise.reject(new EAbort());

                let NewVersion = NewVersionStr.split('.');
                if (NewVersion.length !== 3)
                    return Promise.reject(new EAbort());

                let NewRev = parseInt(NewVersion[1], 10) * 10000 + parseInt(NewVersion[2], 10);
                if (NewRev <= Rev)
                    return Promise.reject(new EAbort());

                Http.ResponseType = 'arraybuffer';
                return Http.Get(FileName + '.bin').toPromise().then(res => res.Content);
            });
    }

    static LoadFaq(): Promise<Array<{title: string, content: string}>>
    {
        return this.LoadTranslate('faq.json', 'json');
    }

/* instance */

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
        }
        return null;
    }

    async FileList(Category_Id: string): Promise<Array<TScriptFile>>
    {
        let DataSet = await StorageEngine.ExecQuery(Queries.GetFileList, [Category_Id]);
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

            await (this.constructor as typeof TAssetService).LoadScriptFile(F);
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
            });
        }

        return RetVal;
    }

    private async FileBodyList(): Promise<Map<string, Array<IBodyPart>>>
    {
        if (this._FileBodyList.size === 0)
        {
            let DataSet = await StorageEngine.ExecQuery(Queries.GetFileBodyList);

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
        let DataSet = await StorageEngine.ExecQuery(Queries.GetFileDesc, [ScriptFile.Id]);
        let Details = ScriptFile.Details;

        if (DataSet.RecordCount > 0)
        {
            while (! DataSet.Eof)
            {
                let Desc = new TScriptFileDesc();
                Desc.Assign(DataSet.Curr);
                Details.push(Desc);
                DataSet.Next();
            }
        }
        else if (TypeInfo.Assigned(ScriptFile.Content))
        {
            let f = new Loki.TFile();
            f.LoadFrom(ScriptFile.Content);

            let Idx = 1;
            for (let Snap of f.Snap())
            {
                let Desc = new TScriptFileDesc();

                Desc.ScriptFile_Id = ScriptFile.Id;
                Desc.Idx = Idx ++;
                Desc.Name = Desc.Idx.toString();
                Desc.Desc = Snap.Print();

                for (let d of Details)
                    await StorageEngine.SaveObject(d);
                Details.push(Desc);
            }
        }
    }

    private static _Categories: Array<TCategory> = [];
    private _FileBodyList = new Map<string, Array<IBodyPart>>();
}
