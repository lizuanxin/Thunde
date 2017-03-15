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
        let width = window.innerWidth * window.devicePixelRatio;
        let height = window.innerHeight * window.devicePixelRatio;
        this.Canvas = document.getElementById("demo_canvas") as HTMLCanvasElement;        
        this.Ctx = this.Canvas.getContext('2d');        
        this.Canvas.style.width = width.toString();
        this.Canvas.style.height = height.toString();
        this.Canvas.width = width;
        this.Canvas.height = height;
        this.AnimationFlow();        
    }

    DrawBody(Ctx, Alpha)
    {
        Ctx.save();
        Ctx.globalAlpha = Alpha/10;
        Ctx.font = this.SetIconFontSize(0.48);
        let Str: string = String.fromCharCode(0xe91c);
        let text = Ctx.measureText(Str);
        let x:number = this.SetX(text, 6);
        Ctx.fillStyle = "#FFFFFF";
        Ctx.fillText(Str, x, this.Canvas.width * 0.5);
        Ctx.restore();
    }
  
    ngOnDestroy(): void 
    {

    }


    DrawStick(Ctx, Alpha)
    {
        Ctx.save();
        Ctx.globalAlpha = Alpha/10;
        Ctx.font = this.SetIconFontSize(0.21);
        let Str: string = String.fromCharCode(0xe91d);
        let text = Ctx.measureText(Str);
        let x:number = this.SetX(text, 2.3);
        Ctx.fillStyle = "#FFFFFF";
        Ctx.fillText(Str, x, this.Canvas.width * 0.42);
        Ctx.restore();
    }

    DrawLine(Ctx,Alpha)
    {
        Ctx.save();
        Ctx.globalAlpha = Alpha/10;
        Ctx.font = this.SetIconFontSize(0.675);
        let Str: string = String.fromCharCode(0xe920);
        let text = Ctx.measureText(Str);
        let x:number = this.SetX(text, 1.22);
        Ctx.fillStyle = "#FFFFFF";
        Ctx.fillText(Str, x, this.Canvas.width * 0.858);
        Ctx.restore();
    }


    DrawPhone(Ctx,Alpha)
    {
        Ctx.save();
        Ctx.globalAlpha = Alpha/10;
        Ctx.font = this.SetIconFontSize(0.3);
        let Str: string = String.fromCharCode(0xe922);
        let text = Ctx.measureText(Str);
        let x: number = this.SetX(text, 0.98);
        Ctx.fillStyle = "#FFFFFF";
        Ctx.fillText(Str, x, this.Canvas.width * 0.76);
        Ctx.restore();
    }

    DrawStrength(Ctx,Alpha)
    {
        Ctx.save();
        Ctx.globalAlpha = Alpha/10;
        Ctx.font = this.SetIconFontSize(0.6);
        let Str: string = String.fromCharCode(0xe921);
        let text = Ctx.measureText(Str);
        let x: number = this.SetX(text, 2);
        Ctx.fillStyle = "#FFFFFF";
        Ctx.fillText(Str, x, this.Canvas.width * 1.4);
        Ctx.restore();
    }


    DrawText(Ctx, Text: string, FontStyle: string, x: number, y: number, Color: string, Alpha, rotate?: number)
    {
        Ctx.save();
        Ctx.globalAlpha = Alpha/10;
        Ctx.font = FontStyle;
        Ctx.fillStyle = Color; 
        Ctx.translate(x, y);
        if (rotate){            
            Ctx.rotate(rotate * Math.PI / 180);            
        }
        Ctx.fillText(Text, 0, 0);
        Ctx.restore();
    }

    DrawExplain(Ctx, x1: number, x2: number, y1: number, y2: number, color: string, lineWidth: number,Alpha)
    {
       
        Ctx.beginPath();
        Ctx.globalAlpha = Alpha/10;
        Ctx.strokeStyle = color;
        Ctx.lineWidth = lineWidth * window.devicePixelRatio;
        //得到斜边的总长度
        let beveling = this.getBeveling(x2 - x1, y2 - y1);
        //计算有多少个线段
        let num = Math.floor(beveling / 5);        
        for (let i = 0; i < num; i++) {
            Ctx[i % 2 === 0 ? 'moveTo' : 'lineTo'](x1 + (x2 - x1) / num * i, y1 + (y2 - y1) / num * i);
        }  
        Ctx.stroke();
        Ctx.closePath();
       
    }

    DrawTextExplain(Ctx,Alpha)
    {
        let CW = this.Canvas.width, CH = this.Canvas.height, ColorYellow = "#fce000",
            ArrowPoint: string = String.fromCharCode(0xe928),
                    GO: string = String.fromCharCode(0xe929),
                NUM_01: string = String.fromCharCode(0xe923), 
                NUM_02: string = String.fromCharCode(0xe924), 
                NUM_03: string = String.fromCharCode(0xe925), 
                NUM_04: string = String.fromCharCode(0xe927);
        
        this.DrawExplain(Ctx, CW * 0.52, CW * 0.9, CH * 0.2, CH * 0.2, ColorYellow, 1, Alpha);
        this.DrawExplain(Ctx, CW * 0.9, CW * 0.92, CH * 0.2, CH * 0.22, ColorYellow, 1, Alpha);
        this.DrawExplain(Ctx, CW * 0.42, CW * 0.36, CH * 0.62, CH * 0.52, ColorYellow, 1, Alpha);
        this.DrawExplain(Ctx, CW * 0.36, CW * 0.12, CH * 0.52, CH * 0.52, ColorYellow, 1, Alpha);
        this.DrawExplain(Ctx, CW * 0.6, CW * 0.55, CH * 0.72, CH * 0.84, ColorYellow, 1, Alpha);
        this.DrawExplain(Ctx, CW * 0.55, CW * 0.12, CH * 0.84, CH * 0.84, ColorYellow, 1, Alpha);
        this.DrawText(Ctx, ArrowPoint, this.SetIconFontSize(0.2), CW * 0.84, CH * 0.59, '#71a4d0', Alpha, 210);
        this.DrawText(Ctx, NUM_01, this.SetIconFontSize(0.068), CW * 0.91, CH * 0.24, ColorYellow, Alpha);
        this.DrawText(Ctx, NUM_02, this.SetIconFontSize(0.068), CW * 0.9, CH * 0.5, ColorYellow, Alpha);
        this.DrawText(Ctx, NUM_03, this.SetIconFontSize(0.068), CW * 0.07, CH * 0.534, ColorYellow, Alpha);
        this.DrawText(Ctx, NUM_04, this.SetIconFontSize(0.068), CW * 0.07, CH * 0.85, ColorYellow, Alpha);
        this.DrawText(Ctx, GO, this.SetIconFontSize(0.18), CW * 0.42, CH * 0.966, 'white', Alpha);
        this.DrawText(Ctx, '电极贴贴法', this.SetFontSize(0.044), CW * 0.58, CH * 0.18, ColorYellow, Alpha);
        this.DrawText(Ctx, '开关控制', this.SetFontSize(0.044), CW * 0.16, CH * 0.5, ColorYellow, Alpha);
        this.DrawText(Ctx, '强度控制', this.SetFontSize(0.044), CW * 0.16, CH * 0.82, ColorYellow, Alpha);
        let TakePower = '手机取电';
        for (let i = 0; i < TakePower.length; i++) {
            this.DrawText(Ctx, TakePower[i], this.SetFontSize(0.038), CW * 0.85, CH * 0.338 + i * 16 * window.devicePixelRatio, ColorYellow, Alpha);
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
                        this.DrawTextExplain(this.Ctx,alpha);                        
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
        if (this.TypeMode === animation[5]) return 'animateTips';
    }

    SetTipsStyle(n:number): Object
    {  
        switch(n){
            case 0:
                return {'width':'5rem','height':'5rem','left':'38vw','top':'15vh'}
            case 1:
                return {'width': '2rem', 'height': '2rem', 'left': '83.7vw', 'top': '42.2vh'}
            case 2:
                return {'width':'4rem','height':'4rem','left':'57.6vw','top':'66.6vh'}
        }
    }

    SetIconFontSize(value: number): string
    {
        return this.Canvas.width * value + 'px Thundericons';
    }

    SetFontSize(value: number): string
    {
        return this.Canvas.width * value + 'px yahei';
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
    TypeMode:string = animation[0];

}
