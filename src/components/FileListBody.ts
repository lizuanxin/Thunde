import {Component, OnInit, ViewChild, Input, Output, EventEmitter, ElementRef} from '@angular/core';
import {Slides} from 'ionic-angular'
import {TypeInfo} from '../UltraCreation/Core/TypeInfo';

import * as Svc from '../providers'

@Component({
  selector: 'filelist-body',
  template: `
    <ion-row [ngStyle]="VslideH" margin-top>
        <ion-col col-12 no-padding>
            <section Flip-x [class.Filped]="ISFlip">
                <ion-slides [ngStyle]="SetStyle(0)" (ionSlideDidChange)="SlideChanged()">
                    <ion-slide *ngFor="let i of SelectedBody.UsageIcons">
                        <ion-icon app-icon [ngStyle]="SetStyle(1)">{{app.IconFont(i)}}</ion-icon>
                    </ion-slide>
                </ion-slides>
            </section>
            <ion-row RSideTop justify-content-end [class.slideIn]="ISFlip">
                <ion-col *ngFor="let i of SelectedBody.UsageIcons" col-2 text-center>
                    <div><ion-icon app-icon>{{app.IconFont(i)}}</ion-icon></div>
                </ion-col>
            </ion-row>
        </ion-col>

        <ion-col col-10 offset-1 no-padding>
            <ion-row VSideLeft nowrap>
                <ion-col no-padding text-center [class.active]="SelectedBody===b" *ngFor="let b of BodyCategories" (click)="SelectBody(b)" tappable>
                    <button><span app-icon [innerHTML]="app.IconFont(b.Icon)"></span></button>
                </ion-col>
            </ion-row>
        </ion-col>

        <ion-col col-12 no-padding text-center margin-top>
            <li *ngFor="let f of FilterFiles">{{'scriptfile.'+f.Name|translate}}</li>
        </ion-col>
    </ion-row>`,
})
export class FileListBody implements OnInit
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {

    }

    ngOnInit()
    {
        this.BodyCategories.push(
            new TBodyCategory(0xE93E, Svc.const_data.BodyCategory.back));
        this.BodyCategories.push(
            new TBodyCategory(0xE941, Svc.const_data.BodyCategory.forelimb));
        this.BodyCategories.push(
            new TBodyCategory(0xE900, Svc.const_data.Body.waist, /*Svc.const_data.Body.abdomen, */Svc.const_data.Body.buttock));
        this.BodyCategories.push(
            new TBodyCategory(0xE942, Svc.const_data.BodyCategory.lowerlimb, Svc.const_data.Body.foot));
        this.BodyCategories.push(
            new TBodyCategory(0xE900, Svc.const_data.BodyCategory.joint));

        this.SelectBody(this.BodyCategories[0]);
    }

    @Input() set FileList(Value: Svc.TScriptFileList)
    {
        if (! TypeInfo.Assigned(Value))
            return;
        if (Value === this._FileList)
            return;
        this._FileList = Value;
    }

    @Output() OnSelectionFile = new EventEmitter<Svc.TScriptFile>();

    SelectBody(b: TBodyCategory)
    {
        this.SelectedBody = b;
        this.SelectedFileList = [];
    }

    SlideChanged()
    {
        if (this.Slides.getActiveIndex() < this.SelectedBody.UsageIcons.length)
            this.SelectedFileList = [];
    }

    get FilterFiles(): Svc.TScriptFileList
    {
        if (! TypeInfo.Assigned(this._FileList))
            return [];

        if (this.SelectedFileList.length === 0)
        {
            let SlideIdx = this.Slides.getActiveIndex();
            let BodyPart = this.SelectedBody.SlideBodyPart(SlideIdx);
            if (! TypeInfo.Assigned(BodyPart))
                return;

            for (let f of this._FileList)
            {
                for (let b of f.BodyParts)
                {
                    if (b.Id === BodyPart.Id)
                    {
                        this.SelectedFileList.push(f);
                        break;
                    }
                }
            }
        }

        return this.SelectedFileList;
    }

    SetStyle(n: number): Object
    {
        switch(n)
        {
            case 0: return { height: Math.ceil(window.innerHeight * 0.38) + 'px' }
            case 1: return { fontSize: Math.ceil(window.innerWidth * 0.45) + 'px' }
            case 2: return { height: '150px' }
            case 3: return { fontSize: Math.ceil(window.innerWidth * 0.06) + 'px' }
        }
    }

    @ViewChild(Slides) private Slides: Slides;
    BodyCategories = new Array<TBodyCategory>();
    SelectedBody: TBodyCategory;
    SelectedFileList: Svc.TScriptFileList = [];

    private _FileList?: Svc.TScriptFileList;
}

class TBodyCategory
{
    constructor (public Icon: number, ...BodyParts: (Array<Svc.IBodyPart> | Svc.IBodyPart)[])
    {
        for (let arg of BodyParts)
        {
            if (TypeInfo.IsArrayLike(arg))
            {
                for (let b of arg as Array<Svc.IBodyPart>)
                {
                    this.BodyParts.push(b);
                    for (let icon of JSON.parse(b.Desc))
                    {
                        this.UsageIcons.push(icon);
                        this._UsageIconBodyPart.set(icon, b)
                    }
                }
            }
            else
            {
                console.log(arg);

                this.BodyParts.push(arg as Svc.IBodyPart);

                for (let icon of JSON.parse((arg as Svc.IBodyPart).Desc))
                {
                    this.UsageIcons.push(icon);
                    this._UsageIconBodyPart.set(icon, arg as Svc.IBodyPart)
                }
            }
        }
    };

    SlideBodyPart(Idx: number): Svc.IBodyPart
    {
        let Icon = this.UsageIcons[Idx];
        return this._UsageIconBodyPart.get(Icon);
    }

    UsageIcons = new Array<number>();
    BodyParts = new Array<Svc.IBodyPart>();
    private _UsageIconBodyPart = new Map<number, Svc.IBodyPart>();
}
