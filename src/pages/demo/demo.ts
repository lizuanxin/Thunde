import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as UI from '../../UltraCreation/Graphic';

const animation = ['body', 'stick'];

@Component({
  selector: 'page-demo',
  templateUrl: 'demo.html'
})
export class DemoPage implements OnInit, OnDestroy {

  constructor(public navCtrl: NavController, public navParams: NavParams) { }

  ngOnInit(): void
  { 
    this.Canvas = document.getElementById("demo_canvas") as HTMLCanvasElement; 
    this.Canvas2 = document.getElementById("fuck") as HTMLCanvasElement;    
    this.Ctx = this.Canvas.getContext('2d'); 
    this.Ctx2 = this.Canvas2.getContext('2d');
    let width = window.innerWidth * window.devicePixelRatio;
    let height = window.innerHeight * window.devicePixelRatio;
    this.Canvas.style.width = this.Canvas2.style.width = width.toString();
    this.Canvas.style.height =  this.Canvas2.style.height = height.toString();
    this.Canvas.width = this.Canvas2.width = width;
    this.Canvas.height = this.Canvas2.height = height; 
     
    this.Animation(animation[0])
        .then(() => this.Animation(animation[1]))
        .catch(err => console.log(err.message));
  

    // this.DrawBody();
    // let startTime = (new Date()).getSeconds();
    // setInterval(() => {      
    //   this.DrawBody(startTime);
    //   this.DrawStick(startTime);
    // },100)

    
    // this.DrawLine();
    // this.DrawPhone();
  }  
  
  ngOnDestroy(): void 
  {
    
  }

  // DrawBody()
  // {
  //   this.Ctx.save();
  //   this.Ctx.font = this.Canvas.width * 0.8 + 'px Thundericons';
  //   let Str: string = String.fromCharCode(0xe91f); 
  //   let text = this.Ctx.measureText(Str);    
  //   let x:number = 0;

  //   if (text.width > this.Canvas.width) 
  //     x = Math.trunc((text.width - this.Canvas.width) / 2);
  //   else 
  //     x = Math.trunc((this.Canvas.width - text.width) / 2);
  //   console.log(x)
  //   this.Ctx.fillStyle = "#FFFFFF";
  //   this.Ctx.fillText(Str, x, this.Canvas.width * 0.8);
  //   this.Ctx.restore();
  // }

  DrawBody(ctx, start)
  {
    
    ctx.save();
    ctx.globalAlpha = start/10;
    ctx.font = this.SetFontSize(0.48);
    let Str: string = String.fromCharCode(0xe91c); 
    let text = ctx.measureText(Str);    
    let x:number = this.SetX(text, 6);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(Str, x, this.Canvas.width * 0.5);
    ctx.restore();
  }

  DrawStick(ctx, start)
  {
    ctx.save();
    ctx.globalAlpha = start/10;
    ctx.font = this.SetFontSize(0.21);
    let Str: string = String.fromCharCode(0xe91d); 
    let text = ctx.measureText(Str);    
    let x:number = this.SetX(text, 2.3);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(Str, x, this.Canvas.width * 0.42);
    ctx.restore();
  }

  DrawLine(ctx)
  {
    ctx.save();
    ctx.font = this.SetFontSize(0.675);
    let Str: string = String.fromCharCode(0xe920); 
    let text = ctx.measureText(Str);    
    let x:number = this.SetX(text, 1.22);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(Str, x, this.Canvas.width * 0.858);
    ctx.restore();
  } 

  DrawPhone(ctx)
  {
    ctx.save();
    ctx.font = this.SetFontSize(0.3);
    let Str: string = String.fromCharCode(0xe922);
    let text = ctx.measureText(Str);
    let x: number = this.SetX(text, 0.98);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(Str, x, this.Canvas.width * 0.76);
    ctx.restore();
  } 

  Animation(type): Promise<void>
  {
      let alpha = 0;
      let count = 0;
      let IntervalId;

      let BodyAnimation = ()=>
            {
              console.log('BodyAnimation')
                if (alpha < 1)
                {
                    this.DrawBody(this.Ctx, alpha);
                    alpha += 0.01;
                    
                    IntervalId = requestAnimationFrame(BodyAnimation);
                    
                }
                else
                {
                      cancelAnimationFrame(IntervalId);
                      return Promise.resolve();
                }
            };

      let StickAnimation = ()=>
            {
              console.log('StickAnimation')
                if (count <= 3)
                {
                    if (alpha < 1)
                    {
                        this.DrawStick(this.Ctx2,alpha);
                        alpha += 0.01;
                    }
                    else
                    {
                        alpha = 0;
                        if (count !== 3)
                            this.Ctx2.clearRect(0, 0, window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);

                        count++;
                    }

                    requestAnimationFrame(StickAnimation);
                }
                else
                    return Promise.resolve();
            };

      return Promise.resolve().then(() => 
          {
              switch (type) 
              {
                  case 'body':
                    BodyAnimation();
                    break;
                
                  case 'stick':
                    StickAnimation();
                    break;

              }
          });        
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DemoPage');
  }

  SetFontSize(value: number): string
  {
      return this.Canvas.width * value + 'px Thundericons';
  }

  SetX(text: TextMetrics, value: number): number
  {
      if (text.width > this.Canvas.width) 
        return Math.trunc((text.width - this.Canvas.width) / value);
      else 
        return Math.trunc((this.Canvas.width - text.width) / value);
  }

  get ScreenHeight(): string
  {
    return screen.height + 'px';
  }

  private Canvas: HTMLCanvasElement;
  private Canvas2: HTMLCanvasElement;
  Ctx: CanvasRenderingContext2D;
  Ctx2: CanvasRenderingContext2D;
  DisplayHeight:number;
  TimeAmount:number;

}
