import {Component, Input, Output, EventEmitter, ElementRef} from '@angular/core'
import * as Svc from '../providers';

@Component({selector: 'filelist-card', template: `
    <ion-card card-list-default *ngFor="let f of FileList">
        <ion-card-content (click)="OnSelection.emit(f)" tappable>
            <ion-item>
                <ion-icon app-icon item-left>&#xe93e;</ion-icon>
                <h2>{{f.Name_LangId|translate}}</h2>
            </ion-item>
        </ion-card-content>
    </ion-card>
`})
export class FileListCard
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {
    }

    @Input() FileList: Svc.TScriptFileList;
    @Output() OnSelection = new EventEmitter<Svc.TScriptFile>();
}
