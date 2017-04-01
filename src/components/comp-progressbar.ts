import {Component, OnInit, Input, Output, EventEmitter, ElementRef} from '@angular/core'

import * as UITypes from '../UltraCreation/Graphic/Types'

@Component({selector: 'comp-progressbar', template: '<canvas style="width:100%"></canvas>'})
export class Progressbar implements OnInit
{
    constructor(private Elements: ElementRef)
    {
        this.Image = new Image();
        this.Image.src = "assets/img/bg_progressbar.png";
    }

    ngOnInit()
    {
        console.log("Progressbar.ngOnInit.ngOnInit.Intensity" + this.CurrrentProgress);

        this.Canvas = this.Elements.nativeElement.children[0] as HTMLCanvasElement;
        this.Canvas.addEventListener("touchstart", this.TouchHandler.bind(this));

        this.Canvas.addEventListener("click", this.Click.bind(this));

        let rect = this.Canvas.getBoundingClientRect();
        let width = rect.width * window.devicePixelRatio;
        let height = rect.width * window.devicePixelRatio;

        this.Canvas.style.width = width.toString();
        this.Canvas.style.height = height.toString();
        this.Canvas.width  = width;
        this.Canvas.height = height;

        this.CenterX = width/2;
        this.CenterY = height/2;
        this.Radius = width / 2.6;

        this.Ctx = this.Canvas.getContext('2d');
        this.ViewInited = true;

        setTimeout(() => this.Paint(this.CurrrentProgress), 0);
    }

    private Paint(Progress: number)
    {
        if (! this.ViewInited)
            return;

        this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        let width = this.Canvas.width;

        let anglePiece = (this.EndAngle - this.StartAngle)/this.MaxProgress;
        console.log("" + this.StartAngle + "  Endangle" + this.EndAngle + "  anglePiece" + anglePiece + " Progress:" + Progress);

        this.DrawBackground(this.Image, width, width)
            .then(() =>
            {
                this.DrawArc(
                {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius,
                    startAngle: this.StartAngle + anglePiece * Progress,
                    endAngle: this.EndAngle,
                    lineWidth: width * 0.05,
                    strokeColor: '#bacade'
                });

                this.DrawArc(
                {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius,
                    startAngle: 0.5005 * Math.PI,
                    endAngle: this.StartAngle,
                    lineWidth: width * 0.1,
                    strokeColor: '#ffffff'
                });

                this.DrawArc(
                {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius,
                    startAngle: this.EndAngle%(2 * Math.PI),
                    endAngle: 0.4995 * Math.PI,
                    lineWidth: width * 0.1,
                    strokeColor: '#ffffff'
                });

                this.DrawRotateText("-", {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius,
                    angle: 0.5005*Math.PI + (this.StartAngle - 0.5005*Math.PI)/2,
                    font: this.SetFont(20, true),
                    fillColor: '#aaffff'
                });

                this.DrawRotateText("+", {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius,
                    angle: this.EndAngle%(2 * Math.PI) + (0.4995 * Math.PI - this.EndAngle%(2 * Math.PI))/2,
                    font: this.SetFont(20, true),
                    fillColor: '#aaffff'
                });

                this.DrawText(Math.trunc(Progress).toString(), {
                    x: this.CenterX,
                    y: this.CenterY,
                    font: this.SetFont(96),
                    fillColor: '#aaffff'
                })
            });
    }

    private DrawArc(option: ICanvasDrawOption)
    {
        this.Ctx.beginPath();
        this.Ctx.arc(option.x, option.y, option.radius, option.startAngle, option.endAngle, false);
        this.Ctx.lineWidth = option.lineWidth;
        this.Ctx.strokeStyle = option.strokeColor;
        this.Ctx.stroke();
    }

    private DrawBackground(img: HTMLImageElement, width: number, height: number): Promise<any>
    {
        let that = this;

        return new Promise((resolve) =>
        {
            if (img.complete)
                DrawImage();
            else
                img.onload = DrawImage;

            function DrawImage()
            {
                let tempCanvas = document.createElement("canvas");
                tempCanvas.width = width;
                tempCanvas.height = width;
                let ctx2 = tempCanvas.getContext('2d');
                ctx2.drawImage(img, 0, 0, width, width);

                that.Ctx.save();

                that.Ctx.strokeStyle = that.Ctx.createPattern(tempCanvas, 'no-repeat');
                that.Ctx.beginPath();
                that.Ctx.lineWidth = width * 0.05;
                that.Ctx.arc(width/2, width/2, that.Radius, that.StartAngle, that.EndAngle, false);
                that.Ctx.stroke();

                that.Ctx.restore();

                return resolve();
            }
        });
    }

    private DrawRotateText(value: string, option: ICanvasDrawOption)
    {
        this.Ctx.textBaseline = 'middle';
        this.Ctx.textAlign = 'center';
        this.Ctx.fillStyle = option.fillColor;
        this.Ctx.font = option.font;

        this.Ctx.save();
        this.Ctx.beginPath();
        this.Ctx.translate(option.x + Math.cos(option.angle) * option.radius,
                      option.y + Math.sin(option.angle) * option.radius);
        this.Ctx.rotate(Math.PI/2 + option.angle);
        this.Ctx.fillText(value, 0, 0);
        this.Ctx.restore();
    }

    private DrawText(value: string, option: ICanvasDrawOption)
    {
        this.Ctx.textBaseline = 'middle';
        this.Ctx.textAlign = 'center';
        this.Ctx.fillStyle = option.fillColor;
        this.Ctx.font = option.font;

        this.Ctx.fillText(value, option.x, option.y);
    }

    private TouchHandler(ev: TouchEvent)
    {
        if (ev.targetTouches.length !== 1)  // 1 finger touch
            return;
        let t = ev.targetTouches[0];
        let currentX = t.clientX * window.devicePixelRatio;
        let currentY = t.clientY * window.devicePixelRatio;

        if (ev.type === 'touchstart')
            this.HandlerEvent(currentX, currentY);
    }

    private Click(ev: MouseEvent)
    {
        let offsetX = ev.offsetX * window.devicePixelRatio;
        let offsetY = ev.offsetY * window.devicePixelRatio;
        this.HandlerEvent(offsetX, offsetY);
    }

    private HandlerEvent(x: number, y: number)
    {
        let rightButtonClicked = this.ArcInPath(
        {
            x: this.CenterX,
            y: this.CenterY,
            radius: this.Radius,
            startAngle: 0.1 * Math.PI,
            endAngle: 0.4995 * Math.PI,
            lineWidth: this.CanvasWidth * 0.1,
        },
        x,
        y);

        let leftButtonClicked = this.ArcInPath(
        {
            x: this.CenterX,
            y: this.CenterY,
            radius: this.Radius,
            startAngle: 0.5005 * Math.PI,
            endAngle: this.StartAngle,
            lineWidth: this.CanvasWidth * 0.1,
        },
        x,
        y);

        if (rightButtonClicked)
            this.OnValueChanged.emit(1);
        else if (leftButtonClicked)
            this.OnValueChanged.emit(-1);
        console.log("rightButtonClicked:" + rightButtonClicked + " leftButtonClicked:" + leftButtonClicked);
    }

    private ArcInPath(option: ICanvasDrawOption, x: number, y: number): boolean
    {
        this.Ctx.beginPath();
        this.Ctx.arc(option.x, option.y, option.radius, option.startAngle, option.endAngle, false);
        this.Ctx.lineWidth = option.lineWidth;
        this.Ctx.closePath();

        return this.Ctx.isPointInPath(x, y);
    }

    private SetFont(size: number = 20, bold: boolean = false): string
    {
        let Font = null;

        if (bold)
            Font = new UITypes.TFont('brandontext_normal', size, UITypes.TFontStyle.Normal, UITypes.TFontWeight.Bold);
        else
            Font = new UITypes.TFont('brandontext_normal', size, UITypes.TFontStyle.Normal);

        return Font.toString();
    }

    @Input()
    set Min(min: number)
    {
        this.MinProgress = min;
    }

    @Input()
    set Max(min: number)
    {
        this.MaxProgress = min;
    }

    @Input()
    set Progress(Progress: number)
    {
        console.log("value:" + Progress + "  ViewInited:" + this.ViewInited + "  MinProgress" + this.MinProgress + "  MaxProgress" + this.MaxProgress);

        if (this.CurrrentProgress === Progress)
            return;
        else
            this.CurrrentProgress = Progress; //界面未初始化好 先保存传进来的值

        if (this.MinProgress <= Math.trunc(Progress) && Math.trunc(Progress) <= this.MaxProgress)
            this.Paint(this.CurrrentProgress);
    }

    @Output() OnValueChanged: EventEmitter<any> = new EventEmitter();

    private MinProgress: number = 0;
    private MaxProgress: number = 100;

    private ViewInited: boolean = false;

    private CurrrentProgress: number = 0;
    private StartAngle = 0.8 * Math.PI;
    private EndAngle = 2.2 * Math.PI;
    private Radius: number;
    private CanvasWidth: number;
    private CenterX: number;
    private CenterY: number;
    private Ctx: CanvasRenderingContext2D;
    private Canvas: HTMLCanvasElement;
    private Image: HTMLImageElement;
}

interface ICanvasDrawOption
{
    x?: number,
    y?: number,
    radius?: number,
    angle?:number,
    startAngle?: number,
    endAngle?: number,
    lineWidth?: number,
    lineCap?: string,
    font?:string,
    strokeColor?: any,
    fillColor?: string
}
