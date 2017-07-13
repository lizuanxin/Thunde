import {Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {PowerManagement} from '../../../UltraCreation/Native/PowerManagement'

import * as Svc from '../../../providers';

const DEMO_FILES = ["demo_friction", "demo_kneading", "demo_pressure"];

@Component({selector: "page-demo.running", templateUrl: "demo.running.html"})
export class DemoRunningPage implements OnInit, AfterViewInit, OnDestroy
{
    constructor(public app: Svc.TApplication, private Distribute: Svc.TDistributeService,
        private view: ViewController, navParams: NavParams)
    {
        let DeviceId = navParams.get('DeviceId');
        this.Shell = Svc.Loki.TShell.Get(DeviceId);

        for (let FileName of DEMO_FILES)
        {
            let f = new Svc.TScriptFile();
            f.Name = FileName;
            this.DemoFiles.push(f);

            Distribute.ReadScriptFile(f);
        }
        this.Shell.RefFile = this.DemoFiles[0];
    }

    ngOnInit()
    {
        PowerManagement.Acquire();

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
                    break;

                case Svc.Loki.TShellNotify.Ticking:
                    this.Ticking = this.Shell.Ticking;
                    console.log("duration:" + this.Shell.RefFile.Duration);

                    if (TypeInfo.Assigned(this.Shell.RefFile.Duration) && this.Ticking >= this.Shell.RefFile.Duration - 1)
                        this.Next();
                    break;
                }
            },
            err=> console.log(err.message));

        this.Start();
    }

    ngAfterViewInit(): void
    {
        // this.app.Nav.remove(1, this.app.Nav.getViews().length - 2);
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

    ngOnDestroy(): void
    {
        PowerManagement.Release();

        this.UnsubscribeShellNotify();
        this.Shell.Detach();
    }

    private UnsubscribeShellNotify(): void
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = undefined;
        }
    }

    private Start()
    {
        this.app.ShowLoading();

        let ScriptFile = this.DemoFiles[0];
        let FileName = ScriptFile.Name.toLowerCase();

        this.ModeGif = 'assets/img/' + FileName + '.gif';
        this.ModeInfo = FileName + '_info';

        this.Shell.ClearFileSystem(DEMO_FILES)
            .then(() => this.StartIndex(0))
            .catch(err => this.app.ShowError(err).then(() => Svc.TGatt.BrowserFakeDevice ? null : this.ClosePage()))
            .then(() => this.app.HideLoading());
    }

    private StartIndex(Idx: number): Promise<void>
    {
        this.app.DisableHardwareBackButton();

        let ScriptFile = this.DemoFiles[Idx];
        let FileName = ScriptFile.Name.toLowerCase();

        this.ModeGif = 'assets/img/' + FileName + '.gif';
        this.ModeInfo = FileName + '_info';

        return this.Distribute.ReadScriptFile(ScriptFile)
            .then(() => this.Shell.CatFile(ScriptFile))
            .then(progress => progress.toPromise())
            .then(() => this.Shell.StartScriptFile(ScriptFile))
            .catch(err => this.app.ShowError(err).then(() => Svc.TGatt.BrowserFakeDevice ? null : this.ClosePage()))
            .then(() => this.app.HideLoading())
            .then(() => this.app.EnableHardwareBackButton());
    }

    Next()
    {
        if (TypeInfo.Assigned(this.Switching))
            return;

        if (this.CurrentIdx < 2)
        {
            this.CurrentIdx ++;
            this.Ticking = 0;

            this.Switching = this.app.ShowLoading()
                .then(() => this.Shell.StopOutput())
                .then(() => this.StartIndex(this.CurrentIdx))
                .catch(err => this.app.ShowError(err).then(() => this.ClosePage()))
                .then(() => this.app.HideLoading())
                .then(() => this.Switching = undefined)
        }
        else
        {
            this.Completed = true;
            this.UnsubscribeShellNotify();

            this.Switching = this.app.ShowLoading()
                .then(() => this.Shell.StopOutput())
                .catch(err => this.app.ShowError(err).then(() => this.ClosePage()))
                .then(() => this.app.HideLoading())
                .then(() => this.Switching = undefined)
        }
    }

    Previous()
    {
        if (TypeInfo.Assigned(this.Switching))
            return;

        if (this.CurrentIdx > 0 && this.CurrentIdx <= 2)
        {
            this.CurrentIdx --;
            this.Ticking = 0;

            this.Switching = this.app.ShowLoading()
                .then(() =>this.Shell.StopOutput())
                .then(() => this.StartIndex(this.CurrentIdx))
                .catch(err => this.app.ShowError(err).then(() => this.ClosePage()))
                .then(() => this.app.HideLoading())
                .then(() => this.Switching = undefined)
        }
    }

    AdjustIntensity(Value: number)
    {
        if (! TypeInfo.Assigned(this.Intensity))
            this.Intensity = 1;

        this.Shell.SetIntensity(this.Intensity + Value);
    }

    Shutdown()
    {
        this.UnsubscribeShellNotify();

        this.Shell.StopOutput().catch(err => console.error(err))
            .then(() =>
            {
                if (! TypeInfo.Assigned(this.ClosingTimerId))
                {
                    this.ClosingTimerId = setTimeout(() =>
                    {
                        if (this.view === this.app.Nav.getActive())
                            this.app.Nav.pop();
                    }, 300);
                }
            })
            .then(() => this.Shell.Detach())
            .catch(err => console.error(err))
    }

    get Progress(): number
    {
        let f = this.DemoFiles[this.CurrentIdx];

        if (TypeInfo.Assigned(f))
            return this.Ticking / f.DurationSecond * 100
        else
            return 0;
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
            this.app.Nav.popToRoot();
        }, 300);
    }

    get TextStyle(): Object
    {
        let screenHeight = window.innerHeight;
        return { height: screenHeight * 0.15 + "px", overflowY: "scroll", padding: "0" }
    }

    Completed: boolean = false;
    CurrentIdx: number = 0;

    ModeGif: string;
    ModeInfo: string;

    Ticking: number = 0;
    Intensity: number = 0;

    private DemoFiles: Array<Svc.TScriptFile> = [];
    private Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription | undefined;

    private ClosingTimerId: any = undefined;
    private Switching: Promise<void> | undefined;
}
