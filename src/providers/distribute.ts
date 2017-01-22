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
        setTimeout(() => this.CheckFirmware(), 1000);
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
        let firmwareInfo = this.GetFirmwareInfo(Version);
        if (TypeInfo.Assigned(firmwareInfo))
            return this.readFirmwareByXHR(firmwareInfo.Name);
        else
            return Promise.reject('');
    }

    IsNeedToUpdateFirmware(Version: number): boolean
    {
        if (! TypeInfo.Assigned(this.firmwareInfoList))
            return false;

        let firmwareInfo = this.GetFirmwareInfo(Version);
        if (TypeInfo.Assigned(firmwareInfo) && firmwareInfo.Ver > Version)
            return true;

        return false;
    }

    GetNewFirmwareVer(Version: number): number
    {
        if (! TypeInfo.Assigned(this.firmwareInfoList))
            return 0;

        return this.GetFirmwareInfo(Version).Ver;
    }

    private CheckFirmware()
    {
        console.log('start check new firmware ver...');
        this.HttpRequest('./assets/Firmware.json', 'GET', 'json').then((infoList) => 
        {
            // console.log('read ver success: ' + JSON.stringify(infoList));
            this.firmwareInfoList = [];
            for (let key in infoList)
            {
                console.log('key: ' + key + 'name: ' + infoList[key]);
                this.firmwareInfoList.push({Name: key, Ver: this.ParseVersion(infoList[key])})
            }
        });
    }

    private GetFirmwareInfo(Version: number)
    {
        for (let firmwareInfo of this.firmwareInfoList)
        {
            if (this.IsDeviceVerSame(firmwareInfo.Ver, Version))
            {
                return firmwareInfo;
            }
        }
        return null;
    }

    private IsDeviceVerSame(newVer: number, oldVer: number): boolean
    {
        if (Math.floor(newVer / 1000 / 10000) === Math.floor(oldVer / 1000 / 10000))
            return true;
        else
            return false;
    }

    private readFirmwareByXHR(fileName: string)
    {
        if (! fileName.includes('.bin'))
            fileName += '.bin';
        return this.HttpRequest('./assets/' + fileName, 'GET', 'arraybuffer');
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

    private ParseVersion(Version: string): number
    {
        let keyvalue = Version.split('.');
        
        // 1XXXBBBB
        return (parseInt(keyvalue[0]) * 1000 + parseInt(keyvalue[1])) * 10000 + parseInt(keyvalue[2]);
    }

    private  firmwareInfoList: Array<{Name: string, Ver: number}>;
}
