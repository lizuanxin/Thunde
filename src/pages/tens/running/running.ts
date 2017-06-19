import {isDevMode, Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {NavParams, ViewController, Content} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';
import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';

import * as Svc from '../../../providers';

@Component({selector: 'page-running', templateUrl: 'running.html'})
export class RunningPage implements OnInit, OnDestroy, AfterViewInit
{
    constructor(private app: Svc.TApplication, private navParams: NavParams, private view: ViewController,
        private Asset: Svc.TAssetService, private Distibute: Svc.TDistributeService)
    {
        this.FromResume = navParams.get('Resume');
        this.ScriptFile = navParams.get('ScriptFile');

        let DeviceId = navParams.get('DeviceId');
        this.Shell = app.GetShell(DeviceId);
    }

    ngOnInit()
    {
        console.log("files:" + JSON.stringify(this.Shell.DefaultFileList));
        this.Asset.SetKey(Svc.const_data.DEFAULT_FILES, this.Shell.DefaultFileList)
            .catch(err => console.error(err.message));
        //当前文件不存在默认模式中时才可以设置
        if (TypeInfo.Assigned(this.Shell.DefaultFileList) &&
            this.Shell.DefaultFileList.indexOf(this.ScriptFile.Name) !== -1)
            this.ShowButton = false;

        this.ShellNotifySubscription = this.Shell.OnNotify.subscribe(
            Notify =>
            {
                switch(Notify)
                {
                case Svc.Loki.TShellNotify.Shutdown:
                    this.Close('shutdown');
                    break;
                case Svc.Loki.TShellNotify.Disconnected:
                    this.Close('disconnected');
                    break;
                case Svc.Loki.TShellNotify.LowBattery:
                    this.Close('low_battery');
                    break;
                case Svc.Loki.TShellNotify.HardwareError:
                    this.Close('hardware_error');
                    break;

                case Svc.Loki.TShellNotify.NoLoad:
                    this.Close('no_load');
                    break;

                case Svc.Loki.TShellNotify.Stopped:
                    this.Close('');
                    break;

                case Svc.Loki.TShellNotify.Intensity:
                    this.Intensity = this.Shell.Intensity;
                    console.log('Intensity: ' + this.Intensity);
                    break;

                case Svc.Loki.TShellNotify.Battery:
                    this.UpdateBatteryLevel();
                    break;

                case Svc.Loki.TShellNotify.Ticking:
                    this.Ticking = this.Shell.Ticking;

                    if (this.Ticking >= this.ScriptFile.Duration)
                    {
                        this.Shell.StopOutput();
                        this.Finish = true;
                    }

                    break;
                }
            },
            err=> console.log(err.message));
    }

    ngAfterViewInit()
    {
        this.app.Nav.remove(1, this.view.index - 1, {animate: false})
            .then(() =>
            {
                if (this.FromResume)
                    this.ResumeRunning();
                else
                    this.Start();
            });
    }

    ngOnDestroy(): void
    {
        this.UnsubscribeShellNotify();
        if (! this.NeedResume)
            this.app.Destory(this.navParams.get('DeviceId'));
    }

    Home()
    {
        this.NeedResume = true;
        this.app.SetRunningBackground(this.Shell.DeviceId, this.ScriptFile);
        this.ClosePage();
    }

    SetDefaultFiles()
    {
        this.app.DisableHardwareBackButton();
        this.DefaultFilesDatas = {FileNames: this.Shell.DefaultFileList, CurrentFile: this.ScriptFile, DeviceId: this.navParams.get('DeviceId')};
        this.SetDefaultFile = true;
    }

    SetDefaultDone(Value: number)
    {
        this.SetDefaultFile = false;
        this.app.EnableHardwareBackButton();

        if (Value === 1)
        {
            this.ShowButton = false;

            this.Shell.ListDefaultFile()
            .then(Files => this.Asset.SetKey(Svc.const_data.DEFAULT_FILES, Files))
            .catch(err => console.error(err.message));
        }
    }

    get CanvasClientHeight(): Object
    {
        return {height: this.content.contentHeight*0.7 + 'px'}
    }

    get TotalMinute(): string
    {
        let Time = '00:00';
        let Min = Math.trunc(this.ScriptFile.Duration / 60);
        if (Min === 0)
            Time = '00:';
        else if (Min < 10)
            Time = '0' + Min + ':';
        else
            Time = Min + ':';

        let Sec = this.ScriptFile.Duration % 60;
        if (Sec === 0)
            Time += '00';
        else if (Sec < 10)
            Time += '0' + Sec;
        else
            Time += Sec + '';

        return Time;
    }

    get TickingDownHint(): string
    {
        let TickingDown = this.Downloading ? this.ScriptFile.Duration : this.ScriptFile.Duration - this.Ticking;

        if (TickingDown > 0)
        {
            let Min = Math.trunc((TickingDown) / 60);
            let Sec = TickingDown % 60;

            if (Sec < 0)
            {
                if (Min > 0)
                    Sec += 60;
                else
                    Sec = 0;
            }

            if (Min > 0)
                return (Min < 10 ? '0' : '') + Min.toString() + ':' + (Sec < 10 ? '0' : '') + Sec.toString();
            else
                return '00:' + (Sec < 10 ? '0' : '') + Sec.toString();
        }
        else
            return '00:00';
    }

    AdjustIntensity(Value: number)
    {
        if (! this.Shell.IsAttached || this.Adjusting)
            return;

        this.Adjusting = this.Shell.SetIntensity(this.Intensity + Value)
            .then(() => this.Intensity = this.Shell.Intensity)
            .catch(err => console.log('Adjuest Intensity: + ' + err.message))
            .then(() => this.Adjusting = null);
    }

    Shutdown(): void
    {
        this.UnsubscribeShellNotify();

        this.Shell.StopOutput().catch(err => console.error(err))
            .then(() =>
            {
                if (! TypeInfo.Assigned(this.ClosingTimerId))
                {
                    setTimeout(() =>
                    {
                        if (this.view === this.app.Nav.getActive())
                            this.app.Nav.pop();
                    }, 300);
                }
            });
    }

    private ResumeRunning()
    {
        return this.Shell.StatusRequest()
            .then(() =>
            {
                this.Intensity = this.Shell.Intensity;
                return this.app.HideLoading();
            })
            .catch(err => console.log(err.message));
    }

    private Start()
    {
        return this.Shell.ClearFileSystem([this.ScriptFile.Name])
            .then(() => this.Distibute.ReadScriptFile(this.ScriptFile))
            .then(buf => this.Shell.CatFile(this.ScriptFile.Name, buf, this.ScriptFile.Md5))
            .then(progress =>
            {
                this.Downloading = true;
                progress.subscribe(next => this.Ticking = this.ScriptFile.Duration * next, err => {}, () => {});

                return progress.toPromise()
                    .then(() =>
                    {
                        this.Ticking = 0;
                        this.Downloading = false;
                    });
            })
            .then(() => this.Shell.StartScriptFile(this.ScriptFile.Name))
            .then(() => this.app.HideLoading())
            .catch(err=>
            {
                this.app.HideLoading()
                    .then(() => this.app.ShowError(err))
                    .then(() => isDevMode() ? null : this.ClosePage());
            })
            .then(() => this.app.EnableHardwareBackButton());
    }

    private UpdateBatteryLevel(): void
    {
        this.BatteryLevel = this.Shell.BatteryLevel;
    }

    private Close(MessageId: string): void
    {
        this.UnsubscribeShellNotify();

        // ignore multi notify messages
        if (! TypeInfo.Assigned(this.ClosingTimerId) && MessageId !== '')
            this.app.ShowError(MessageId);

        this.ClosePage();
    }

    private ClosePage(): void
    {
        this.SetDefaultFile = false;
        if (this.Finish || TypeInfo.Assigned(this.ClosingTimerId))
            return;

        this.ClosingTimerId = setTimeout(() =>
        {
            if (this.view === this.app.Nav.getActive())
                this.app.Nav.pop();
        }, 300);
    }

    private UnsubscribeShellNotify(): void
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = null;
        }
    }

    @ViewChild(Content) content: Content;

    ScriptFile: Svc.TScriptFile;

    Ticking: number = 0;
    Intensity: number = 0;
    BatteryLevel: number = 0;

    ShowButton: boolean = true;
    Finish: boolean = false;

    DefaultFilesDatas: {FileNames: Array<string>, CurrentFile: Svc.TScriptFile, DeviceId: string};
    private SetDefaultFile: boolean = false;
    private NeedResume: boolean = false;
    private FromResume: boolean = false;
    private Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription;
    private Adjusting: Promise<any> = null;
    private Downloading = false;
    private ClosingTimerId: any;
}
