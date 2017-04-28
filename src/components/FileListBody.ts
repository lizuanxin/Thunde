import {Component, OnInit, Input, Output, AfterViewInit, EventEmitter, ViewChild, ViewChildren, ElementRef, QueryList} from '@angular/core';
import {Slides, PickerColumnCmp, PickerColumnOption} from 'ionic-angular';
import {TypeInfo} from '../UltraCreation/Core/TypeInfo';

import * as Svc from '../providers'

const BODY = ['&#xe93d;', '&#xe93e;', '&#xe93f;', '&#xe940;', '&#xe941;'];
const Massage = [{ text: '酸痛缓解' }, { text: '疲劳缓解' }, { text: '快速镇痛' }, { text: '搓揉' }, { text: '按压' }, { text: '肌肉放松' }];

@Component({
  selector: 'filelist-body',
  template: `
    <ion-row [ngStyle]="VslideH" margin-top margin-bottom>

        <ion-col col-12 no-padding>
            <section Flip-x [class.Filped]="ISFlip">
                <ion-slides effect="flip" [ngStyle]="SetStyle(0)">
                    <ion-slide><ion-icon app-icon [ngStyle]="SetStyle(1)">&#xe943;</ion-icon></ion-slide>
                    <ion-slide><ion-icon app-icon [ngStyle]="SetStyle(1)">&#xe943;</ion-icon></ion-slide>
                </ion-slides>
            </section>
            <ion-row RSideTop justify-content-end [class.slideIn]="ISFlip">
                <ion-col col-2 text-center><div><ion-icon app-icon [ngStyle]="SetStyle(3)">&#xe943;</ion-icon></div></ion-col>
                <ion-col col-2 text-center><div><ion-icon app-icon [ngStyle]="SetStyle(3)">&#xe95a;</ion-icon></div></ion-col>
            </ion-row>
        </ion-col>

        <ion-col col-10 offset-1 no-padding>
            <ion-row VSideLeft nowrap>
                <ion-col no-padding text-center [class.active]="CurrentBodyValue === item" *ngFor="let item of BodyValues" (click)="SelectBody(item)" tappable>
                    <button><span app-icon [innerHTML]="item"></span></button>                   
                </ion-col>
            </ion-row>
        </ion-col>

        <ion-col col-10 offset-1 text-center margin-top>
            <ion-row>
                <ion-col col-6 offset-3>
                    <div class="picker-ios" picker-fix>
                        <div class="picker-columns" [ngStyle]="SetStyle(2)">
                            <div class="picker-above-highlight"></div>
                            <div *ngFor="let c of Columns" [col]="c" class="picker-col" (ionChange)="ColChange($event)"></div>
                            <div class="picker-below-highlight"></div>
                        </div>
                    </div>
                </ion-col>
            </ion-row>
        </ion-col>
    </ion-row>
  `,
})

export class FileListBody implements OnInit, AfterViewInit
{
    constructor(private Elements: ElementRef)
    {

    }

    ngOnInit()
    {

    }

    ngAfterViewInit()
    {
        
    }

    @Input()
    set isDisplay(on: boolean)
    {
        if (on)
        {
            this.Columns = [
            {
                name: 'Mas',
                align: 'center',
                selectedIndex: 1,
                options: Massage
            }];

            this.Columns = this.Columns.map(column => {
            if (! TypeInfo.Assigned(column.options)) {
                column.options = [];
            }
            column.selectedIndex = column.selectedIndex || 0;
            column.options = column.options.map(inputOpt => {
            let opt: PickerColumnOption = {
                text: '',
                value: '',
                disabled: inputOpt.disabled,
            };

            if (TypeInfo.Assigned(inputOpt)) {
                if (TypeInfo.IsString(inputOpt) || TypeInfo.IsNumber(inputOpt)) {
                    opt.text = inputOpt.toString();
                    opt.value = inputOpt;
                } else {
                    opt.text = TypeInfo.Assigned(inputOpt.text) ? inputOpt.text : inputOpt.value;
                    opt.value = TypeInfo.Assigned(inputOpt.value) ? inputOpt.value : inputOpt.text;
                }
            }

            return opt;
            });
            return column;
        });
            setTimeout(() => this.refresh(), 50);
        }
        else
        {
            this.Columns = [];
        }
    }

    async foo()
    {

    }

    refresh()
    {
        this._cols.forEach(column =>
        {
            let perClientH = column.colHeight / 3;
            for (let i = 0; i < column.colEle.nativeElement.children.length; i++)
            {
                column.colEle.nativeElement.children[i].style.height = column.colEle.nativeElement.children[i].style.lineHeight = perClientH + 'px';
            }
            column.refresh();
        });
    }

    ColChange(selectedOption: PickerColumnOption)
    {
        let selected: {[k: string]: any} = {};
            this.Columns.forEach((col, index) =>
            {
                let selectedColumn = col.options[col.selectedIndex];
                selected[col.name] = {
                    text: selectedColumn ? selectedColumn.text : null,
                    value: selectedColumn ? selectedColumn.value : null,
                    columnIndex: index,
                };
            });
            return selected;
    }

    SelectBody(item: string)
    {
        if (this.CurrentBodyValue !== item)
        {
            this.CurrentBodyValue = item;
            this.ToFlip();
        }
    }

    SetStyle(n: number): Object
    {
        switch(n)
        {
            case 0: return { height: Math.ceil(window.innerHeight * 0.38) + 'px' }
            case 1: return { fontSize: Math.ceil(window.innerWidth * 0.45) + 'px' }
            case 2: return { height: '150px' }
            case 3: return { fontSize: Math.ceil(window.innerWidth * 0.08) + 'px' }
        }
    }

    SetVLside()
    {
        let VLS = this.VLSide.nativeElement, AvHeight;
        AvHeight = Math.ceil(window.innerHeight * 0.5) / VLS.children.length;
        VLS.parentElement.style.marginBottom = '5px';
        for (let i = 0; i < VLS.children.length; i++)
        {
            VLS.children[i].style.height = VLS.children[i].style.lineHeight = AvHeight + 'px';
            VLS.children[i].style.fontSize = '10vw';
            if (i < VLS.children.length - 1)
                VLS.children[i].style.marginRight = '1px';
        }
    }

    ToFlip()
    {
        if (!this.ISFlip) this.ISFlip = true;
        setTimeout(()=> this.ISFlip = false,500);

    }

    get VslideH(): Object
    {
        return { height: this.VSLHeight + 'px' }
    }

    @ViewChild('VLeftSide') VLSide: ElementRef;
    @ViewChildren(PickerColumnCmp) _cols: QueryList<PickerColumnCmp>

    Columns: any;
    BodyValues: Array<string> = BODY;
    MasValues: Array<Object> = Massage;
    CurrentBodyValue: string = this.BodyValues[0];
    CurrentMasValue: string = Massage[0].text;
    IsHArrowLeftShow: Boolean = false;
    IsHArrowRightShow: Boolean = true;
    VslideOption: Object;
    VSLHeight: number = Math.ceil(window.innerHeight * 0.7);
    ISFlip: Boolean = false;

    @Output() OnSelectionFile = new EventEmitter<Svc.TScriptFile>();
}
