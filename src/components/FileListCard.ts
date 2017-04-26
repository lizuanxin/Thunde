import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef} from '@angular/core'

import {TypeInfo} from "../UltraCreation/Core/TypeInfo";
import {TApplication, TAssetService, TCategory, TScriptFile} from '../providers';

@Component({selector: 'filelist-card', template: '<canvas style="width:100%" tappable></canvas>'})
export class FileListCard implements OnInit, OnDestroy
{
    constructor(private Elements: ElementRef, private app: TApplication, private Asset: TAssetService)
    {
    }

    ngOnInit()
    {
    }

    ngOnDestroy(): void
    {
    }

    @Input() set Category(v: TCategory)
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

    @Output() OnSelectionFile = new EventEmitter<TScriptFile>();

    private FileList: Array<TScriptFile>;
}
