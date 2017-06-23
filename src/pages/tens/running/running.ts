import {isDevMode, Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {NavParams, ViewController, Content} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';
import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';

import * as Svc from '../../../providers';

@Component({selector: 'page-running', templateUrl: 'running.html'})
export class RunningPage implements OnInit, OnDestroy, AfterViewInit
{
    constructor(public app: Svc.TApplication, private Distibute: Svc.TDistributeService,
        private view: ViewController, navParams: NavParams)
    {
        if (navParams.get('Resume') === true)
        {
            this.Shell = Svc.Loki.TShell.RunningInstance;
            this.ScriptFile = this.Shell.RefFile as Svc.TScriptFile;
        }
        else
        {
            this.ScriptFile = navParams.get('ScriptFile');
            this.Shell = Svc.Loki.TShell.Get(navParams.get('DeviceId'));
            this.Shell.RefFile = this.ScriptFile;
        }
    }

    ngOnInit()
    {
        if (this.Shell === Svc.Loki.TShell.RunningInstance)
        {
            this.app.HideLoading();

            this.Ticking = this.Shell.Ticking;
            this.Intensity = this.Shell.Intensity;
        }
        else
            this.Start();

        this.ShowDownloadBtn = this.Shell.DefaultFileList.indexOf(this.ScriptFile.Name) === -1;

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
                    // this.UpdateBatteryLevel();
                    break;

                case Svc.Loki.TShellNotify.Ticking:
                    this.Ticking = this.Shell.Ticking;

                    if (this.Ticking >= this.ScriptFile.Duration)
                    {
                        this.Shell.StopOutput();
                        this.Completed = true;
                    }
                    break;
                }
            },
            err=> console.log(err.message));
    }

    ngAfterViewInit()
    {
        this.app.Nav.remove(1, this.view.index - 1, {animate: false});
    }

    ngOnDestroy(): void
    {
        this.UnsubscribeShellNotify();
    }

    get CanvasClientHeight(): Object
    {
        return {height: this.content.contentHeight * 0.7 + 'px'}
    }

    AdjustIntensity(Value: number)
    {
        this.Shell.SetIntensity(this.Intensity + Value);
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
            })
            .then(() => this.Shell.Detach())
            .catch(err => console.error(err))
    }

    private Start()
    {
        this.app.ShowLoading()
            .then(() => this.Distibute.ReadScriptFile(this.ScriptFile))
            .then(() => this.Shell.CatFile(this.ScriptFile))
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
            .then(() => this.Shell.StartScriptFile(this.ScriptFile))
            .then(() => this.app.HideLoading())
            .catch(err=> this.app.ShowError(err).then(() => isDevMode() ? null : this.ClosePage()))
            .then(() => this.app.HideLoading())
            .then(() => this.app.EnableHardwareBackButton());
    }

    private Close(MessageId: string): void
    {
        this.UnsubscribeShellNotify();
        this.Shell.Detach();

        // ignore multi notify messages
        if (! TypeInfo.Assigned(this.ClosingTimerId) && MessageId !== '')
            this.app.ShowError(MessageId);

        this.ClosePage();
    }

    private ClosePage(): void
    {
        if (this.Completed || TypeInfo.Assigned(this.ClosingTimerId))
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

    ShowDownloadBtn: boolean = true;
    ShowDownload: boolean = false;
    Completed: boolean = false;

    Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription;

    private Downloading = false;
    private ClosingTimerId: any;
}
