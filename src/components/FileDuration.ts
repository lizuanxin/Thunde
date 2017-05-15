import {Component, OnInit, Input, ElementRef} from '@angular/core'
import {TypeInfo} from "../UltraCreation/Core/TypeInfo";

import * as Svc from '../providers/application';

@Component({selector: 'file-duration', template: '<canvas></canvas>'})
export class FileDurationComp implements OnInit
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {
    }

    ngOnInit()
    {
        this.Canvas = this.Elements.nativeElement.children[0] as HTMLCanvasElement;
        this.Ctx = this.Canvas.getContext('2d');
    }

    @Input() Duration: number;


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
    DrawMinute(Radius: number, Ox: number, Oy: number)// , Turns: number[])
    {
        let RestoreFillStyle = this.Ctx.fillStyle;
        let Turns = [1.75, this.Duration / 3600];

        let ColorFills: string[] = [null, this.Ctx.fillStyle as string];

        this.Ctx.beginPath();
        this.Ctx.moveTo(Ox, Oy);
        this.Ctx.arc(Ox, Oy, Radius, 0, 2 * Math.PI);
        this.Ctx.closePath();

        let Alpha = this.Ctx.globalAlpha;
        this.Ctx.globalAlpha = Alpha * 0.15;
        this.Ctx.fillStyle = ColorFills[1];
        this.Ctx.lineWidth = 1;
        this.Ctx.fill();

        this.Ctx.globalAlpha = Alpha;

        for (let i = 0, StartArc = 0, EndArc = 0; i < Turns.length; i++ , StartArc = EndArc)
        {
            EndArc = EndArc + Turns[i] * Math.PI * 2;

            this.Ctx.beginPath();
            this.Ctx.moveTo(Ox, Oy);
            this.Ctx.arc(Ox, Oy, Radius, StartArc, EndArc);
            this.Ctx.closePath();

            if (TypeInfo.Assigned(ColorFills[i]))
            {
                this.Ctx.fillStyle = ColorFills[i];
                this.Ctx.fill();
            }
        }

        this.Ctx.fillStyle = RestoreFillStyle;
    }

    private Canvas: HTMLCanvasElement;
    private Ctx: CanvasRenderingContext2D;
}
