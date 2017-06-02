import {isDevMode, Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {NavParams, ViewController, Content} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';
import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';

import * as View from '..'
import * as Svc from '../../../providers';
// import {PowerManagement} from '../../UltraCreation/Native/PowerManagement'


@Component({selector: 'page-running', templateUrl: 'running.html'})
export class RunningPage implements OnInit, OnDestroy, AfterViewInit
{
    constructor(private app: Svc.TApplication, private navParams: NavParams, private view: ViewController,
        private Asset: Svc.TAssetService, private Distibute: Svc.TDistributeService)
    {
        this.ScriptFile = navParams.get('ScriptFile');
        let DeviceId = navParams.get('DeviceId');

        this.Shell = Svc.Loki.TShell.Get(DeviceId);
    }

    ngOnInit()
    {
        // PowerManagement.Acquire();

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
                        this.Shell.StopOutput();
                    break;
                }
            },
            err=> console.log(err.message));
    }

    ngAfterViewInit()
    {
        this.app.Nav.remove(1, this.view.index - 1, {animate: false})
            .then(() => this.Start());
    }

    ngOnDestroy(): void
    {
        this.UnsubscribeShellNotify();
        this.Shell.Detach();

        // PowerManagement.Release();
    }

    goDownLoad()
    {
        this.app.Nav.push(View.DownloadPage)
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
            Time += Sec + '0';
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

        this.Shell.StopOutput().catch(err => console.log(err))
            .then(() => this.ClosePage());
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
        this.ClosePage();

        // ignore multi notify messages
        if (! TypeInfo.Assigned(this.ClosingTimerId) && MessageId !== '')
            this.app.ShowError(MessageId);
    }

    private ClosePage(): void
    {
        if (TypeInfo.Assigned(this.ClosingTimerId))
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

    private Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription;
    private Adjusting: Promise<any> = null;
    private Downloading = false;
    private ClosingTimerId: any;
}
