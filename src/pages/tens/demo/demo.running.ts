import {Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {TUtf8Encoding} from '../../../UltraCreation/Encoding/Utf8';
import {THashMd5} from '../../../UltraCreation/Hash/Md5';
import {PowerManagement} from '../../../UltraCreation/Native/PowerManagement'

import * as Svc from '../../../providers';

const DEMO_MODES: string[] = ["demo_friction", "demo_kneading", "demo_pressure"];
const DEMO_MODES_TIMES: number[] = [45, 70, 80];

@Component({selector: "page-demo.running", templateUrl: "demo.running.html"})
export class DemoRunningPage implements OnInit, AfterViewInit, OnDestroy
{
    constructor(private navParams: NavParams, private view: ViewController,
        public app: Svc.TApplication, private AssetSvc: Svc.TAssetService)
    {
        this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);

        let DeviceId = navParams.get('DeviceId');
        this.Shell = app.GetShell(DeviceId);
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

                    if (DEMO_MODES_TIMES[this.CurrentRunningIndex] - this.Ticking <= 2)
                        this.NextMode();
                    break;
                }
            },
            err=> console.log(err.message));
    }

    ngAfterViewInit(): void
    {
        this.app.Nav.remove(1, this.view.index - 1, {animate: false})
            .then(() => this.Start());
    }

    ngOnDestroy(): void
    {
        PowerManagement.Release();

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
        this.ModeInfo = ModeName + '_info';
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
            let FilePath = './assets/loki/' + DEMO_MODES[Index] + '.lok';
            Svc.HttpRequest(FilePath, 'GET', 'text')
                .then(Content =>
                {
                    let RetVal = TUtf8Encoding.Instance.Encode(Content);
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
                                .then(() => this.app.ShowError(err))
                                .then(() => this.ClosePage());
                        });
                });
        });
    }

    NextMode()
    {
        if (! this.Finish)
        {
            if (this.CurrentRunningIndex < 2)
            {
                this.CurrentRunningIndex ++;

                this.Shell.StopOutput().then(() =>
                {
                    this.Ticking = 0;
                    this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);
                    this.StartMode(this.CurrentRunningIndex, true);
                });
                /*
                // this.Shell.StopTicking(); // 提前执行 防止 函数重复调用

                */
            }
            else
            {
                this.Finish = true;
                if (TypeInfo.Assigned(this.ShellNotifySubscription))
                {
                    this.ShellNotifySubscription.unsubscribe();
                    this.ShellNotifySubscription = null;
                }

                this.Shell.StopOutput();
            }
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
            this.app.ShowError(MessageId).then(() => this.ClosePage());
        else
            this.ClosePage();
    }

    private ClosePage()
    {
        if (this.Finish)
            return;

        setTimeout(() =>
        {
            if (this.view === this.app.Nav.getActive() && this.view.index !== 0)
                this.app.Nav.pop();
        }, 300);
    }

    Shutdown()
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = null;
        }

        this.Shell.StopOutput();

        setTimeout(() =>
        {
            if (this.view === this.app.Nav.getActive() && this.view.index !== 0)
                this.app.Nav.pop();
        }, 300);
    }

    Finish: boolean = false;
    Downloading: boolean = false;

    CurrentRunningIndex: number = 0;
    Ticking: number = 0;
    Intensity: number = 0;

    ModeGif: string;
    ModeInfo: string;

    private Adjusting: Promise<any> = null;
    private Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription;
}
