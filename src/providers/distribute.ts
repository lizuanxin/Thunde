import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Rx'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../UltraCreation/Core'
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
        return this.HttpRequest('./assets/Firmware.json', 'GET', 'json')
            .then((value: string) =>
            {
                console.log('xxxxxxxxxxxxxxxxx:' + JSON.stringify(value));
                return value;
            });
    }

    HttpRequest(Url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        ResponseType: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text'): Promise<any>
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
