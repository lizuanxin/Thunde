import {Component, OnInit, OnDestroy, DoCheck, Input, Output, EventEmitter, ElementRef} from '@angular/core'

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import {UITypes} from '../UltraCreation/Graphic';

import * as Svc from '../providers';

const SHOWING_ITEM_COUNT = 6;

@Component({selector: 'filelist-dial', template: '<canvas style="width:100%" tappable></canvas>'})
export class FileListDialComp implements OnInit, OnDestroy, DoCheck
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {
    }

    ngOnInit()
    {
        let Canvas = this.Elements.nativeElement.children[0] as HTMLCanvasElement;
        this.Content = new TContentCanvas(Canvas, this.app, this.OnSelection);
    }

    ngOnDestroy(): void
    {
        this.Content.Disponse();
        this.Content = null;
    }

    ngDoCheck()
    {
        if (TypeInfo.Assigned(this.FileList))
            this.Content.NewFileList(this.FileList);
    }

    @Input() FileList: Svc.TScriptFileList
    @Output() OnSelection = new EventEmitter<Svc.TScriptFile>();

    private Content: TContentCanvas;
}

/* TContentCanvas */

class TContentCanvas
{
    constructor(private Canvas: HTMLCanvasElement, private app: Svc.TApplication,
        private OnSelection: EventEmitter<Svc.TScriptFile>)
    {
        Canvas.addEventListener("touchstart", this.TouchHandler.bind(this));
        Canvas.addEventListener("touchmove", this.TouchHandler.bind(this));
        Canvas.addEventListener("touchcancel", this.TouchHandler.bind(this));
        Canvas.addEventListener("touchend", this.TouchHandler.bind(this));

        Canvas.addEventListener("click", this.Click.bind(this));

        let width = window.innerWidth;
        let height = window.innerHeight;

        Canvas.style.width = width.toString();
        Canvas.style.height = height.toString();
        Canvas.width = width * window.devicePixelRatio;
        Canvas.height = height * window.devicePixelRatio;

        this.DisplayHeight = Math.trunc(window.innerHeight * window.devicePixelRatio * 7 / 10);
        this.Padding = this.DisplayHeight / 10;
        this.ItemHeight = (this.DisplayHeight - this.Padding) / SHOWING_ITEM_COUNT;

        this.Ctx = Canvas.getContext('2d');
        this.Ctx.font = this.IconFont.toString();

        this.Ox = 0;
        this.Oy = Math.trunc(this.DisplayHeight / 2 + this.Padding);
        this.Radius = Math.trunc(this.Canvas.width * 2 / 5);
        if (this.Radius < this.Oy)
        {
            this.Ox = this.Radius - this.Oy;
            this.Radius = Math.trunc(this.Oy * 9 / 10);
        }
    }

    Disponse()
    {
        this.OnSelection.unsubscribe();
    }

    get Color(): string
    {
        return this.Ctx.fillStyle as string;
    }

    set Color(Value: string)
    {
        this.Ctx.fillStyle = Value;
    }

    NewFileList(FileList: Svc.TScriptFileList)
    {
        if (FileList === this.FileList)
            return;

        this.ScrollingY = 0;
        this.ScrollMaxY = (FileList.length - SHOWING_ITEM_COUNT) * this.ItemHeight + this.ItemHeight / 5;

        this.FileList = FileList;
        this.Paint();
    }

    Paint()
    {
        this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        this.Ctx.globalAlpha = 1.0;

        this.PaintTo(this.Canvas, this.Ctx);
    }

    PaintTo(Canvas: HTMLCanvasElement, Ctx: CanvasRenderingContext2D)
    {
        if (this.app.SkinColor !== undefined)
        {
            Ctx.strokeStyle = '#000000';
            Ctx.fillStyle = '#F2F2F2';
        }
        else
        {
            Ctx.strokeStyle = '#FFFFFF';
            Ctx.fillStyle = '#222222';
        }

        let Offset = this.ScrollingY % this.ItemHeight + this.Padding;
        let Idx = Math.trunc(-this.ScrollingY / this.ItemHeight);
        Ctx.globalAlpha = 1;

        for (let i = Idx; i < this.FileList.length; i++)
        {
            if (i < 0) {
                Offset += this.ItemHeight;
                continue;
            }

            let ScriptFile = this.FileList[i];

            // click area baseline
            Ctx.globalAlpha = 0.1;
            Ctx.beginPath();
            Ctx.moveTo(0, Offset);
            Ctx.lineTo(Canvas.width, Offset);

            Ctx.closePath();
            Ctx.lineWidth = 3;

            Ctx.stroke();

            Offset += this.ItemHeight / 2;
            let b = (this.Oy - Offset);
            let x = Math.sqrt(this.Radius * this.Radius - b * b) + this.Ox;

            if (Offset < this.Padding)
            {
                Ctx.globalAlpha = Offset / this.Padding;
                Ctx.globalAlpha *= Ctx.globalAlpha * Ctx.globalAlpha;
            }
            else if (Offset > this.DisplayHeight)
            {
                Ctx.globalAlpha = (Canvas.height - Offset) / (Canvas.height - this.DisplayHeight);
                Ctx.globalAlpha *= Ctx.globalAlpha * Ctx.globalAlpha;
            }
            else
                Ctx.globalAlpha = 1.0;

            Ctx.textBaseline = 'bottom';
            Ctx.textAlign = 'left';
            Ctx.font = this.IconFont.toString();

            let Str: string = String.fromCharCode(0xE904);

            Ctx.lineWidth = 1;
            // Ctx.strokeText(Str, x, Offset);
            Ctx.fillText(Str, x, Offset);
            let TextWidth = Ctx.measureText(Str).width * 2;

            // file name
            Ctx.textBaseline = 'bottom';
            Ctx.textAlign = 'left';
            Ctx.font = this.FileNameFont.toString();

            Str = this.app.Translate(ScriptFile.Name_LangId) as string;
            x += TextWidth * 1.2;
            // Ctx.strokeText(Str, x, Offset);
            Ctx.fillText(Str, x, Offset);

            // minute
            Ctx.textAlign = 'right'
            Ctx.textBaseline = "top"
            Ctx.font = this.MinuteFont.toString();

            Str = Math.trunc((ScriptFile.Duration + 30) / 60).toString() + this.app.Translate('hint.min');
            TextWidth = this.Ctx.measureText('H').width;
            Ctx.fillText(Str, Canvas.width - TextWidth * 3.5, Offset);
            // minute pie
            ScriptFile.DrawMinute(Canvas, Ctx, TextWidth, Canvas.width - TextWidth * 2, Offset);

            Offset += this.ItemHeight / 2;
        }
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
            if (! this.Darging)
                return;

            this.ScrollingY += (t.clientY - this.RelativeO.clientY) * 1.5 * window.devicePixelRatio;

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

    private Click(ev: MouseEvent)
    {
        let Offset = ev.offsetY * window.devicePixelRatio;

        let Idx = Math.trunc((Offset - this.ScrollingY - this.Padding) / this.ItemHeight);
        if (Idx >= 0 && Idx < this.FileList.length)
            this.OnSelection.emit(this.FileList[Idx]);
    }

    IconFont = new UITypes.TFont('Thundericons', 10, UITypes.TFontStyle.Normal, UITypes.TFontWeight.Bold);
    FileNameFont = new UITypes.TFont('brandontext_normal', 16, UITypes.TFontStyle.Normal, UITypes.TFontWeight.Bold);
    FileDescFont = new UITypes.TFont('brandontext_normal', 8, UITypes.TFontStyle.Italic);
    MinuteFont = new UITypes.TFont('brandontext_normal', 8);

    private Ctx: CanvasRenderingContext2D;

    private Padding;
    private Ox: number;
    private Oy: number;
    private Radius: number;
    private ItemHeight;
    private DisplayHeight;

    private FileList: Svc.TScriptFileList = [];
    private ScrollingY = 0;
    private ScrollMaxY = 0;

    private RelativeO: Touch;
    private Darging = false;
}
