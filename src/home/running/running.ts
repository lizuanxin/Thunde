import {isDevMode, Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef} from '@angular/core';
import {NavParams, Content} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/toPromise';
import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';

import * as Svc from '../../providers';

@Component({selector: 'page-running', templateUrl: 'running.html'})
export class RunningPage implements OnInit, OnDestroy, AfterViewInit
{
    constructor(private ChangeDetector: ChangeDetectorRef, navParams: NavParams)
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
            App.HideLoading();

            this.Ticking = this.Shell.Ticking;
            this.Intensity = this.Shell.Intensity;
        }
        else
            this.Start();

        this.ShowDownloadBtn = this.Shell.DefaultFileList.indexOf(this.ScriptFile.Name) === -1;

        this.ShellNotifySubscription = this.Shell.OnNotify.subscribe(
            Notify =>
            {
                switch (Notify)
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
                    this.ChangeDetector.detectChanges();
                    break;

                case Svc.Loki.TShellNotify.Battery:
                    // this.UpdateBatteryLevel();
                    break;

                case Svc.Loki.TShellNotify.Ticking:
                    this.Ticking = this.Shell.Ticking;

                    if (this.Ticking >= this.ScriptFile.Duration)
                    {
                        this.Shell.StopOutput()
                            .catch(err => App.ShowError(err).then(() => this.ClosePage()));
                        this.Completed = true;
                    }

                    this.ChangeDetector.detectChanges();
                    break;
                }
            },
            err => console.log(err.message));
    }

    ngOnDestroy(): void
    {
        this.UnsubscribeShellNotify();
        App.HideLoading();
    }

    ngAfterViewInit()
    {
        /*
        CloseViews(this.app).catch(err => {});

        async function CloseViews(App: Svc.TApplication): Promise<void>
        {
            let views = App.Nav.getViews();
            for (let i = 1; i < views.length - 1; i ++)
                await views[i].dismiss().catch(err => {});
        }
        */
    }

    get CanvasClientHeight(): Object
    {
        return {height: this.content.contentHeight * 0.7 + 'px'};
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
                    this.ClosingTimerId = setTimeout(() => App.Nav.pop(), 300);
            })
            .then(() => this.Shell.Detach())
            .catch(err => console.error(err));
    }

    HideDownload()
    {
        this.ShowDownload = false;
        this.ShowDownloadBtn = this.Shell.DefaultFileList.indexOf(this.ScriptFile.Name) === -1;
    }

    private Start()
    {
        App.ShowLoading()
            .then(() => Svc.TAssetService.LoadScriptFile(this.ScriptFile))
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
            .then(() => App.HideLoading())
            .catch(err => App.ShowError(err).then(() => isDevMode() ? null : this.ClosePage()))
            .then(() => App.HideLoading())
            .then(() => App.EnableHardwareBackButton());
    }

    private Close(MessageId: string): void
    {
        this.UnsubscribeShellNotify();
        this.Shell.Detach();

        // ignore multi notify messages
        if (! TypeInfo.Assigned(this.ClosingTimerId) && MessageId !== '')
            App.ShowError(MessageId);

        this.ClosePage();
    }

    private ClosePage(): void
    {
        if (this.Completed || TypeInfo.Assigned(this.ClosingTimerId))
            return;
        this.ClosingTimerId = setTimeout(() => App.Nav.pop(), 300);
    }

    private UnsubscribeShellNotify(): void
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = undefined;
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
    private ShellNotifySubscription: Subscription | undefined;

    private Downloading = false;
    private ClosingTimerId: any = undefined;
}
