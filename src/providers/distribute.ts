import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Rx'
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import {TypeInfo, Exception, EAbort} from '../UltraCreation/Core'
import {TUtf8Encoding} from '../UltraCreation/Encoding'
import {THashMd5} from '../UltraCreation/Hash'
import {TAssetService, TScriptFile} from './asset'
import * as Loki from './loki/file';

export const WebRoot = GetWebRoot();

export class EHttp extends Exception
{
    constructor(public Status: number)
    {
        super();

        // http server error
        if (Status >= 500 && Status < 600)
            this.message = 'HTTP Server Error: ' + Status;
        // http client error
        else if (Status >= 400)
            this.message = 'HTTP Client Error: ' + Status;
        // http redirection
        else if (Status >= 300)
            this.message = 'HTTP Redirection: ' + Status;
        // http successful
        else if (Status >= 200)
            this.message = 'HTTP Successful: ' + Status;
        // http informational
        else if (Status >= 100)
            this.message = 'HTTP Informational: ' + Status;
        else if (Status === -1)
            this.message = 'HTTP Request Error';
        else if (Status === -2)
            this.message = 'HTTP Request Timeout';
        else
            this.message = 'HTTP Unknown Status: ' + Status;
    }
}

function GetWebRoot(): string
{
    let path = window.location.href;
    return path.substring(0, path.lastIndexOf('/'));
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
            console.log('XMLHttpRequest loading ' + ev.loaded + ' of ' + ev.total);
        };
        req.onload = function(this: XMLHttpRequestEventTarget, ev: Event)
        {
            // console.log('XMLHttpRequest done');

            if (req.status === 200 || req.status === 0)
            {
                //console.log(req);
                observer.next(req.response);
                observer.complete();
            }
            else
                observer.error(new EHttp(req.status))
        };
        req.onerror = function(this: XMLHttpRequestEventTarget, ev: ErrorEvent)
        {
            observer.error(new EHttp(-1));
        };
        req.ontimeout = function(this: XMLHttpRequestEventTarget, ev: ProgressEvent)
        {
            observer.error(new EHttp(-2));
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
            FileName = 'UCtenQT2'
            break;

        default:
            return Promise.reject(new EAbort())
        }

        return HttpRequest(WebRoot + '/assets/Firmware.json', 'GET', 'json')
            .then(Info =>
            {
                let NewVersionStr = Info[FileName];
                if (! TypeInfo.Assigned(NewVersionStr))
                    return;

                let NewVersion = NewVersionStr.split('.')
                if (NewVersion.length !== 3)
                    return Promise.reject(new EAbort());

                let NewRev = parseInt(NewVersion[1]) * 10000 + parseInt(NewVersion[2]);
                if (NewRev <= Rev)
                    return Promise.reject(new EAbort());

                return HttpRequest(WebRoot + '/assets/' + FileName + '.bin', 'GET', 'arraybuffer') as Promise<ArrayBuffer>;
            })
    }
}
