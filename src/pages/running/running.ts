import {Component, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {NavController, NavParams, ViewController, Content} from 'ionic-angular';
import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';

import {PowerManagement} from '../../UltraCreation/Native/PowerManagement'

import {TApplication, TDistributeService,
    TScriptFile, TAssetService, Loki} from '../services';

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
        PowerManagement.Acquire();

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
                    {
                        this.Finish = true;
                        this.Shell.Shutdown();
                    }
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

        PowerManagement.Release();
    }

    get CanvasClientHeight(): Object
    {
        return {height: this.content.contentHeight*0.8 + 'px'}
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
        if (this.Finish)
        {
            setTimeout(() =>
            {
                if (this.view === this.nav.getActive())
                    this.nav.pop();
            }, 300);
        }
        else
        {
            this.Shell.Shutdown();
        }
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
        if (this.Finish)
            return;

        setTimeout(() =>
        {
            if (this.view === this.nav.getActive())
                this.nav.pop();
        }, 300);
    }

    @ViewChild(Content) content: Content;

    ScriptFile: TScriptFile;

    Ticking: number = 0;
    Intensity: number = 0;
    BatteryLevel: number = 0;
    Finish: boolean = false;

    private Shell: Loki.TShell;
    private ShellNotifySubscription: Subscription;
    private Adjusting: Promise<any> = null;
    private Downloading: boolean = false;

    // constructor(public nav: NavController, private navParams: NavParams, private view: ViewController,
    //     private app: TApplication,
    //     private Asset: TAssetService, private Distibute: TDistributeService)
    // {
    //     this.ScriptFile = navParams.get('ScriptFile');
    //     let DeviceId = navParams.get('DeviceId');

    //     this.Shell = Loki.TShell.Get(DeviceId);
    // }

    // ngOnInit()
    // {
    //     this.ShellNotifySubscription = this.Shell.OnNotify.subscribe(
    //         Notify =>
    //         {
    //             switch(Notify)
    //             {
    //             case Loki.TShellNotify.Shutdown:
    //                 this.Close('shutdown');
    //                 break;
    //             case Loki.TShellNotify.Disconnected:
    //                 this.Close('disconnected');
    //                 break;
    //             case Loki.TShellNotify.LowBattery:
    //                 this.Close('low_battery');
    //                 break;
    //             case Loki.TShellNotify.HardwareError:
    //                 this.Close('hardware_error');
    //                 break;

    //             case Loki.TShellNotify.NoLoad:
    //                 this.Close('no_load');
    //                 break;

    //             case Loki.TShellNotify.Stopped:
    //                 this.Close('');
    //                 break;

    //             case Loki.TShellNotify.Intensity:
    //                 this.UpdateIntensity();
    //                 break;

    //             case Loki.TShellNotify.Battery:
    //                 this.UpdateBatteryLevel();
    //                 break;

    //             case Loki.TShellNotify.Ticking:
    //                 this.Ticking = this.Shell.Ticking;
    //                 if (this.Ticking >= this.ScriptFile.Duration)
    //                 {
    //                     this.Finish = true;
    //                     this.Shell.Shutdown();
    //                 }
    //                 break;
    //             }
    //         },
    //         err=> console.log(err.message));
    // }

    // ngAfterViewInit()
    // {
    //     this.AddDialElement();
    //     this.nav.remove(1, this.view.index - 1, {animate: false})
    //         .then(() => this.Start());
    // }

    // ngOnDestroy(): void
    // {
    //     if(TypeInfo.Assigned(this.ShellNotifySubscription))
    //     {
    //         this.ShellNotifySubscription.unsubscribe();
    //         this.ShellNotifySubscription = null;
    //     }

    //     this.Shell.Detach();
    // }

    // get TotalMinute(): string
    // {
    //     let Min = this.app.Translate('hint.min') as string;
    //     return Math.trunc((this.ScriptFile.Duration + 20) / 60).toString() + Min;
    // }

    // get TickingDownHint(): string
    // {
    //     let TickingDown = this.Downloading ? this.ScriptFile.Duration : this.ScriptFile.Duration - this.Ticking;

    //     if (TickingDown > 0)
    //     {
    //         let Min = Math.trunc((TickingDown - 1) / 60);

    //         let Sec = TickingDown % 60 - 1;
    //         if (Sec < 0)
    //         {
    //             if (Min > 0)
    //                 Sec += 60;
    //             else
    //                 Sec = 0;
    //         }

    //         return  (Min < 10 ? '0' : '') + Min.toString() + (Sec < 10 ? ':0' : ':') + Sec.toString();
    //     }
    //     else
    //         return '00:00';
    // }

    // AdjustIntensity(Value: number)
    // {
    //     if (! this.Shell.IsAttached || this.Adjusting)
    //         return;

    //     this.Adjusting = this.Shell.SetIntensity(this.Intensity + Value)
    //         .then(() =>
    //         {
    //             this.Intensity = this.Shell.Intensity;
    //             this.UpdateHeartbeatRate();
    //         })
    //         .catch(err => console.log('Adjuest Intensity: + ' + err.message))
    //         .then(() => this.Adjusting = null);
    // }

    // PointRotate(): string
    // {
    //     // 266~446
    //     let initial = 266;
    //     let scale = initial + Math.trunc(this.Intensity * 180 / 60) + 'deg';
    //     let str = 'rotate('+ scale +')';
    //     return str;
    // }

    // OpacityStyle(): string
    // {
    //     if (this.Intensity <= 25)
    //         return 's-1';
    //     if (this.Intensity > 25 && this.Intensity <= 45)
    //         return 's-2';
    //     else
    //         return 's-3';
    // }

    // ComputeScreen(): string
    // {
    //     let toscreen = Math.trunc((screen.height - this.Boundary - Math.trunc((screen.width - 32) * 0.5)) / 4);
    //     if (screen.height > 480) return toscreen + 'px';
    // }

    // Shutdown(): void
    // {
    //     if (this.Finish)
    //     {
    //         setTimeout(() =>
    //         {
    //             if (this.view === this.nav.getActive())
    //                 this.nav.pop();
    //         }, 300);
    //     }
    //     else
    //     {
    //         this.Shell.Shutdown();
    //     }
    // }

    // private Start()
    // {
    //     return this.Shell.ClearFileSystem([this.ScriptFile.Name])
    //         .then(() => this.Distibute.ReadScriptFile(this.ScriptFile))
    //         .then(buf => this.Shell.CatFile(this.ScriptFile.Name, buf, this.ScriptFile.Md5))
    //         .then(progress =>
    //         {
    //             this.Downloading = true;
    //             progress.subscribe(next => this.Ticking = this.ScriptFile.Duration * next, err => {}, () => {});

    //             return progress.toPromise()
    //                 .then(() =>
    //                 {
    //                     this.Ticking = 0;
    //                     this.Downloading = false;
    //                 });
    //         })
    //         .then(() => this.app.HideLoading())
    //         .then(() => this.Shell.StartScriptFile(this.ScriptFile.Name))
    //         .catch(err=>
    //         {
    //             this.app.HideLoading()
    //                 .then(() => this.app.ShowHintId(err.message))
    //                 .then(() => this.ClosePage());
    //         });
    // }

    // private UpdateIntensity()
    // {
    //     this.Intensity = this.Shell.Intensity;
    //     this.UpdateHeartbeatRate();
    // }

    // private UpdateBatteryLevel()
    // {
    //     this.BatteryLevel = this.Shell.BatteryLevel;
    // }

    // private Close(MessageId: string)
    // {
    //     if (MessageId !== '')
    //         this.app.ShowHintId(MessageId).then(() => this.ClosePage());
    //     else
    //         this.ClosePage();
    // }

    // private ClosePage()
    // {
    //     if (this.Finish)
    //         return;

    //     setTimeout(() =>
    //     {
    //         if (this.view === this.nav.getActive())
    //             this.nav.pop();
    //     }, 300);
    // }

    // private AddDialElement()
    // {
    //     let boxSize = screen.width - 48 * 2;
    //     let value = Math.trunc((boxSize - Math.trunc(boxSize * 0.8)) / 2);
    //     let valueTop = value - 6;
    //     let textValSize = Math.trunc(boxSize * 0.4);
    //     let textValTop = Math.trunc((boxSize - textValSize) / 2);

    //     let box = document.getElementById('box');
    //     box.setAttribute('class','box');
    //     box.setAttribute('style','width:' + boxSize + 'px;height:'+ boxSize + 'px');

    //     let conBtn = document.getElementById('controlBtn');
    //     conBtn.setAttribute('style','top:'+ Math.trunc(boxSize*0.72) +'px');

    //     let point = document.getElementById('point');
    //     point.setAttribute('style','left:'+ Math.trunc(boxSize * 0.8 / 2) +'px;-webkit-transform-origin: 0 '+ Math.trunc(boxSize * 0.8 / 2) +'px;');

    //     let textVal = document.getElementById('textVal');
    //     textVal.setAttribute('style','font-size:' + boxSize * 0.2 +'px;width:'+ textValSize +'px;top:'+ textValTop +'px;padding-top:'+ Math.trunc(textValSize * 0.5) +'px;padding-bottom:'+ Math.trunc(textValSize * 0.5) +'px');

    //     let rount = document.createElement('div');
    //     rount.setAttribute('class','rount');
    //     rount.setAttribute('style','height:'+ Math.trunc(boxSize * 0.6) +'px');
    //     // rount.setAttribute('style','clip:rect(0, '+ boxSize +'px, '+ Math.trunc(boxSize/2) +'px, 0);');

    //     let maxVal = document.createElement('div');
    //     maxVal.setAttribute('class','maxVal');
    //     maxVal.textContent = '60';
    //     maxVal.setAttribute('style','top:'+ Math.trunc(boxSize * 0.6) +'px');

    //     let linear = document.createElement('div');
    //     linear.setAttribute('class','linear');

    //     let odiv = document.createElement('div');
    //     odiv.setAttribute('class','position-circle');
    //     odiv.setAttribute('style','left:'+ value +'px;top:'+ valueTop +'px');

    //     let circle = document.createElement('div');
    //     circle.setAttribute('class','circle circle-'+ this.app.SkinName +'');
    //     circle.setAttribute('style','width:'+ Math.trunc(boxSize * 0.8) +'px;height:'+ Math.trunc(boxSize * 0.8) +'px;');

    //     let ul = document.createElement('ul');

    //     rount.appendChild(linear);
    //     circle.appendChild(ul);
    //     box.appendChild(rount);
    //     box.appendChild(maxVal);
    //     box.appendChild(odiv).appendChild(circle).appendChild(point);

    //     for(let i = 0; i <= 58; i++)
    //     {
    //         let li = document.createElement('li');
    //         li.setAttribute('style', 'left:'+ Math.trunc(boxSize * 0.4) +'px;-webkit-transform-origin: 0 '+ Math.trunc(boxSize * 0.4) +'px;')
    //         ul.appendChild(li);
    //     }
    // }

    // private UpdateHeartbeatRate()
    // {
    //     if (this.Intensity >= 50)
    //         this.Strength = '.2s';
    //     else if (this.Intensity >= 45)
    //         this.Strength = '.3s';
    //     else if (this.Intensity >= 40)
    //         this.Strength = '.4s';
    //     else if (this.Intensity >= 35)
    //         this.Strength = '.5s';
    //     else if (this.Intensity >= 30)
    //         this.Strength = '.6s';
    //     else if (this.Intensity >= 25)
    //         this.Strength = '.7s';
    //     else if (this.Intensity >= 20)
    //         this.Strength = '.8s';
    //     else if (this.Intensity >= 10)
    //         this.Strength = '.9s';
    //     else
    //         this.Strength = '1s';
    // }

    // ScriptFile: TScriptFile;

    // Ticking: number = 0;
    // Intensity: number = 0;
    // BatteryLevel: number = 0;
    // Boundary: number = 293;
    // BoxSize: number;
    // Strength: string = '1s';

    // Finish: boolean = false;
    // private Shell: Loki.TShell;
    // private ShellNotifySubscription: Subscription;
    // private Adjusting: Promise<any> = null;
    // private Downloading: boolean = false;
}
