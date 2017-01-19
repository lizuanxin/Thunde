import {Component, OnInit, OnDestroy} from '@angular/core';
import {NavController, ViewController, NavParams} from 'ionic-angular';
import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {Timer} from '../../UltraCreation/Core/Timer';

// import {TAppController} from '../../UltraCreation/ng2-ion/ion-appcontroller';

import {TApplication, Loki} from '../services';

import {PowerManagement} from 'ionic-native';
import {File} from 'ionic-native';
declare var cordova: any;

@Component({
    selector: 'ota-update',
    templateUrl: 'ota_update.html',
    styles: [
        `   
        .progress-outer 
        {
            width: 96%;
            margin: 10px 2%;
            padding: 3px;
            text-align: center;
            background-color: #f4f4f4;
            border: 1px solid #dcdcdc;
            color: #fff;
            border-radius: 20px;
        }
        .progress-inner 
        {
            min-width: 10%;
            white-space: nowrap;
            overflow: hidden;
            padding: 5px;
            border-radius: 20px;
            background-color: #0080ff;
        }
        `
    ]
})
export class OtaUpdatePage implements OnInit, OnDestroy
{
    constructor(private app: TApplication, private nav: NavController, private navParams: NavParams)
    {
        let DeviceId = navParams.get('DeviceId');
        this.Shell = Loki.TShell.Get(DeviceId);
    }

    ngOnInit()
    {
        PowerManagement.acquire().then(() => console.log('acquired power lock'));
        
        this.loopCheckTimer = Timer.startNew(1000, Infinity, 600);
        this.loopCheckTimer.subscribe((count) => 
        {
            if (count === 0)
                this.otaUpdate();
            else
                console.log('percent: ' + this.otaUpdatePercent);
        });
    }

    ngOnDestroy()
    {
        this.Shell.Detach();
        this.loopCheckTimer.unsubscribe();
        this.loopCheckTimer.stop();
        PowerManagement.release().then(() => console.log('released power lock'));
    }

    navBackClicked()
    {
        if (this.isAllowNavBack)
            this.nav.pop();
    }

    otaUpdate()
    {
        console.log('path: ' + cordova.file.applicationDirectory);
        this.otaUpdatePercent = 0;
        this.otaJumpFlag = false;
        File.readAsArrayBuffer(cordova.file.applicationDirectory + 'www/assets', 'Mini.bin')
            .then((arrayBuffer) => 
            {
                console.log('read success...');

                if (arrayBuffer instanceof ArrayBuffer)
                    this.startSendData(arrayBuffer);
                else
                    console.log('firmware read err...');
            })
            .catch((err) => 
            {
                console.log('firmware read error....');
            });
    }

    private startSendData(buffer: ArrayBuffer)
    {
        this.isAllowNavBack = false;
        console.log('size: ' + buffer.byteLength);
        this.app.ShowLoading('OTA update, please wait less 3 minute')
            .then((loading) => 
            {
                this.startUpdateOta(buffer)
                    .then(() => loading.dismiss())
                    .catch(() => loading.dismiss());

                loading.onDidDismiss(() => 
                {
                    this.isAllowNavBack = true;
                    if (this.otaUpdatePercent === 100)
                        this.otaUpdateSuccess();
                    else
                        this.otaUpdateFail();
                });
            });
    }

    private startUpdateOta(buffer)
    {
        return new Promise((resolve, reject) => 
        {
            let retrytimes = 1;

            function loopRequest(Self: any)
            {
                Self.Shell.OTARequest(buffer).then((request) => 
                {
                    request.subscribe(
                        (value) => 
                        {
                            Self.otaUpdatePercent = value;
                            if (Self.otaUpdatePercent === 100)
                            {
                                request.unsubscribe();
                                resolve();
                            }
                        },
                        (error) =>
                        {
                            console.log('ota err: ' + error);
                            if (error.includes('jump'))
                                Self.otaJumpFlag = true;
                            reject(error);
                        },
                        () => 
                        {
                            console.log('ota write complete...');
                            resolve();
                        }
                    );
                })
                .catch(() => 
                {
                    console.log('request error, retry ota request');
                    if (retrytimes > 0)
                        setTimeout(() => loopRequest(Self), 1000);
                    else
                        reject('request err');
                    
                    retrytimes --;
                });
            }

            setTimeout(() => loopRequest(this), 10);
        });
    }

    private otaUpdateSuccess()
    {
        setTimeout(() => 
        {
            this.app.ShowLoading('update ota success, restart device...').then((load) => 
            {
                //setTimeout(() => this.Shell.Detach(), 5 * 1000);
                setTimeout(() => 
                {
                    Loki.TShell.StartOTG();
                }, 3 * 1000);
                setTimeout(() => load.dismiss(), 5 * 1000)
                load.onDidDismiss(() => 
                {
                    if (Loki.TShell.IsUsbPlugin)
                        this.Shell = Loki.TShell.Get('USB');
                    this.Shell.VersionRequest().then((value) => 
                    {
                        this.app.ShowAlert({title: 'New ver: ' + this.getVersion(value),
                            buttons: 
                            [
                                {text: 'OK', handler: () => this.nav.pop()},
                            ]});
                    }).catch(() => this.nav.pop());
                });
            });
        }, 500);
    }

    private otaUpdateFail()
    {
        setTimeout(() => 
        {
            if (this.otaJumpFlag)
            {
                this.app.ShowAlert({title: 'Device Reset, Need to update again',
                    buttons: 
                    [
                        {text: 'OK', handler: () =>  this.retryOtaUpdate()},
                    ]});
            }
            else
            {
                this.app.ShowAlert({title: 'OTA update failed',
                    buttons: 
                    [
                        {text: 'Retry', handler: () =>  this.retryOtaUpdate()},
                        {text: 'Cancel', role: 'cancel'}
                    ]});
            }
            
        }, 500);
    }

    private retryOtaUpdate()
    {
        if (this.otaUpdatePercent === 0) 
        {
            Loki.TShell.StartOTG();
            setTimeout(() => 
            {
                console.log('start new connect');
                if (Loki.TShell.IsUsbPlugin)
                    this.Shell = Loki.TShell.Get('USB');
                    
                this.otaUpdate();
            }, 500);
        }
    }


    private getVersion(value: number)
    {
        let retStr: string = '';
        let minor = value % 10000;
        let middle = (value - minor) % (10000 * 1000);
        let major = Math.floor(value / 1000 / 10000);
        retStr = major.toString() + '.' + middle.toString() + '.' + minor.toString();
        return retStr;
    }

    private Shell: Loki.TShell;

    protected otaUpdatePercent: number = 0;
    protected isAllowNavBack: boolean = false;
    protected loopCheckTimer: Timer;

    protected otaJumpFlag: boolean = false;
}