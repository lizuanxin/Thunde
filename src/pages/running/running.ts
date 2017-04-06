import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';
import {Subscription} from 'rxjs/Rx'

import {TApplication, TDistributeService, TScriptFile, TAssetService, Loki} from '../services';

@Component({selector: 'page-running', templateUrl: 'running.html'})
export class RunningPage implements OnInit, OnDestroy, AfterViewInit
{
    constructor(public nav: NavController, private navParams: NavParams, private view: ViewController,
        private app: TApplication, private Asset: TAssetService, private Distibute: TDistributeService)
    {
        this.ScriptFile = navParams.get('ScriptFile');
        let DeviceId = navParams.get('DeviceId');

        this.Shell = Loki.TShell.Get(DeviceId);
    }

    ngOnInit()
    {
        this.ShellNotifySubscription = this.Shell.OnNotify.subscribe(
            Notify =>
            {
                switch(Notify)
                {
                case Loki.TShellNotify.Shutdown:
                    this.Close('shutdown');
                    break;
                case Loki.TShellNotify.Disconnected:
                    this.Close('disconnected');
                    break;
                case Loki.TShellNotify.LowBattery:
                    this.Close('low_battery');
                    break;
                case Loki.TShellNotify.HardwareError:
                    this.Close('hardware_error');
                    break;

                case Loki.TShellNotify.NoLoad:
                    this.Close('no_load');
                    break;

                case Loki.TShellNotify.Stopped:
                    this.Close('');
                    break;

                case Loki.TShellNotify.Intensity:
                    this.Intensity = this.Shell.Intensity;
                    console.log("ngOnInit.ngOnInit.Intensity" + this.Intensity);
                    break;

                case Loki.TShellNotify.Battery:
                    this.UpdateBatteryLevel();
                    break;

                case Loki.TShellNotify.Ticking:
                    this.Ticking = this.Shell.Ticking;
                    if (this.Ticking >= this.ScriptFile.Duration)
                        this.Shutdown();
                    break;
                }
            },
            err=> console.log(err.message));
    }

    ngAfterViewInit()
    {
        this.nav.remove(1, this.view.index - 1, {animate: false})
            .then(() => this.Start());
    }

    ngOnDestroy(): void
    {
        this.ShellNotifySubscription.unsubscribe();
        this.Shell.Detach();
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
        this.Shell.Shutdown().catch();//.then(() => this.ClosePage());
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
            .then(() =>
            {
                return this.app.HideLoading().then(() => this.Shell.StartScriptFile(this.ScriptFile.Name));
            })
            .catch(err=>
            {
                this.app.HideLoading()
                    .then(() => this.app.ShowHintId(err.message))
                    .then(() => this.ClosePage());
            });
    }

    private UpdateBatteryLevel()
    {
        this.BatteryLevel = this.Shell.BatteryLevel;
    }

    private Close(MessageId: string)
    {
        if (MessageId !== '')
            this.app.ShowHintId(MessageId).then(() => this.ClosePage());
        else
            this.ClosePage();
    }

    private ClosePage()
    {
        setTimeout(() =>
        {
            if (this.view === this.nav.getActive() && this.view.index !== 0)
                this.nav.pop();
        }, 300);
    }

    ScriptFile: TScriptFile;

    Ticking: number = 0;
    Intensity: number = 0;
    BatteryLevel: number = 0;

    private Shell: Loki.TShell;
    private ShellNotifySubscription: Subscription;
    private Adjusting: Promise<any> = null;
    private Downloading: boolean = false;
}
