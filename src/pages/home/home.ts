import {Component, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {NavController, MenuController, Platform} from 'ionic-angular';
import {TypeInfo} from '../../UltraCreation/Core'
import * as UITypes from '../../UltraCreation/Graphic/Types'

import {const_data, TApplication, TAssetService, TCategory, TScriptFile, TDistributeService} from '../services';
import {DemoPage} from '../demo/demo';
import {TouPage} from '../tou/tou';
import {GoPage} from '../go/go';

const SHOWING_ITEM_COUNT = 6;

@Component({selector: 'page-home', templateUrl: 'home.html'})
export class HomePage implements OnInit, OnDestroy
{
    constructor( private platform: Platform, private app: TApplication, public nav: NavController, private MenuCtrl: MenuController,
        private Asset: TAssetService, private Distrubute: TDistributeService)
    {
    }

    ngOnInit(): void
    {
        let Canvas = document.getElementById('content_canvas') as HTMLCanvasElement;
        this.Content = new TContentCanvas(Canvas, this.app);
        this.Content.OnSelectionFile.subscribe(file => this.SelectFile(file));

        this.Categories = this.Asset.Categories;

        if (! this.app.AcceptedTerms)
        {
            this.ShowTOU()
                .then(() => this.app.IsSupportedOTG())
                .then(support_otg =>
                {
                    if (! support_otg)
                    {
                        this.app.ShowAlert({title: 'OTG', message: this.app.Translate('hint.e_usb_otg') as string,
                            buttons: [{text: this.app.Translate('button.ok') as string, role: 'cancel'}]});
                    }
                });
        }
    }

    ngOnDestroy(): void
    {
        this.Content.Disponse();
        this.Content = null;
    }

    ionViewWillEnter()
    {
        if (TypeInfo.Assigned(this.SelectedCategory) && this.SelectedCategory.Id !== const_data.Category.therapy.Id)
        {
            switch (this.SelectedCategory.Id)
            {
            case const_data.Category.fat_burning.Id:
                this.app.SetSkin(this.app.Skins[3]);
                break;
            case const_data.Category.muscle_training.Id:
                this.app.SetSkin(this.app.Skins[2]);
                break;
            case const_data.Category.relax.Id:
                this.app.SetSkin(this.app.Skins[0]);
                break;
            }
        }
    }

    ionViewDidEnter()
    {
        if (this.app.SkinColor !== undefined)
            this.Content.Color = '#F2F2F2';
        else
            this.Content.Color = '#222222';

        if (!TypeInfo.Assigned(this.SelectedCategory))
        {
            this.SelectCategory(this.Categories[0]);
            this.Content.Paint();
        }
        else
            this.Content.Paint();
    }

    SelectCategory(Category: TCategory)
    {
        this.SelectedCategory = Category;
        this.Asset.FileList(Category.Id)
            .then(List =>
            {
                this.FileList = List;
                this.Content.NewFileList(List);

                switch (Category.Id)
                {
                case const_data.Category.therapy.Id:                   
                    this.app.SetSkin(this.app.Skins[1]);
                    break;
                case const_data.Category.fat_burning.Id:                    
                    this.app.SetSkin(this.app.Skins[3]);
                    break;
                case const_data.Category.muscle_training.Id:                     
                    this.app.SetSkin(this.app.Skins[2]);
                    break;
                case const_data.Category.relax.Id:                    
                    this.app.SetSkin(this.app.Skins[0]);                   
                    break;
                }

                this.ionViewDidEnter();
            })
            .catch(err => console.log(err));
    }

    ShowDemo()
    {
        this.MenuCtrl.close()
            .then(() => this.nav.push(DemoPage))
    }

    ShowTOU()
    {
        return this.MenuCtrl.close()
            .then(() => this.nav.push(TouPage));
    }

    StateCategory(Category: TCategory)
    {
        if (Category === this.SelectedCategory)
            return "state";
    }

    SelectFile(ScriptFile: TScriptFile)
    {
        this.Asset.FileDesc(ScriptFile)
            .then(() => this.nav.push(GoPage, { Category: this.SelectedCategory, ScriptFile: ScriptFile}));
    }


    Categories: Array<TCategory>;
    FileList: Array<TScriptFile> = [];

    SelectedCategory: TCategory;
    Content: TContentCanvas;
}

/* TContentCanvas */

class TContentCanvas
{
    constructor(private Canvas: HTMLCanvasElement, private app: TApplication)
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
        this.OnSelectionFile.unsubscribe();
    }

    get Color(): string
    {
        return this.Ctx.fillStyle as string;
    }

    set Color(Value: string)
    {
        this.Ctx.fillStyle = Value;
    }

    NewFileList(FileList: Array<TScriptFile>)
    {
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
            if (this.app.SkinColor !== undefined)
                Ctx.strokeStyle = '#000000';
            else
                Ctx.strokeStyle = '#FFFFFF';
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
            this.DrawMinute(Canvas, Ctx, [1.75, ScriptFile.Duration / 3600], TextWidth, Canvas.width - TextWidth * 2, Offset);

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
            if (!this.Darging)
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
            this.OnSelectionFile.emit(this.FileList[Idx]);
    }

    /**
     *  https://en.wikipedia.org/wiki/Degree_(angle)
     *  https://en.wikipedia.org/wiki/Radian
     *  http://www.w3schools.com/tags/canvas_arc.asp
     *
     *  turn[0.0~1.0]   degree[0°~360°]     radian[0~2π]:
     *      90°         = 0.25 turn         = 0.5π
     *      180°        = 0.5 turn          = 1π
     *      360°        = 1 turn            = 2π
     **/
    private DrawMinute(Canvas: HTMLCanvasElement, Ctx: CanvasRenderingContext2D,
        Turns: number[], Radius: number, Ox: number, Oy: number)
    {
        let RestoreFillStyle = Ctx.fillStyle;

        let ColorFills: string[] = [null, Ctx.fillStyle as string];

        Ctx.beginPath();
        Ctx.moveTo(Ox, Oy);
        Ctx.arc(Ox, Oy, Radius, 0, 2 * Math.PI);
        Ctx.closePath();

        let Alpha = Ctx.globalAlpha;
        Ctx.globalAlpha = Alpha * 0.15;
        Ctx.fillStyle = ColorFills[1];
        Ctx.lineWidth = 1;
        Ctx.fill();

        Ctx.globalAlpha = Alpha;

        for (let i = 0, StartArc = 0, EndArc = 0; i < Turns.length; i++ , StartArc = EndArc)
        {
            EndArc = EndArc + Turns[i] * Math.PI * 2;

            Ctx.beginPath();
            Ctx.moveTo(Ox, Oy);
            Ctx.arc(Ox, Oy, Radius, StartArc, EndArc);
            Ctx.closePath();

            if (TypeInfo.Assigned(ColorFills[i]))
            {
                Ctx.fillStyle = ColorFills[i];
                Ctx.fill();
            }
        }

        Ctx.fillStyle = RestoreFillStyle;
    }

    IconFont = new UITypes.TFont('Thundericons', 10, UITypes.TFontStyle.Normal, UITypes.TFontWeight.Bold);
    FileNameFont = new UITypes.TFont('brandontext_normal', 16, UITypes.TFontStyle.Normal, UITypes.TFontWeight.Bold);
    FileDescFont = new UITypes.TFont('brandontext_normal', 8, UITypes.TFontStyle.Italic);
    MinuteFont = new UITypes.TFont('brandontext_normal', 8);

    OnSelectionFile = new EventEmitter<TScriptFile>();

    private Ctx: CanvasRenderingContext2D;

    private Padding;
    private Ox: number;
    private Oy: number;
    private Radius: number;
    private ItemHeight;
    private DisplayHeight;

    private FileList: Array<TScriptFile> = [];
    private ScrollingY = 0;
    private ScrollMaxY = 0;

    private RelativeO: Touch;
    private Darging = false;
}
