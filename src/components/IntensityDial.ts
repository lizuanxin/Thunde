import {Component, OnInit, Input, Output, EventEmitter, ElementRef} from '@angular/core'
import {TypeInfo} from "../UltraCreation/Core/TypeInfo";

@Component({selector: 'intensity-dial', template: '<canvas style="width:100%" tappable></canvas>'})
export class IntensityDialComp implements OnInit
{
    constructor(private Elements: ElementRef)
    {
        this.Image = new Image();
        this.Image.src = "assets/img/bg_dial.png";
    }

    ngOnInit()
    {
        this.Canvas = this.Elements.nativeElement.children[0] as HTMLCanvasElement;
        this.Canvas.addEventListener("touchstart", this.TouchHandler.bind(this));

        let rect = this.Canvas.getBoundingClientRect();
        let width = rect.width * window.devicePixelRatio;
        let height = rect.width * window.devicePixelRatio;

        this.Canvas.style.width = width.toString();
        this.Canvas.style.height = height.toString();
        this.Canvas.width  = width;
        this.Canvas.height = height;

        this.CenterX = width / 2;
        this.CenterY = height / 2;
        this.Radius = width / 2.6;

        this.Ctx = this.Canvas.getContext('2d');

        setTimeout(() => this.Paint(this._Value), 0);
    }

    private Paint(Progress: number)
    {
        if (! TypeInfo.Assigned(this.Ctx))
            return;

        this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        let width = this.Canvas.width;

        let anglePiece = (this.EndAngle - this.StartAngle)/this._Max;

        this.DrawBackground(this.Image, width, width)
            .then(() =>
            {
                this.DrawArc(
                {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius - (width * 0.03)/2,
                    startAngle: 0,
                    endAngle: 2 * Math.PI,
                    fillColor: 'rgba(0,0,0,.3)',
                });

                this.DrawArc(
                {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius,
                    startAngle: this.StartAngle + anglePiece * Progress,
                    endAngle: this.EndAngle,
                    lineWidth: width * 0.03,
                    strokeColor: '#bacade',
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
                    font: this.SetFontSize(0.08),
                    fillColor: '#9a9b9b'
                });

                this.DrawRotateText("+", {
                    x: this.CenterX,
                    y: this.CenterY,
                    radius: this.Radius,
                    angle: this.EndAngle%(2 * Math.PI) + (0.4995 * Math.PI - this.EndAngle%(2 * Math.PI))/2,
                    font: this.SetFontSize(0.08),
                    fillColor: '#9a9b9b'
                });

                this.DrawText(Math.trunc(Progress).toString(), {
                    x: this.CenterX,
                    y: this.CenterY,
                    font: this.SetFontSize(0.38),
                    fillColor: '#aaffff'
                })
            });
    }

    private DrawArc(option: ICanvasDrawOption)
    {
        this.Ctx.beginPath();
        this.Ctx.arc(option.x, option.y, option.radius, option.startAngle, option.endAngle, false);

        if (option.fillColor)
        {
            this.Ctx.fillStyle = option.fillColor;
            this.Ctx.fill();
        }

        if (option.strokeColor)
        {
            this.Ctx.lineWidth = option.lineWidth;
            this.Ctx.strokeStyle = option.strokeColor;
            this.Ctx.stroke();
        }
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
                that.Ctx.lineWidth = width * 0.03;
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
        let X = t.clientX * window.devicePixelRatio;
        let Y = t.clientY * window.devicePixelRatio;

        if (ev.type === 'touchstart')
        {
            let clickResult = this.ArcInPath(X, Y);

            if (clickResult.right)
                this.OnValueChanged.emit(1);
            else if (clickResult.left)
                this.OnValueChanged.emit(-1);
        }
    }

    private ArcInPath(x: number, y: number)
    {
        let leftButtonClicked = false;
        let rightButtonClicked = false;

        let rect = this.Canvas.getBoundingClientRect();
        let realTouchPointX = x - rect.left * (this.Canvas.width / rect.width);
        let realTouchPointY = y - rect.top * (this.Canvas.height / rect.height);

        let leftX = this.CenterX - this.Radius;
        let bottomY = this.CenterY + this.Radius * 1.5;

        let rightX = this.CenterX + this.Radius;
        let topY = this.CenterY;

        if ((leftX < realTouchPointX && realTouchPointX < this.CenterX) &&
            (topY < realTouchPointY && realTouchPointY < bottomY))
            leftButtonClicked = true;

        if ((this.CenterX < realTouchPointX && realTouchPointX < rightX) &&
            (topY < realTouchPointY && realTouchPointY < bottomY))
            rightButtonClicked = true;

        return {left: leftButtonClicked, right: rightButtonClicked};
    }

    private SetFontSize(size: number, iconFont: boolean = false): string
    {
        return (this.Canvas.width * size + 'px ' + (iconFont ? 'Thundericons' : 'arial')).toString();
    }

    @Input()
    set Min(min: number)
    {
        this._Min = min;
    }

    @Input()
    set Max(max: number)
    {
        this._Max = max;
    }

    @Input()
    set Value(v: number)
    {
        if (this._Value === v)
            return;
        else
            this._Value = v;

        if (this._Min <= Math.trunc(v) && Math.trunc(v) <= this._Max)
            this.Paint(this._Value);
    }

    @Output() OnValueChanged = new EventEmitter<number>(true);

    private Ctx: CanvasRenderingContext2D;
    private Canvas: HTMLCanvasElement;
    private Image: HTMLImageElement;

    private _Min: number = 0;
    private _Max: number = 60;
    private _Value: number = 0;

    private StartAngle = 0.8 * Math.PI;
    private EndAngle = 2.2 * Math.PI;
    private Radius: number;
    private CenterX: number;
    private CenterY: number;
}

interface ICanvasDrawOption
{
    x?: number,
    y?: number,
    radius?: number,
    globalAlpha?:number,
    angle?:number,
    startAngle?: number,
    endAngle?: number,
    lineWidth?: number,
    lineCap?: string,
    font?:string,
    strokeColor?: any,
    fillColor?: string
}
