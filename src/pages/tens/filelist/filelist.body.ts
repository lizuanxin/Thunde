import {Component, OnInit, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import {SwiperComp} from '../../../UltraCreation/ng-ion/swiper'

import * as Svc from '../../../providers'

@Component({selector: 'filelist-body', templateUrl: 'filelist.body.html'})
export class FileListBodyComp implements OnInit
{
    constructor(public app: Svc.TApplication)
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

        this.SelectBodyCategory(this.BodyCategories[0]);
    }

    @Input() set FileList(Value: Svc.TScriptFileList)
    {
        if (! TypeInfo.Assigned(Value))
            return;
        if (Value === this._FileList)
            return;
        this._FileList = Value;

        /*
        for (let f of this._FileList)
        {
            if (f.Name === 'waist')
            {
                Svc.Loki.TFile.DEBUG_FILETIME = true;
                let l = new Svc.Loki.TFile();

                l.LoadFrom(f.Content);
                console.log(l.TimeEst());
                Svc.Loki.TFile.DEBUG_FILETIME = false;
                break;
            }
        }
        */
    }

    @Input() DefaultFiles: Array<string>;

    @Output() OnSelection = new EventEmitter<Svc.TScriptFile>();

    SelectBodyCategory(b: TBodyCategory)
    {
        if (this.CurrBodyCategory !== b)
        {
            this.CurrBodyCategory = b;
            this.BodySwiper.Update();
        }
    }

    UsageIconChanged(Idx: number)
    {
        this.UsageIconIdx = Idx;
        this._FilteredFiles = [];
    }

    get FilteredFiles(): Svc.TScriptFileList
    {
        if (! TypeInfo.Assigned(this._FileList))
            return [];

        if (this._FilteredFiles.length === 0)
        {
            let BodyPart = this.CurrBodyCategory.BodyPartOf(this.UsageIconIdx);
            if (! TypeInfo.Assigned(BodyPart))
                return this._FilteredFiles;

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

            this.FileSwiper.Update(true, 0);
        }

        return this._FilteredFiles;
    }

    SelectionFile(ev: any)
    {
        let f = this._FilteredFiles[this.FileSwiper.ActiveIndex];
        this.OnSelection.next(f);
    }

    SetStyle(n: number): Object
    {
        switch(n)
        {
            case 0: return { height: Math.ceil(window.innerHeight * 0.34) + 'px' }
            case 1: return { fontSize: Math.ceil(window.innerWidth * 0.40) + 'px' }
            case 2: return { height: Math.ceil(window.innerHeight * 0.28) + 'px' }
            case 3: return { fontSize: Math.ceil(window.innerWidth * 0.05) + 'px' }
            default: return {};
        }
    }

    private BodyCategories = new Array<TBodyCategory>();
    private CurrBodyCategory: TBodyCategory;
    private UsageIconIdx: number = 0;

    private _FileList?: Svc.TScriptFileList;
    private _FilteredFiles: Svc.TScriptFileList = [];

    @ViewChild('BodySwiper') private BodySwiper: SwiperComp;
    @ViewChild('FileSwiper') private FileSwiper: SwiperComp;
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
                    for (let icon of JSON.parse(b.Desc as string))
                    {
                        this.UsageIcons.push(icon);
                        this._UsageIconBodyPart.set(icon, b)
                    }
                }
            }
            else
            {
                this.BodyParts.push(arg as Svc.IBodyPart);

                for (let icon of JSON.parse((arg as Svc.IBodyPart).Desc as string))
                {
                    this.UsageIcons.push(icon);
                    this._UsageIconBodyPart.set(icon, arg as Svc.IBodyPart)
                }
            }
        }
    };

    BodyPartOf(IconIdx: number): Svc.IBodyPart
    {
        let Icon = this.UsageIcons[IconIdx];
        return this._UsageIconBodyPart.get(Icon) as Svc.IBodyPart;
    }

    UsageIcons = new Array<number>();
    BodyParts = new Array<Svc.IBodyPart>();

    private _UsageIconBodyPart = new Map<number, Svc.IBodyPart>();
}
