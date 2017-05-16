import {Component, Input, Output, EventEmitter, ElementRef} from '@angular/core'
import * as Svc from '../providers';

@Component({selector: 'filelist-card', template: `
    <div margin>
        <ion-card card-list-default *ngFor="let f of FileList">
            <ion-card-content (tap)="OnSelection.emit(f)" tappable>
                <ion-item>
                    <ion-row item-left>
                        <ion-col col-12 margin-top>
                            <p style="font-size:4.5vw"><span ion-text color="dark">{{f.Name_LangId|translate}}</span></p>
                        </ion-col>
                        <ion-col col-12>
                            <p><span f-1-2 ion-text color="dark">{{'shoulder_neck.position'| translate}}</span></p>
                            <p><span f-1-2>{{f.DurationMinute.toString()}}{{'hint.min'|translate}}</span></p>
                        </ion-col>
                    </ion-row>
                </ion-item>
            </ion-card-content>
        </ion-card>
    </div>
`})
export class FileListCardComp
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {
    }

    @Input() FileList: Svc.TScriptFileList;
    @Output() OnSelection = new EventEmitter<Svc.TScriptFile>();
}

@Component({selector: 'filelist-recommend', template: `
    <div margin>
        <ion-card card-list-default *ngFor="let f of FileList">
            <ion-card-content (tap)="OnSelection.emit(f)" tappable>
                <ion-item [ngStyle]="{background:SetBackgroundImg(f.Id),backgroundSize:'contain'}">
                    <ion-row item-left>
                        <ion-col col-12 margin-top>
                            <p style="font-size:4.5vw"><span ion-text color="dark">{{Message(f.Id)}}</span></p>
                        </ion-col>
                        <ion-col col-12>
                            <p><span f-1-2 ion-text color="dark">肩部|颈部</span></p>
                            <p><span f-1-2>{{f.DurationMinute.toString()}}{{'hint.min'|translate}}</span></p>
                        </ion-col>
                    </ion-row>
                </ion-item>
            </ion-card-content>
        </ion-card>
    </div>
`})
export class FileListRecommendComp
{
    constructor(private Elements: ElementRef, private app: Svc.TApplication)
    {
    }

    Message(FileId: string): string
    {
        switch(FileId)
        {
            case '{00000000-0000-4000-4100-0000000FF001}':
            return '办公室肩颈活力按摩';

            case '{00000000-0000-4000-4100-0000000FF002}':
            return '加班后肩颈疼痛舒缓按摩';

            case '{00000000-0000-4000-4100-0000000FF003}':
            return '头族肩颈放松按摩';
        }
    }

    SetImg(FileId: string): string
    {
        switch(FileId)
        {
            case '{00000000-0000-4000-4100-0000000FF001}':
            return "assets/img/shoulders_recommend1.jpg";

            case '{00000000-0000-4000-4100-0000000FF002}':
            return "assets/img/shoulders_recommend2.jpg";

            case '{00000000-0000-4000-4100-0000000FF003}':
            return "assets/img/shoulders_recommend3.jpg";
        }
    }

    SetBackgroundImg(id): string
    {
        return 'url(' + this.SetImg(id) + ') right bottom no-repeat';
    }

    @Input() FileList: Svc.TScriptFileList;
    @Output() OnSelection = new EventEmitter<Svc.TScriptFile>();
}
