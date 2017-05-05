import {Component, OnInit, Input, Output, EventEmitter, ElementRef} from '@angular/core';

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';

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

        this.Canvas.addEventListener("click", this.Click.bind(this));

        let rect = this.Canvas.getBoundingClientRect();
        let width = rect.width * window.devicePixelRatio;
        this.DisplayHeight = rect.height * window.devicePixelRatio;
        if (this.DisplayHeight <= 0)
            this.DisplayHeight = width;

        this.Canvas.style.width = width.toString();
        this.Canvas.style.height = this.DisplayHeight.toString();
        this.Canvas.width  = width;
        this.Canvas.height = this.DisplayHeight;
        this.Ctx = this.Canvas.getContext('2d');

        this.Ctx.textBaseline = 'middle';
        this.Ctx.textAlign = 'center';
        this.Ctx.font = this.FontSize(0.06);
        this.ItemHeight = Math.trunc(this.Ctx.measureText('H').width * 3);
        console.log("DisplayHeight:" + this.DisplayHeight + "ItemHeight:" + this.ItemHeight);

        this.Ox = width / 2;
        this.Oy = Math.trunc(this.DisplayHeight / 2);

        setTimeout(() => this.Paint(), 0);
    }

    private Paint()
    {
        if (! this.Ctx || this.DataArray.length <= 0)
            return;

        this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        let StartY = Math.trunc(this.Oy - this.ItemHeight * (this.ShowItemCount - 1)/2);
        let Offset = Math.trunc(this.ScrollingY % this.ItemHeight) + StartY;
        let Idx = Math.trunc(-this.ScrollingY / this.ItemHeight);

        let CenterItemRect = this.CenterItemRect();
        let Count = this.ShowItemCount + Idx;
        console.log("ScrollingY:" + this.ScrollingY + "  Idx:" + Idx + "  ItemHeight" + this.ItemHeight + "  Count:" + Count + "  Offset:" + Offset);

        let Alpha = 1;
        let Font = this.FontSize(0.1);
        let FontOffset = 0;
        let FillStyle = "#ff0000";

        for (let i = Idx; i >= 0 && i < Count; i++)
        {
            if (Offset >= CenterItemRect.top && Offset <= CenterItemRect.bottom)
            {
                Alpha = 1;
                Font = this.FontSize(0.1);
                FillStyle = "#ff0000";
            }
            else
            {
                Alpha = Offset / this.DisplayHeight;
                FillStyle = "#000000";
                FontOffset = 0.1 * Alpha * Alpha;

                if (Offset <= CenterItemRect.top)
                {
                    Font = this.FontSize(0.05 + FontOffset);
                    Alpha = 0.1 + Alpha * Alpha;
                }
                else if (Offset >= CenterItemRect.bottom)
                {
                    Font = this.FontSize(0.1 - FontOffset);
                    Alpha = 1 - Alpha * Alpha;
                }
            }

            this.DrawText(this.DataArray[i],
            {
                x: this.Ox,
                y: Offset,
                font: Font,
                fillStyle: FillStyle,
                globalAlpha: Alpha
            });

            Offset += this.ItemHeight;
        }
    }

    private CenterItemRect()
    {
        let rect = {left: 0, right: 0, top: 0, bottom: 0};
        rect.top = this.Oy - this.ItemHeight / 2;
        rect.bottom = this.Oy + this.ItemHeight / 2;
        rect.left = 0;
        rect.right = this.Canvas.width;

        return rect;
    }

    private DrawText(value: string, option: ICanvasDrawOption)
    {
        this.Ctx.save();
        this.Ctx.fillStyle = option.fillStyle;
        this.Ctx.font = option.font;
        this.Ctx.globalAlpha = option.globalAlpha;

        this.Ctx.fillText(value, option.x, option.y);
        this.Ctx.restore();
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
            if (this.ScrollingY < -this.ScrollMaxY)
                this.ScrollingY = -this.ScrollMaxY;
            if (this.ScrollingY > 0)
                this.ScrollingY = 0;

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

    private FontSize(size: number, iconFont: boolean = false): string
    {
        return (this.Canvas.width * size + 'px ' + (iconFont ? 'Thundericons' : 'arial')).toString();
    }

    private Click(ev: MouseEvent)
    {
        let Offset = ev.offsetY * window.devicePixelRatio;

        let Idx = Math.trunc((Offset - this.ScrollingY) / this.ItemHeight);
        if (Idx >= 0 && Idx < this.DataArray.length)
            this.OnDataSelelcted.emit(Idx);
    }

    @Input()
    set Datas(Values: Array<string>)
    {
        if (! TypeInfo.Assigned(Values))
            return;

        if (Values === this.DataArray)
            return;

        this.DataArray = Values;
        this.ScrollMaxY = this.ItemHeight * (this.DataArray.length - this.ShowItemCount);
        this.Paint();
    }

    @Output() OnDataSelelcted: EventEmitter<number> = new EventEmitter();

    private ShowItemCount = 3;
    private Ox: number;
    private Oy: number;
    private ItemHeight: number = 0;
    private DisplayHeight: number = 0;
    private ScrollingY = 0;
    private ScrollMaxY = 0;

    private RelativeO: Touch;
    private Darging = false;
    private Ctx: CanvasRenderingContext2D;
    private Canvas: HTMLCanvasElement;

    private DataArray: Array<string> = [];
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
    strokeStyle?: any,
    fillStyle?: string
}
