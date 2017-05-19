import {Component, Input, ElementRef} from '@angular/core'
import {TypeInfo} from "../UltraCreation/Core/TypeInfo";

import * as Svc from '../providers/application';

@Component({selector: 'file-duration', template: '<canvas style="width:100%; heigth:100%"></canvas>'})
export class FileDurationComp
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {
    }

    ngAfterViewInit()
    {
        this.Canvas = this.Elements.nativeElement.children[0] as HTMLCanvasElement;

        let rect = this.Elements.nativeElement.parentElement.getBoundingClientRect();
        let width = rect.width * window.devicePixelRatio;
        let height = rect.height * window.devicePixelRatio;

        this.Canvas.style.width = width.toString();
        this.Canvas.style.height = height.toString();
        this.Canvas.width = width;
        this.Canvas.height = height;

        this.Ox = width / 2;
        this.Oy = height / 2;
        if (height === 0)
            this.Oy = width / 2;

        this.Radius = width / 2;
        if (height !== 0 && height < width)
            this.Radius = height / 2;

        this.Ctx = this.Canvas.getContext('2d');
        setTimeout(() => this.DrawMinute(this.Time * 60, this.Radius, this.Ox, this.Oy), 0);
    }

    @Input() set Duration(Value: number)
    {
        this.Time = Value;

        if(TypeInfo.Assigned(this.Ctx))
            this.DrawMinute(this.Time * 60, this.Radius, this.Ox, this.Oy);
    }

    private Time: number = 0;
    private Ox: number = 0;
    private Oy: number = 0;
    private Radius: number = 0;
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
    DrawMinute(Minute: number, Radius: number, Ox: number, Oy: number)
    {
        this.Ctx.fillStyle = this.BackgroundColor;
        this.Ctx.lineWidth = 1;

        this.Ctx.beginPath();
        this.Ctx.moveTo(Ox, Oy);
        this.Ctx.arc(Ox, Oy, Radius, -0.5 * Math.PI, 1.5 * Math.PI);
        this.Ctx.globalAlpha = 0.15;
        this.Ctx.fill();

        this.Ctx.beginPath();
        this.Ctx.moveTo(Ox, Oy);
        this.Ctx.arc(Ox, Oy, Radius, -0.5 * Math.PI,  Math.PI*(2 *(Minute/3600) - 0.5));
        this.Ctx.globalAlpha = 1;
        this.Ctx.fill();
    }

    private BackgroundColor: string = "#d3120b";
    private Canvas: HTMLCanvasElement;
    private Ctx: CanvasRenderingContext2D;
}
