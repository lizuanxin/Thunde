import {Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs/rx'

import {NavController, NavParams, ViewController} from 'ionic-angular';

import {TUtf8Encoding} from '../../UltraCreation/Encoding';
import {TypeInfo} from '../../UltraCreation/Core';
import {THashMd5} from '../../UltraCreation/Hash';

import * as Svc from '../../providers';

const DEMO_MODES: string[] = ["FRICTION", "KNEADING", "PRESSURE"];
const DEMO_MODES_TIMES: number[] = [45, 70, 80];

@Component({selector: "page-demo_mode_running", templateUrl: "demo_mode_running.html"})
export class DemoModeRunningPage implements OnInit, AfterViewInit, OnDestroy
{
    constructor(public nav: NavController, private navParams: NavParams, private view: ViewController,
        public app: Svc.TApplication, private Asset: Svc.TAssetService)
    {
        this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);

        let DeviceId = navParams.get('DeviceId');
        this.Shell = Svc.Loki.TShell.Get(DeviceId);
    }

    ngOnInit()
    {
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
                    console.log("Ticking:" + this.Ticking);

                    if (DEMO_MODES_TIMES[this.CurrentRunningIndex] - this.Ticking <= 2)
                        this.NextMode();
                    break;
                }
            },
            err=> console.log(err.message));
    }

    ngAfterViewInit(): void
    {
        this.nav.remove(1, this.view.index - 1, {animate: false})
            .then(() => this.Start());
    }

    ngOnDestroy(): void
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = null;
        }

        this.app.HideLoading();
        this.Shell.Detach();
    }

    SetModeInfo(runningIndex: string)
    {
        let ModeName = runningIndex.toLowerCase();

        this.ModeGif = 'assets/img/' + ModeName + '.gif';
        this.ModeTitle = ModeName + '_title';
        this.ModeInfo = ModeName + '_info';
        this.ModeSuggestion = ModeName + '_suggestion';
    }

    private Start()
    {
        this.Shell.ClearFileSystem(DEMO_MODES)
            .then(() => this.StartMode(0, false))
    }

    private StartMode(Index: number, Loading: boolean)
    {
        let Load: Promise<any> = Promise.resolve();
        if(Loading) // 解决第一次显示loading 时闪烁的问题
            Load = this.app.ShowLoading();

        Load.then(() =>
        {
            let RetVal = this.ReadLocalFile(DEMO_MODES[Index]);
            let Md5 = THashMd5.Get(RetVal).Print();

            this.Shell.CatFile(DEMO_MODES[Index], RetVal, Md5)
                .then(progress =>
                {
                    this.Downloading = true;
                    progress.subscribe(next => this.Ticking =  DEMO_MODES_TIMES[Index]* next, err => {}, () => {});

                    return progress.toPromise()
                        .then(() =>
                        {
                            this.Ticking = 0;
                            this.Downloading = false;
                        });
                })
                .then(() => this.Shell.StartScriptFile(DEMO_MODES[Index]))
                .then(() => setTimeout(this.app.HideLoading(), 1000))
                .catch(err =>
                {
                    this.app.HideLoading()
                        .then(() => this.app.ShowHintId(err.message))
                        .then(() => this.ClosePage());
                });
        });
    }

    ReadLocalFile(FileName: string): Uint8Array
    {
        let Content = Svc.const_data.DemoModes[FileName];
        return TUtf8Encoding.Instance.Encode(Content);
    }

    NextMode()
    {
        if (! this.Finish)
        {
            if (this.CurrentRunningIndex < 2)
            {
                this.CurrentRunningIndex ++;

                this.Shell.StopTicking(); // 提前执行 防止 函数重复调用
                this.Ticking = 0;

                this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);
                this.StartMode(this.CurrentRunningIndex, true);
            }
            else
                this.Finish = true;
        }
    }

    LastMode()
    {
        if (this.CurrentRunningIndex > 0 && this.CurrentRunningIndex <= 2)
        {
            this.CurrentRunningIndex --;

            this.Shell.StopTicking(); // 提前执行 防止 函数重复调用
            this.Ticking = 0;

            this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);
            this.StartMode(this.CurrentRunningIndex, true);
        }
    }

    get TickingDownHint(): string
    {
        let TickingDown = this.Downloading ? DEMO_MODES_TIMES[this.CurrentRunningIndex] : DEMO_MODES_TIMES[this.CurrentRunningIndex] - this.Ticking -1;

        if (TickingDown > 0)
        {
            let Min = Math.trunc((TickingDown) / 60);

            console.log("Min:" + Min);

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

    get TotalMinute(): string
    {
        let Time = '00:00';
        let Min = Math.trunc((DEMO_MODES_TIMES[this.CurrentRunningIndex]) / 60);
        if (Min === 0)
            Time = '00:';
        else if (Min < 10)
            Time = '0' + Min + ':';
        else
            Time = Min + ':';

        let Sec = DEMO_MODES_TIMES[this.CurrentRunningIndex] % 60;
        if (Sec === 0)
            Time += '00';
        else if (Sec < 10)
            Time += Sec + '0';
        else
            Time += Sec + '';

        return Time;
    }

    get CurrentMinute(): string
    {
        return Math.trunc((DEMO_MODES_TIMES[this.CurrentRunningIndex]) / 60).toString();
    }

    get InitRange(): number
    {
        return (this.Ticking / (DEMO_MODES_TIMES[this.CurrentRunningIndex])) * 100;
    }

    get TextStyle(): Object
    {
        let screenHeight = window.innerHeight;
        return { height: screenHeight * 0.15 + "px", overflowY: "scroll", padding: "0", margin: "0" }
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
        if (! this.Shell.IsAttached || this.Adjusting)
            return;

        this.Adjusting = this.Shell.SetIntensity(this.Intensity + Value)
            .then(() => this.Intensity = this.Shell.Intensity)
            .catch(err => console.log('Adjuest Intensity: + ' + err.message))
            .then(() => this.Adjusting = null);
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
        if (this.Finish)
            return;

        setTimeout(() =>
        {
            if (this.view === this.nav.getActive() && this.view.index !== 0)
                this.nav.pop();
        }, 300);
    }

    Shutdown()
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = null;
        }

        this.Shell.Shutdown();

        setTimeout(() =>
        {
            if (this.view === this.nav.getActive() && this.view.index !== 0)
                this.nav.pop();
        }, 300);
    }

    Finish: boolean = false;
    Downloading: boolean = false;

    CurrentRunningIndex: number = 0;
    Ticking: number = 0;
    Intensity: number = 0;

    ModeGif: string;
    ModeTitle: string;
    ModeInfo: string;
    ModeSuggestion: string;

    private Adjusting: Promise<any> = null;
    private Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription;
}
