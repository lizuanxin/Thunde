import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Rx'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import {TypeInfo, EAbort} from '../UltraCreation/Core'
import {TUtf8Encoding} from '../UltraCreation/Encoding'
import {THashMd5} from '../UltraCreation/Hash'
import {TAssetService, TScriptFile} from './asset'
import * as Loki from './loki/file';

@Injectable()
export class TDistributeService
{
    constructor (private Asset: TAssetService)
    {
        console.log('TDistributeService construct');
    }

    ReadScriptFile(ScriptFile: TScriptFile): Promise<Uint8Array>
    {
        let RetVal = TUtf8Encoding.Instance.Encode(ScriptFile.Content);

        if (! TypeInfo.Assigned(ScriptFile.Md5))
        {
            ScriptFile.Edit();
            ScriptFile.Md5 = THashMd5.Get(RetVal).Print();
        }

        if (! TypeInfo.Assigned(ScriptFile.Duration) || ScriptFile.Duration === 0)
        {
            let LokiFile = new Loki.TFile();
            LokiFile.LoadFrom(RetVal);

            ScriptFile.Edit();
            ScriptFile.Duration = Math.trunc(((LokiFile.TimeEst() / 1000) + 30) / 60 * 60);
        }

        if (ScriptFile.IsEditing)
            return this.Asset.Save(ScriptFile).then(() => RetVal);
        else
            return Promise.resolve(RetVal);
    }

    ReadFirmware(Version: number): Promise<ArrayBuffer>
    {
        // 1XXXBBBB
        let Major = Math.trunc(Version / 10000000);
        let Rev = Version % 10000000;
        let FileName: string;

        switch (Major)
        {
        case 1:
            FileName = 'MiniQ';
            break;
        case 2:
            FileName = 'ThunderboltQ';
            break;
        case 3:
            FileName = 'Thunderbolt'
            break;

        default:
            return Promise.reject(new EAbort())
        }

        return this.HttpRequest('./assets/Firmware.json', 'GET', 'json')
            .then(Info =>
            {
                let NewVersion = Info[FileName].split('.');
                if (NewVersion.length !== 3)
                    return Promise.reject(new EAbort());

                let NewRev = parseInt(NewVersion[1]) * 10000 + parseInt(NewVersion[2]);
                if (NewRev <= Rev)
                    return Promise.reject(new EAbort());

                return this.HttpRequest('./assets/' + FileName + '.bin', 'GET', 'arraybuffer') as Promise<ArrayBuffer>;
            })
    }

    private HttpRequest(Url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        ResponseType: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' = 'json'): Promise<any>
    {
        return Observable.create(observer =>
        {
            let req = new XMLHttpRequest();

            req.open(method, Url);
            req.responseType = ResponseType;

            req.onreadystatechange =
                () =>
                {
                    if (req.readyState === 4 && req.status === 200)
                    {
                        //console.log(req);
                        observer.next(req.response);
                        observer.complete();
                    }
 
                };
            req.onerror =
                (ev) => observer.error('XMLHttpRequest Failure.');

            req.send();
        })
        .toPromise();
    }
}
