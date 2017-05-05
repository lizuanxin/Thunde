import {Component, OnInit, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {TypeInfo} from '../UltraCreation/Core/TypeInfo';

import * as Svc from '../providers'
import {SwiperComp} from './Swiper'

@Component({selector: 'filelist-body', templateUrl: `FileListBody.html`})
export class FileListBodyComp implements OnInit
{
    constructor()
    {
    }

    ngOnInit()
    {
        this.BodyCategories.push(
            new TBodyCategory(0xE93E, Svc.const_data.BodyCategory.back));
        this.BodyCategories.push(
            new TBodyCategory(0xE941, Svc.const_data.BodyCategory.forelimb));
        this.BodyCategories.push(
            new TBodyCategory(0xE945, Svc.const_data.Body.waist, /*Svc.const_data.Body.abdomen, */Svc.const_data.Body.buttock));
        this.BodyCategories.push(
            new TBodyCategory(0xE942, Svc.const_data.BodyCategory.lowerlimb, Svc.const_data.Body.foot));
        this.BodyCategories.push(
            new TBodyCategory(0xE944, Svc.const_data.BodyCategory.joint));

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

    @Output() OnSelection = new EventEmitter<Svc.TScriptFile>();

    SelectBody(b: TBodyCategory)
    {
        this.Swiper.Update();

        this.SelectedBody = b;
        this._FilteredFiles = [];
    }

    UsageSwiperChanged(ev: Swiper)
    {
        this._FilteredFiles = [];
    }

    get FilteredFiles(): Svc.TScriptFileList
    {
        if (! TypeInfo.Assigned(this._FileList))
            return [];

        if (this._FilteredFiles.length === 0)
        {
            let Idx = this.Swiper.Instance.activeIndex;
            let BodyPart = this.SelectedBody.SwiperBodyPart(Idx);
            if (! TypeInfo.Assigned(BodyPart))
                return;

            for (let f of this._FileList)
            {
                for (let b of f.BodyParts)
                {
                    if (b.Id === BodyPart.Id)
                    {
                        this._FilteredFiles.push(f);
                        break;
                    }
                }
            }
        }

        return this._FilteredFiles;
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

    private BodyCategories = new Array<TBodyCategory>();
    private SelectedBody: TBodyCategory;

    @ViewChild(SwiperComp) private Swiper: SwiperComp;
    private _FileList?: Svc.TScriptFileList;
    private _FilteredFiles: Svc.TScriptFileList = [];
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
                this.BodyParts.push(arg as Svc.IBodyPart);

                for (let icon of JSON.parse((arg as Svc.IBodyPart).Desc))
                {
                    this.UsageIcons.push(icon);
                    this._UsageIconBodyPart.set(icon, arg as Svc.IBodyPart)
                }
            }
        }
    };

    SwiperBodyPart(Idx: number): Svc.IBodyPart
    {
        let Icon = this.UsageIcons[Idx];
        return this._UsageIconBodyPart.get(Icon);
    }

    UsageIcons = new Array<number>();
    BodyParts = new Array<Svc.IBodyPart>();
    private _UsageIconBodyPart = new Map<number, Svc.IBodyPart>();
}
