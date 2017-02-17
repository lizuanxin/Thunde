import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Rx'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import {TypeInfo, EAbort} from '../UltraCreation/Core'
import {TUtf8Encoding} from '../UltraCreation/Encoding'
import {THashMd5} from '../UltraCreation/Hash'
import {TAssetService, TScriptFile} from './asset'
import * as Loki from './loki/file';

export const WebRoot = GetWebRoot();

function GetWebRoot(): string
{
    let path = window.location.href;
    path = path.substring(0, path.lastIndexOf('/'));
    return path;
}

export function HttpRequest(Url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    ResponseType: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' = 'json'): Promise<any>
{
    return Observable.create(observer =>
    {
        let req = new XMLHttpRequest();

        req.onprogress = function(this: XMLHttpRequestEventTarget, ev: ProgressEvent)
        {
            console.log('XMLHttpRequest loading', ev.loaded, 'of', ev.total);
        };

        req.onload = function(this: XMLHttpRequestEventTarget, ev: Event)
        {
            console.log('XMLHttpRequest done');

            // http server error
            if (req.status >= 500 && req.status < 600)
                observer.error(new Error('HTTP Server Error ' + req.status))
            // http client error
            else if (req.status >= 400)
                observer.error(new Error('HTTP Client Error ' + req.status))
            // http redirection
            else if (req.status >= 300)
                observer.error(new Error('HTTP Redirection ' + req.status))
            // http successful
            else if (req.status >= 200)
            {
                if (req.status === 200)
                {
                    //console.log(req);
                    observer.next(req.response);
                    observer.complete();
                }
                else
                    observer.error(new Error('HTTP Successful ' + req.status));
            }
            // http informational
            else if (req.status >= 100)
                console.log('HTTP Informational ' + req.status);
            else if (req.status === 0)
            {
                // for IOS always returns 0
                observer.next(req.response);
                observer.complete();
            }
            else
                observer.error(new Error('HTTP Unknown Status ' + req.status));

            observer.next(req.response);
            observer.complete();
        };

        req.onerror = function(this: XMLHttpRequestEventTarget, ev: ErrorEvent)
        {
            observer.error(new Error('XMLHttpRequest error'));
        };
        req.ontimeout = function(this: XMLHttpRequestEventTarget, ev: ProgressEvent)
        {
            observer.error(new Error('XMLHttpRequest timeout'));
        }

        req.open(method, Url);
        console.log('XMLHttpRequest opened, readyState:', req.readyState);
        req.responseType = ResponseType;
        req.send(null);
    })
    .toPromise();
}

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
        // TODO: ios XMLHttpRequest NOT WORK
        // return Promise.reject(new EAbort());

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

        return HttpRequest(WebRoot + '/assets/Firmware.json', 'GET', 'json')
            .then(Info =>
            {
                let NewVersion = Info[FileName].split('.');
                if (NewVersion.length !== 3)
                    return Promise.reject(new EAbort());

                let NewRev = parseInt(NewVersion[1]) * 10000 + parseInt(NewVersion[2]);
                if (NewRev <= Rev)
                    return Promise.reject(new EAbort());

                return HttpRequest(WebRoot + '/assets/' + FileName + '.bin', 'GET', 'arraybuffer') as Promise<ArrayBuffer>;
            })
    }
}


