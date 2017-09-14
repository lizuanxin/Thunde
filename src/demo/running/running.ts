import {Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, isDevMode} from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/toPromise';

import {NavParams} from 'ionic-angular';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {PowerManagement} from '../../UltraCreation/Native/PowerManagement';

import * as Svc from '../../providers';

const DEMO_FILES = ['demo_friction', 'demo_kneading', 'demo_pressure'];

@Component({selector: 'page-running', templateUrl: 'running.html'})
export class DemoRunningPage implements OnInit, AfterViewInit, OnDestroy
{
    constructor(private ChangeDetector: ChangeDetectorRef, navParams: NavParams)
    {
        this.Shell = navParams.get('Shell');

        for (let FileName of DEMO_FILES)
        {
            let f = new Svc.TScriptFile();
            f.Name = FileName;
            this.DemoFiles.push(f);
            Svc.TAssetService.LoadScriptFile(f);
        }
        this.Shell.RefFile = this.DemoFiles[0];
    }

    ngOnInit()
    {
        PowerManagement.Acquire();

        this.ShellNotifySub = this.Shell.OnNotify.subscribe(
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

                case Svc.Loki.TShellNotify.Ticking:
                    this.Ticking = this.Shell.Ticking;
                    if (TypeInfo.Assigned(this.Shell.RefFile.Duration) && this.Ticking >= this.Shell.RefFile.Duration - 1)
                        this.Next();

                    this.ChangeDetector.detectChanges();
                    break;
                }
            },
            err => console.log(err.message));

        this.Start();
    }

    ngAfterViewInit(): void
    {
        App.Nav.remove(1, App.ActiveView.index - 1)
            .catch(err => console.error(err));
    }

    ngOnDestroy(): void
    {
        this.Shell.Shutdown()
            .catch(() => {})
            .then(() => this.Shell.Detach());

        PowerManagement.Release();
        this.UnsubscribeShellNotify();
    }

    private UnsubscribeShellNotify(): void
    {
        if (TypeInfo.Assigned(this.ShellNotifySub))
        {
            this.ShellNotifySub.unsubscribe();
            this.ShellNotifySub = undefined;
        }
    }

    private Start()
    {
        let ScriptFile = this.DemoFiles[0];
        let FileName = ScriptFile.Name.toLowerCase();

        this.ModeGif = 'assets/img/' + FileName + '.gif';
        this.ModeInfo = FileName + '_info';
        App.ShowLoading()
            .then(() => this.Shell.ClearFileSystem(DEMO_FILES))
            .then(() => this.StartIndex(0))
            .catch(err => App.ShowError(err).then(() => isDevMode() ? null : this.ClosePage()))
            .then(() => App.HideLoading())
            .then(() => App.EnableHardwareBackButton());
    }

    private StartIndex(Idx: number): Promise<void>
    {
        App.DisableHardwareBackButton();

        let ScriptFile = this.DemoFiles[Idx];
        let FileName = ScriptFile.Name.toLowerCase();

        this.ModeGif = 'assets/img/' + FileName + '.gif';
        this.ModeInfo = FileName + '_info';

        return Svc.TAssetService.LoadScriptFile(ScriptFile)
            .then(() => this.Shell.CatFile(ScriptFile))
            .then(progress => progress.toPromise())
            .then(() => this.Shell.StartScriptFile(ScriptFile))
            .catch(err => App.ShowError(err).then(() => isDevMode() ? null : this.ClosePage()))
            .then(() => App.HideLoading())
            .then(() => App.EnableHardwareBackButton());
    }

    Next()
    {
        if (TypeInfo.Assigned(this.Switching))
            return;

        if (this.CurrentIdx < 2)
        {
            this.CurrentIdx ++;
            this.Ticking = 0;

            this.Switching = App.ShowLoading()
                .then(() => this.Shell.StopOutput())
                .then(() => this.StartIndex(this.CurrentIdx))
                .catch(err => App.ShowError(err).then(() => this.ClosePage()))
                .then(() => App.HideLoading())
                .then(() => this.Switching = undefined);
        }
        else
        {
            this.Completed = true;
            this.UnsubscribeShellNotify();

            this.Switching = App.ShowLoading()
                .then(() => this.Shell.StopOutput())
                .catch(err => App.ShowError(err).then(() => this.ClosePage()))
                .then(() => App.HideLoading())
                .then(() => this.Switching = undefined);
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

            this.Switching = App.ShowLoading()
                .then(() => this.Shell.StopOutput())
                .then(() => this.StartIndex(this.CurrentIdx))
                .catch(err => App.ShowError(err).then(() => this.ClosePage()))
                .then(() => App.HideLoading())
                .then(() => this.Switching = undefined);
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
                    this.ClosingTimerId = setTimeout(() => App.Nav.pop(), 300);
            })
            .then(() => this.Shell.Detach())
            .catch(err => console.error(err));
    }

    get Progress(): number
    {
        let f = this.DemoFiles[this.CurrentIdx];

        if (TypeInfo.Assigned(f))
            return this.Ticking / f.DurationSecond * 100;
        else
            return 0;
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

        this.ClosingTimerId = setTimeout(() =>
        {
            App.Nav.popToRoot();
        }, 300);
    }

    get TextStyle(): Object
    {
        let screenHeight = window.innerHeight;
        return { height: screenHeight * 0.15 + 'px', overflowY: 'scroll', padding: '0' };
    }

    get LeftButtonStyle(): Object
    {
        if (this.CurrentIdx === 1)
            return {display: 'inline-flex', marginRight: '3vw'};
        else
            return {display: 'inline-flex', margin: 'auto'};
    }

    get RightButtonStyle(): Object
    {
        if (this.CurrentIdx === 1)
            return {display: 'inline-flex', marginLeft: '3vw'};
        else
            return {display: 'inline-flex', margin: 'auto'};
    }

    App = window.App;

    Completed: boolean = false;
    CurrentIdx: number = 0;

    ModeGif: string;
    ModeInfo: string;

    Ticking: number = 0;
    Intensity: number = 0;

    private DemoFiles: Array<Svc.TScriptFile> = [];
    private Shell: Svc.Loki.TShell;
    private ShellNotifySub: Subscription | undefined;

    private ClosingTimerId: any = undefined;
    private Switching: Promise<void> | undefined;
}
