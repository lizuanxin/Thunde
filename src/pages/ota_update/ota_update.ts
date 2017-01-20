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
        this.deviceId = navParams.get('DeviceId');
        this.Shell = Loki.TShell.Get(this.deviceId);
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
        console.log('path: ' + cordova.file.applicationDirectory + this.navParams.get('FirmwareName'));
        this.otaUpdatePercent = 0;
        this.otaJumpFlag = false;
        File.readAsArrayBuffer(cordova.file.applicationDirectory + 'www/assets', this.navParams.get('FirmwareName'))
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
            this.Shell.OTARequest(buffer).then((request) => 
            {
                request.subscribe(
                    (value) => 
                    {
                        this.otaUpdatePercent = value;
                        if (this.otaUpdatePercent === 100)
                        {
                            request.unsubscribe();
                            resolve();
                        }
                    },
                    (error) =>
                    {
                        console.log('ota err: ' + error);
                        if (error.message.includes('jump'))
                            this.otaJumpFlag = true;
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
                console.log('OTARequest error');
                reject('OTARequest err');
            });
        });
    }

    private otaUpdateSuccess()
    {
        setTimeout(() => 
        {
            this.app.ShowLoading('update ota success, restart device...').then((load) => 
            {
                let loadingDelayTime = 6 * 1000;
                if (this.isUSBDevice())
                    loadingDelayTime = 3 * 1000;

                setTimeout(() => this.restartDevice().then(() => load.dismiss()), loadingDelayTime);

                load.onDidDismiss(() => 
                {
                    if (! this.isUSBDevice() || Loki.TShell.IsUsbPlugin)
                    {
                        this.Shell.VersionRequest().then((value) => 
                        {
                            this.app.ShowAlert({title: 'New ver: ' + this.getVersion(value),
                                buttons: 
                                [
                                    {text: 'OK', handler: () => this.nav.pop()},
                                ]});
                        }).catch(() => this.nav.pop());
                    }
                    else
                    {
                        this.app.ShowAlert({title: 'OTA update success !',
                            buttons: 
                            [
                                {text: 'OK', handler: () => this.nav.pop()},
                            ]});
                    }
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
        return this.restartDevice().then(() => this.otaUpdate());
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

    private restartDevice(): Promise<void>
    {
        return new Promise((resolve, reject) => 
        {
            if (this.isUSBDevice())
            {
                Loki.TShell.StartOTG();
            }
            else
            {
                Loki.TShell.StartScan();
            }

            setTimeout(() => 
            {
                this.Shell = Loki.TShell.Get(this.deviceId);
                resolve();
            }, 1000);
        });
    }

    private isUSBDevice(): boolean
    {
        return this.deviceId === 'USB';
    }


    private Shell: Loki.TShell;

    protected otaUpdatePercent: number = 0;
    protected isAllowNavBack: boolean = false;
    protected loopCheckTimer: Timer;

    protected otaJumpFlag: boolean = false;
    private deviceId: string;
}