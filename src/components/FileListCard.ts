import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef} from '@angular/core'

import {TypeInfo} from "../UltraCreation/Core/TypeInfo";
import * as Svc from '../providers';

@Component({selector: 'filelist-card', template: `
    <ion-card card-list-default *ngFor="let c of FileList">
        <ion-card-content>
            <h2><ion-icon app-icon>&#xe93e;</ion-icon></h2>
            <ion-card-title>
                {{c.Name}}
            </ion-card-title>            
        </ion-card-content>
    </ion-card>
`})
export class FileListCard implements OnInit, OnDestroy
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication, private Asset: Svc.TAssetService)
    {
    }

    ngOnInit()
    {
    }

    ngOnDestroy(): void
    {
    }

    @Input() set Category(v: Svc.TCategory)
    {
        if (! TypeInfo.Assigned(v))
            return;

        this.Asset.FileList(v.Id)
            .then(List =>
            {
                console.log(List);
                this.FileList = List;
            })
            .catch(err => console.log(err));
    }

    @Output() OnSelectionFile = new EventEmitter<Svc.TScriptFile>();

    private FileList: Array<Svc.TScriptFile>;
}
