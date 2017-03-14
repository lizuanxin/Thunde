import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

const animation = ['body', 'stick','line','phone','Strength','explain'];

@Component({
  selector: 'page-demo',
  templateUrl: 'demo.html'
})

export class DemoPage implements OnInit, OnDestroy
{
    constructor(public navCtrl: NavController, public navParams: NavParams)
    {}

    ngOnInit(): void
    {
        this.Canvas = document.getElementById("demo_canvas") as HTMLCanvasElement;
        this.Ctx = this.Canvas.getContext('2d');
        let width = window.innerWidth * window.devicePixelRatio;
        let height = window.innerHeight * window.devicePixelRatio;
        this.Canvas.style.width = width.toString();
        this.Canvas.style.height = height.toString();
        this.Canvas.width = width;
        this.Canvas.height = height;
        this.AnimationFlow();        
    }

    DrawBody(ctx, alpha)
    {
        ctx.save();
        ctx.globalAlpha = alpha/10;
        ctx.font = this.SetFontSize(0.48);
        let Str: string = String.fromCharCode(0xe91c);
        let text = ctx.measureText(Str);
        let x:number = this.SetX(text, 6);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(Str, x, this.Canvas.width * 0.5);
        ctx.restore();
    }
  
    ngOnDestroy(): void 
    {

    }


    DrawStick(ctx, alpha)
    {
        ctx.save();
        ctx.globalAlpha = alpha/10;
        ctx.font = this.SetFontSize(0.21);
        let Str: string = String.fromCharCode(0xe91d);
        let text = ctx.measureText(Str);
        let x:number = this.SetX(text, 2.3);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(Str, x, this.Canvas.width * 0.42);
        ctx.restore();
    }

    DrawLine(ctx,alpha)
    {
        ctx.save();
        ctx.globalAlpha = alpha/10;
        ctx.font = this.SetFontSize(0.675);
        let Str: string = String.fromCharCode(0xe920);
        let text = ctx.measureText(Str);
        let x:number = this.SetX(text, 1.22);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(Str, x, this.Canvas.width * 0.858);
        ctx.restore();
    }


    DrawPhone(ctx,alpha)
    {
        ctx.save();
        ctx.globalAlpha = alpha/10;
        ctx.font = this.SetFontSize(0.3);
        let Str: string = String.fromCharCode(0xe922);
        let text = ctx.measureText(Str);
        let x: number = this.SetX(text, 0.98);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(Str, x, this.Canvas.width * 0.76);
        ctx.restore();
    }

    DrawStrength(ctx,alpha)
    {
        ctx.save();
        ctx.globalAlpha = alpha/10;
        ctx.font = this.SetFontSize(0.6);
        let Str: string = String.fromCharCode(0xe921);
        let text = ctx.measureText(Str);
        let x: number = this.SetX(text, 1.3);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(Str, x, this.Canvas.width * 1.6);
        ctx.restore();
    }


    DrawText(ctx, Text: string, Size: number, x: number, y: number, Color: string,alpha)
    {
        ctx.save();
        ctx.globalAlpha = alpha/10;
        ctx.font = this.Canvas.width * Size + 'px yahei';
        ctx.fillStyle = Color;
        ctx.fillText(Text, x, y);
        ctx.restore();
    }

    DrawExplain(ctx, x1: number, x2: number, y1: number, y2: number, color: string, lineWidth: number,alpha)
    {
       
        ctx.beginPath();
        ctx.globalAlpha = alpha/10;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth * window.devicePixelRatio;
        //得到斜边的总长度
        let beveling = this.getBeveling(x2 - x1, y2 - y1);
        //计算有多少个线段
        let num = Math.floor(beveling / 8);        
        for (let i = 0; i < num; i++) {
            ctx[i % 2 === 0 ? 'moveTo' : 'lineTo'](x1 + (x2 - x1) / num * i, y1 + (y2 - y1) / num * i);
        }  
        ctx.stroke();
        ctx.closePath();
       
    }

    DrawTextExplain(alpha)
    {
        this.DrawExplain(this.Ctx, this.Canvas.width * 0.52, this.Canvas.width * 0.9, this.Canvas.height * 0.2, this.Canvas.height * 0.2, 'yellow', 1,alpha);
        this.DrawExplain(this.Ctx, this.Canvas.width * 0.9, this.Canvas.width * 0.92, this.Canvas.height * 0.2, this.Canvas.height * 0.22, 'yellow', 1,alpha);
        this.DrawExplain(this.Ctx, this.Canvas.width * 0.78, this.Canvas.width * 0.5, this.Canvas.height * 0.52, this.Canvas.height * 0.72, 'white', 1,alpha);
        this.DrawExplain(this.Ctx, this.Canvas.width * 0.74, this.Canvas.width * 0.62, this.Canvas.height * 0.84, this.Canvas.height * 0.92, 'yellow', 1,alpha);
        this.DrawExplain(this.Ctx, this.Canvas.width * 0.62, this.Canvas.width * 0.12, this.Canvas.height * 0.92, this.Canvas.height * 0.92, 'yellow', 1,alpha);
        this.DrawText(this.Ctx, '按摩贴贴法', 0.05, this.Canvas.width * 0.58, this.Canvas.height * 0.18, 'yellow',alpha);
        this.DrawText(this.Ctx, '强度控制', 0.05, this.Canvas.width * 0.18, this.Canvas.height * 0.9, 'yellow',alpha);
        let TakePower = '手机取电';
        for (let i = 0; i < TakePower.length; i++) {
            this.DrawText(this.Ctx, TakePower[i], 0.04, this.Canvas.width * 0.85, this.Canvas.height * 0.338 + i * 16 * window.devicePixelRatio, 'yellow',alpha);
        } 
    }

    //求斜边长度
    getBeveling(x: number, y: number)
    {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }

    AnimationFlow()
    {
        if (!this.TypeMode) this.TypeMode = animation[0];
        let alpha = 0, step = 0;  
        let Animation = () =>
        {
            alpha += 0.01;
            if (alpha <= 1){
                switch(this.TypeMode)
                {
                    case animation[0]:
                        this.DrawBody(this.Ctx,alpha);
                        break;
                    case animation[1]:
                        this.DrawStick(this.Ctx,alpha);
                        break;
                    case animation[2]:
                        this.DrawLine(this.Ctx,alpha);
                        break;
                    case animation[3]:
                        this.DrawPhone(this.Ctx,alpha);
                        break;
                    case animation[4]:
                        this.DrawStrength(this.Ctx,alpha);
                        break;
                    case animation[5]:
                        this.DrawTextExplain(alpha);
                        break;
                }      
            } else {

                if (step + 1 === animation.length) return;
                alpha = 0;                								
                step += 1;                    
                this.TypeMode = animation[step];
            }

            requestAnimationFrame(Animation);           
                
        }
        Animation();
    }

    get SetTipsClass(): string
    {
        if (this.TypeMode === animation[4] || this.TypeMode === animation[5]) return 'animateTips';
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
    Ctx: CanvasRenderingContext2D;
    DisplayHeight:number;
    TimeAmount:number;
    TypeMode:string = animation[0];

}
