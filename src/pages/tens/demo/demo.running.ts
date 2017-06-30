import {Component, OnInit, AfterViewInit, OnDestroy, isDevMode} from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {PowerManagement} from '../../../UltraCreation/Native/PowerManagement'

import * as Svc from '../../../providers';

const DEMO_MODES: string[] = ["demo_friction", "demo_kneading", "demo_pressure"];

@Component({selector: "page-demo.running", templateUrl: "demo.running.html"})
export class DemoRunningPage implements OnInit, AfterViewInit, OnDestroy
{
    constructor(public app: Svc.TApplication, private Distibute: Svc.TDistributeService,
        private view: ViewController, navParams: NavParams)
    {
        this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);

        let DeviceId = navParams.get('DeviceId');
        this.Shell = Svc.Loki.TShell.Get(DeviceId);
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

                    if (this.Ticking >= this.Shell.RefFile.Duration -1)
                        this.NextMode();
                    break;
                }
            },
            err=> console.log(err.message));

        this.Start();
    }

    ngAfterViewInit(): void
    {
        CloseViews(this.app).catch(err => {});

        async function CloseViews(App: Svc.TApplication): Promise<void>
        {
            let views = App.Nav.getViews();
            for (let i = 1; i < views.length - 1; i ++)
                await views[i].dismiss().catch(err => {});
        }
    }

    ngOnDestroy(): void
    {
        PowerManagement.Release();

        this.UnsubscribeShellNotify();
        this.Shell.Detach();

        this.app.HideLoading();
    }

    SetModeInfo(runningIndex: string)
    {
        let ModeName = runningIndex.toLowerCase();

        this.ModeGif = 'assets/img/' + ModeName + '.gif';
        this.ModeInfo = ModeName + '_info';
    }

    private Start()
    {
        this.app.ShowLoading();

        this.Shell.ClearFileSystem(DEMO_MODES)
            .then(() => this.StartMode(0))
    }

    private UnsubscribeShellNotify(): void
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = undefined;
        }
    }

    private StartMode(Index: number)
    {
        this.app.DisableHardwareBackButton();
        let ScriptFile = new Svc.TScriptFile();
        ScriptFile.Name = DEMO_MODES[Index];

        this.Distibute.ReadScriptFile(ScriptFile)
            .then(() => this.CurrentFileDuration = ScriptFile.DurationSecond)
            .then(() => this.Shell.CatFile(ScriptFile))
            .then(progress =>
            {
                this.Downloading = true;
                progress.subscribe(
                    (next: number) => this.Ticking =  ScriptFile.DurationSecond * next);

                return progress.toPromise()
                    .then(() =>
                    {
                        this.Ticking = 0;
                        this.Downloading = false;
                    });
            })
            .then(() => this.Shell.StartScriptFile(ScriptFile))
            .then(() => this.app.HideLoading())
            .catch(err=> this.app.ShowError(err).then(() => isDevMode() ? null : this.ClosePage()))
            .then(() => this.app.HideLoading())
            .then(() => this.app.EnableHardwareBackButton());
    }

    NextMode()
    {
        if (! this.Completed)
        {
            if (this.CurrentRunningIndex < 2)
            {
                this.CurrentRunningIndex ++;

                this.Shell.StopOutput();
                this.Ticking = 0;

                this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);
                this.StartMode(this.CurrentRunningIndex);
            }
            else
            {
                this.Completed = true;

                this.UnsubscribeShellNotify();
                this.Shell.StopOutput();
            }
        }
    }

    LastMode()
    {
        if (this.CurrentRunningIndex > 0 && this.CurrentRunningIndex <= 2)
        {
            this.CurrentRunningIndex --;

            this.Shell.StopOutput(); // 提前执行 防止 函数重复调用
            this.Ticking = 0;

            this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);
            this.StartMode(this.CurrentRunningIndex);
        }
    }

    get TickingDownHint(): string
    {
        // let TickingDown = this.Downloading ? DEMO_MODES_TIMES[this.CurrentRunningIndex] : DEMO_MODES_TIMES[this.CurrentRunningIndex] - this.Ticking -1;

        // if (TickingDown > 0)
        // {
        //     let Min = Math.trunc((TickingDown) / 60);

        //     let Sec = TickingDown % 60;
        //     if (Sec < 0)
        //     {
        //         if (Min > 0)
        //             Sec += 60;
        //         else
        //             Sec = 0;
        //     }

        //     if (Min > 0)
        //         return (Min < 10 ? '0' : '') + Min.toString() + ':' + (Sec < 10 ? '0' : '') + Sec.toString();
        //     else
        //         return '00:' + (Sec < 10 ? '0' : '') + Sec.toString();
        // }
        // else
        //     return '00:00';

        return this.Downloading ? this.TotalMinute: this.Shell.TickingDownHint;
    }

    get TotalMinute(): string
    {
        let Time = '00:00';
        let Min = Math.trunc(this.CurrentFileDuration / 60);
        if (Min === 0)
            Time = '00:';
        else if (Min < 10)
            Time = '0' + Min + ':';
        else
            Time = Min + ':';

        let Sec = this.CurrentFileDuration % 60;
        if (Sec === 0)
            Time += '00';
        else if (Sec < 10)
            Time += '0' + Sec;
        else
            Time += Sec + '';

        return Time;
    }

    get InitRange(): number
    {
        return this.Ticking / this.CurrentFileDuration * 100;
    }

    get TextStyle(): Object
    {
        let screenHeight = window.innerHeight;
        return { height: screenHeight * 0.15 + "px", overflowY: "scroll", padding: "0" }
    }

    PointRotate(): string
    {
        // 266~446
        let initial = 266;
        let scale = initial + Math.trunc(this.Intensity * 180 / 60) + 'deg';
        let str = 'rotate('+ scale +')';
        return str;
    }

    AdjustIntensity(Value: number)
    {
        this.Shell.SetIntensity(this.Intensity + Value);
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

    CurrentRunningIndex: number = 0;

    Completed: boolean = false;
    Downloading: boolean = false;

    Ticking: number = 0;
    Intensity: number = 0;

    ModeGif: string;
    ModeInfo: string;

    private ClosingTimerId: any = undefined;
    private CurrentFileDuration: number = 0;
    private Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription | undefined;
}
