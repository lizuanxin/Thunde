import {Component, Input, Output, EventEmitter, ElementRef} from '@angular/core'
import * as Svc from '../providers';

@Component({selector: 'filelist-card', template: `
    <ion-card card-list-default *ngFor="let f of FileList">
        <ion-card-content (click)="OnSelectionFile.emit(f)" tappable>
            <h2><ion-icon app-icon>&#xe93e;</ion-icon></h2>
            <ion-card-title>
                {{'scriptfile.'+f.Name|translate}}
            </ion-card-title>
        </ion-card-content>
    </ion-card>
`})
export class FileListCard
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {
    }

    @Input() FileList: Svc.TScriptFileList;
    @Output() OnSelectionFile = new EventEmitter<Svc.TScriptFile>();
}
