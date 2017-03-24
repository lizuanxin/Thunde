import {Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

import {Subscription} from 'rxjs/rx'

import {Loki, TApplication, TLocalizeService, TAssetService} from '../services';
import {TUtf8Encoding} from '../../UltraCreation/Encoding';
import {TypeInfo} from '../../UltraCreation/Core';
import {THashMd5} from '../../UltraCreation/Hash';

import {const_data} from '../../providers/thunderbolt.const';

const DEMO_MODES: string[] = ["FRICTION", "KNEADING", "PRESSURE"];
const DEMO_MODES_TIMES: number[] = [45, 70, 80];

@Component({selector: "page-demo_mode_running", templateUrl: "demo_mode_running.html"})
export class DemoModeRunningPage implements OnInit, AfterViewInit, OnDestroy
{
    constructor(public nav: NavController, private navParams: NavParams, private view: ViewController,
        private app: TApplication, private Localize: TLocalizeService, private AssetSvc:TAssetService)
    {
        this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);

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
                    this.UpdateHeartbeatRate();
                    break;

                case Loki.TShellNotify.Ticking:
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
        this.AddDialElement();
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
            .then(() => this.StartMode(0))
            .catch(err =>
            {
                this.app.HideLoading()
                    .then(() => this.app.ShowHintId(err.message))
                    .then(() => this.ClosePage());
            });
    }

    private StartMode(Index: number): Promise<any>
    {
        let RetVal = this.ReadLocalFile(DEMO_MODES[Index]);
        let Md5 = THashMd5.Get(RetVal).Print();

        return this.Shell.CatFile(DEMO_MODES[Index], RetVal, Md5)
            .then(progress =>
            {
                this.Ticking = 0;
                if (Index !== 0)
                {
                    this.Downloading = true;
                    if (! TypeInfo.Assigned(this.CountDown))
                    {
                        setTimeout(() =>
                        {
                            this.CountDown = new TCountDown("demo_mode_canvas_countdown");
                            this.CountDown.InitCanvas(window.innerWidth, 280);
                            this.CountDown.Start(2);
                        }, 100);
                    }
                    else
                    {
                        this.CountDown.InitCanvas(window.innerWidth, 280);
                        setTimeout(() => this.CountDown.Start(2), 0);
                    }

                    progress.subscribe(next =>{}, err =>{}, () =>{});
                }

                return progress.toPromise()
                    .then(() =>
                    {
                        if (TypeInfo.Assigned(this.CountDown))
                        {
                            this.CountDown.Stop();
                            this.CountDown.InitCanvas(window.innerWidth, 0);
                        }
                        this.Downloading = false;
                    });
            })
            .then(() =>
            {
                return this.app.HideLoading().then(() =>
                    this.Shell.StartScriptFile(DEMO_MODES[Index]));
            })
    }

    ReadLocalFile(FileName: string): Uint8Array
    {
        let Content = const_data.DemoModes[FileName];
        return TUtf8Encoding.Instance.Encode(Content);
    }

    private NextMode()
    {
        this.Shell.StopTicking(); // 提前执行 防止 函数重复调用
        this.Ticking = 0;

        if (! this.Finish)
        {
            if (this.CurrentRunningIndex < 2)
            {
                this.CurrentRunningIndex ++;
                this.IsNeverClicked = true;
                this.SetModeInfo(DEMO_MODES[this.CurrentRunningIndex]);
                this.StartMode(this.CurrentRunningIndex)
                    .catch(err =>
                    {
                        this.app.HideLoading()
                                .then(() => this.app.ShowHintId(err.message))
                                .then(() => this.ClosePage());
                    });
            }
            else
            {
                this.Finish = true;
                this.AssetSvc.SetKey("DEMO_MODE", true).catch(err => console.log(err.message));
            }
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
        let Min = this.Localize.Translate('hint.min') as string;
        return Math.trunc((DEMO_MODES_TIMES[this.CurrentRunningIndex]) / 60).toString() + Min;
    }

    get InitRange(): number
    {
        return (this.Ticking / (DEMO_MODES_TIMES[this.CurrentRunningIndex])) * 100;
    }

    PointRotate(): string
    {
        // 266~446
        let initial = 266;
        let scale = initial + Math.trunc(this.Intensity * 180 / 60) + 'deg';
        let str = 'rotate('+ scale +')';
        return str;
    }

    OpacityStyle(): string
    {
        if (this.Intensity <= 25)
            return 's-1';
        if (this.Intensity > 25 && this.Intensity <= 45)
            return 's-2';
        else
            return 's-3';
    }

    ComputeScreen(): string
    {
        let toscreen = Math.trunc((screen.height - this.Boundary - Math.trunc((screen.width - 32) * 0.5)) / 4);
        if (screen.height > 480) return toscreen + 'px';
    }

    AdjustIntensity(Value: number)
    {
        if (this.IsNeverClicked)
            this.IsNeverClicked = false;

        if (! this.Shell.IsAttached || this.Adjusting)
            return;

        this.Adjusting = this.Shell.SetIntensity(this.Intensity + Value)
            .then(() =>
            {
                this.Intensity = this.Shell.Intensity;
                this.UpdateHeartbeatRate();
            })
            .catch(err => console.log('Adjuest Intensity: + ' + err.message))
            .then(() => this.Adjusting = null);
    }

    get SetDetail():Object
    {
        return { height: Math.ceil(window.innerHeight * 0.23)+ 'px', overflowY: 'auto' }
    }

    private AddDialElement()
    {
        let boxSize = screen.width - 48 * 4;
        let value = Math.trunc((boxSize - Math.trunc(boxSize * 0.8)) / 2);
        let valueTop = value - 6;
        let textValSize = Math.trunc(boxSize * 0.4);
        let textValTop = Math.trunc((boxSize - textValSize) / 2);

        let box = document.getElementById('box');
        box.setAttribute('class','box');
        box.setAttribute('style','width:' + boxSize + 'px;height:'+ boxSize + 'px');

        let conBtn = document.getElementById('controlBtn');
        conBtn.setAttribute('style','top:'+ Math.trunc(boxSize*0.72) +'px');

        let point = document.getElementById('point');
        point.setAttribute('style','left:'+ Math.trunc(boxSize * 0.8 / 2) +'px;-webkit-transform-origin: 0 '+ Math.trunc(boxSize * 0.8 / 2) +'px;');

        let textVal = document.getElementById('textVal');
        textVal.setAttribute('style','width:'+ textValSize +'px;top:'+ textValTop +'px;padding-top:'+ Math.trunc(textValSize * 0.5) +'px;padding-bottom:'+ Math.trunc(textValSize*0.5) +'px');

        let rount = document.createElement('div');
        rount.setAttribute('class','rount');
        rount.setAttribute('style','height:'+ Math.trunc(boxSize * 0.6) +'px');
        // rount.setAttribute('style','clip:rect(0, '+ boxSize +'px, '+ Math.trunc(boxSize/2) +'px, 0);');

        let maxVal = document.createElement('div');
        maxVal.setAttribute('class','maxVal');
        maxVal.textContent = '60';
        maxVal.setAttribute('style','top:'+ Math.trunc(boxSize * 0.6) +'px');

        let linear = document.createElement('div');
        linear.setAttribute('class','linear');

        let odiv = document.createElement('div');
        odiv.setAttribute('class','position-circle');
        odiv.setAttribute('style','left:'+ value +'px;top:'+ valueTop +'px');

        let circle = document.createElement('div');
        circle.setAttribute('class','circle circle-'+ this.app.SkinName +'');
        circle.setAttribute('style','width:'+ Math.trunc(boxSize * 0.8) +'px;height:'+ Math.trunc(boxSize * 0.8) +'px;');

        let ul = document.createElement('ul');

        rount.appendChild(linear);
        circle.appendChild(ul);
        box.appendChild(rount);
        box.appendChild(maxVal);
        box.appendChild(odiv).appendChild(circle).appendChild(point);

        for(let i = 0; i <= 58; i++)
        {
            let li = document.createElement('li');
            li.setAttribute('style', 'left:'+ Math.trunc(boxSize * 0.4) +'px;-webkit-transform-origin: 0 '+ Math.trunc(boxSize * 0.4) +'px;')
            ul.appendChild(li);
        }
    }

    private UpdateHeartbeatRate()
    {
        this.Intensity = this.Shell.Intensity;

        if (this.Intensity >= 50)
            this.Strength = '.2s';
        else if (this.Intensity >= 45)
            this.Strength = '.3s';
        else if (this.Intensity >= 40)
            this.Strength = '.4s';
        else if (this.Intensity >= 35)
            this.Strength = '.5s';
        else if (this.Intensity >= 30)
            this.Strength = '.6s';
        else if (this.Intensity >= 25)
            this.Strength = '.7s';
        else if (this.Intensity >= 20)
            this.Strength = '.8s';
        else if (this.Intensity >= 10)
            this.Strength = '.9s';
        else
            this.Strength = '1s';
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
            if (this.view === this.nav.getActive())
                this.nav.popToRoot();
        }, 300);
    }

    Shutdown()
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = null;
        }

        this.Shell.Shutdown()
            .catch((err) => console.log(err.message));

        if (this.view === this.nav.getActive())
            this.nav.popToRoot();
    }

    IsNeverClicked: boolean = true;
    Finish: boolean = false;
    Downloading: boolean = false;

    CurrentRunningIndex: number = 0;
    Ticking: number = 0;
    Intensity: number = 0;
    Boundary: number = 293;
    BoxSize: number;
    Strength: string = '1s';

    ModeGif: string;
    ModeTitle: string;
    ModeInfo: string;
    ModeSuggestion: string;

    private Adjusting: Promise<any> = null;
    private CountDown: TCountDown;
    private Shell: Loki.TShell;
    private ShellNotifySubscription: Subscription;
}

class TCountDown
{
    constructor (canvasId: string)
    {
        this.Canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    }

    InitCanvas(width: number, height: number)
    {
        this.Canvas.style.width = width.toString();
        this.Canvas.width = width;
        this.Canvas.style.height = height +"px";
        this.Canvas.height = height;

        this.Ctx = this.Canvas.getContext('2d', {});

        this.Ox = width / 2;
        this.Oy = height / 2;

        if (this.Ox < this.Oy)
            this.Radius = this.Ox;
        else
            this.Radius = this.Oy;
    }

    Start(StartTime: number)
    {
        let Angle = 0;
        let Per = StartTime - 1;

        this.Stop();
        this.IntervalId = setInterval(()=>
        {
            Angle += 9;
            if(Angle === 360 || Angle === 369)
            {
                Per--;
                Angle = 0;
            }

            if(Per === 0 && 360 - Angle === 9)
            {
                Angle += 9;
            }

            if(Per === -1)
            {
                this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
                this.DrawArc(0);
                this.DrawText(0);
                clearInterval(this.IntervalId);
                return;
            }

            this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
            this.DrawArc(Angle);
            this.DrawText(Per);
        }, 25);
    }

    DrawArc(Angle: number)
    {
        this.Ctx.save();
        this.Ctx.translate(this.Ox, this.Oy);
        this.Ctx.rotate(-Math.PI/2);
        this.Ctx.fillStyle = "#0095de";
        this.Ctx.beginPath();
        this.Ctx.arc(0, 0, this.Radius*0.8, Math.PI/180 * Angle, Math.PI*2, true);
        this.Ctx.lineTo(0, 0);
        this.Ctx.closePath();
        this.Ctx.fill();
        this.Ctx.restore();
    }

    DrawText(Per: number)
    {
        this.Ctx.fillStyle = "#FFFFFF";
        this.Ctx.font = "80px Arial";
        this.Ctx.fillText(Per + "", this.Ox - 24, this.Oy + 40);
    }

    Stop()
    {
        if (typeof this.IntervalId !== "undefined")
        {
            clearInterval(this.IntervalId);
            console.log("Stop.IntervalId:" + this.IntervalId);

        }
        this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
    }

    private Canvas: HTMLCanvasElement;
    private IntervalId: number;
    private Ox: number;
    private Oy: number;
    private Radius: number;
    private Ctx: CanvasRenderingContext2D;
}
