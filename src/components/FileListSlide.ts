import {Component, OnInit, Input, Output, EventEmitter, ElementRef} from '@angular/core';

@Component({selector: 'scrollvalue', template: '<canvas style="width:100%" tappable></canvas>'})
export class FileListSlideComp implements OnInit
{
    constructor(private Elements: ElementRef)
    {
    }

    ngOnInit()
    {
        this.Canvas = this.Elements.nativeElement.children[0] as HTMLCanvasElement;
        this.Canvas.addEventListener("touchstart", this.TouchHandler.bind(this));
        this.Canvas.addEventListener("touchmove", this.TouchHandler.bind(this));
        this.Canvas.addEventListener("touchcancel", this.TouchHandler.bind(this));
        this.Canvas.addEventListener("touchend", this.TouchHandler.bind(this));

        let rect = this.Canvas.getBoundingClientRect();
        let width = rect.width * window.devicePixelRatio;
        let height = rect.height * window.devicePixelRatio;
        if (height <= 0)
            height = width;

        this.Canvas.style.width = width.toString();
        this.Canvas.style.height = height.toString();
        this.Canvas.width  = width;
        this.Canvas.height = height;
        this.Ctx = this.Canvas.getContext('2d');

        this.DisplayHeight = Math.trunc(height * 9 / 10);
        this.Padding = this.DisplayHeight / 10;
        let FontSize = 0.1;
        this.Ctx.font = this.SetFontSize(FontSize);
        let TextWidth = this.Ctx.measureText(this.MaxValue + "").width;

        if (TextWidth > width)
        {
            this.Ctx.font = this.SetFontSize(FontSize * (width - this.Padding * 2)/TextWidth);
            TextWidth = width - this.Padding * 2;
        }
        this.ItemHeight = TextWidth;

        this.Ox = width/2;
        this.Oy = Math.trunc(this.DisplayHeight / 2 + this.Padding);
        this.ViewInited = true;

        setTimeout(() => this.Paint(), 0);
    }

    private Paint()
    {
        if (! this.ViewInited)
            return;

        this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        let Offset = this.ScrollingY % this.ItemHeight + this.Padding;
        let Idx = Math.trunc(-this.ScrollingY / this.ItemHeight);

        let CenterItemRect = this.GetCenterItemRect();
        let Count = Math.trunc(this.DisplayHeight / this.ItemHeight) + Idx;
        console.log("ScrollingY:" + this.ScrollingY + "  Idx:" + Idx + "  ItemHeight" + this.ItemHeight + "  Count:" + Count);

        for (let i = Idx; i >= 0 && i < Count; i++)
        {
            Offset += this.ItemHeight;
            this.Ctx.textBaseline = 'middle';
            this.Ctx.textAlign = 'center';

            if (Offset >= CenterItemRect.top && Offset <= CenterItemRect.bottom)
            {
                this.Ctx.globalAlpha = 1;
                this.Ctx.font = this.SetFontSize(0.2);
                this.Ctx.fillStyle = "#ff0000"
            }
            else
            {
                let Alpha = Offset / this.DisplayHeight;
                this.Ctx.fillStyle = "#000000";
                let SizeOffest = 0.1 * Alpha * Alpha;
                //console.log("SizeOffest:" + SizeOffest);

                if (Offset <= CenterItemRect.top)
                {
                    this.Ctx.font = this.SetFontSize(0.1 + SizeOffest);
                    this.Ctx.globalAlpha = 0.1 + Alpha * Alpha;
                }
                else if (Offset >= CenterItemRect.bottom)
                {
                    this.Ctx.font = this.SetFontSize(0.2 - SizeOffest);
                    this.Ctx.globalAlpha = 1 - Alpha * Alpha;
                }
            }

            this.Ctx.fillText(i + "", this.Ox, Offset);
        }
    }

    private GetCenterItemRect()
    {
        let count = Math.trunc(this.DisplayHeight / this.ItemHeight);
        let rect = {left: 0, right: 0, top: 0, bottom: 0};
        if ((count % 2) === 0)
        {
            rect.top = this.Oy - this.ItemHeight;
            rect.bottom = this.Oy;
        }
        else
        {
            rect.top = this.Oy - this.ItemHeight / 2;
            rect.bottom = this.Oy + this.ItemHeight / 2;
        }

        rect.left = 0;
        rect.right = this.Canvas.width;

        return rect;
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

        switch (ev.type)
        {
        case 'touchstart':
            this.Darging = true;
            break;

        case 'touchmove':
            if (!this.Darging)
                return;

            this.ScrollingY = this.ScrollingY + (t.clientY - this.RelativeO.clientY) * 1.5 * window.devicePixelRatio;
            this.Paint();
            break;

        case 'touchcancel':
        case 'touchend':
            this.Darging = false;
            break;
        }

        if (ev.type === 'touchend')
            this.RelativeO = null
        else
            this.RelativeO = ev.touches[0];
    }


    private SetFontSize(size: number, iconFont: boolean = false): string
    {
        return (this.Canvas.width * size + 'px ' + (iconFont ? 'Thundericons' : 'arial')).toString();
    }

    @Input()
    set Min(min: number)
    {
        this.MinValue = min;
    }

    @Input()
    set Max(max: number)
    {
        this.MaxValue = max;
    }

    @Input()
    set Progress(Progress: number)
    {
        console.log("value:" + Progress + "  ViewInited:" + this.ViewInited + "  MinValue" + this.MinValue + "  MaxValue" + this.MaxValue);

        if (this.CurrrentValue === Progress)
            return;
        else
            this.CurrrentValue = Progress; //界面未初始化好 先保存传进来的值

        if (this.MinValue <= Math.trunc(Progress) && Math.trunc(Progress) <= this.MaxValue)
            this.Paint();
    }

    @Output() OnValueChanged: EventEmitter<any> = new EventEmitter();

    private ViewInited: boolean = false;

    private MinValue: number = 0;
    private MaxValue: number = 100;

    private Ox: number;
    private Oy: number;
    private ItemHeight: number = 0;
    private DisplayHeight: number = 0;
    private Padding: number = 0;
    private ScrollingY = 0;

    private RelativeO: Touch;
    private Darging = false;
    private CurrrentValue: number = 0;
    private Ctx: CanvasRenderingContext2D;
    private Canvas: HTMLCanvasElement;
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
