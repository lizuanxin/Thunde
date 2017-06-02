import {Component, Input, Output, EventEmitter} from '@angular/core'
import * as Svc from '../../../providers';

@Component({selector: 'filelist-card', template: `
    <div margin>
        <ion-card card-list-default *ngFor="let f of FileList">
            <ion-card-content (tap)="OnSelection.emit(f)" tappable>
                <ion-item>
                    <ion-row align-items-center justify-content-center>
                        <ion-col col-4 text-center>
                            <ion-icon app-icon style="font-size:25vw">{{app.IconFont(f.Icon)}}</ion-icon>
                        </ion-col>
                        <ion-col offset-1>
                            <h2 style="font-size:4.5vw"><span ion-text color="dark">{{f.Name_LangId|translate}}</span></h2>
                            <ion-row align-items-center justify-content-center>
                                <ion-col col-3>
                                    <div style="width:6vw; height:6vw"><file-duration [Duration]="f.DurationMinute"></file-duration></div>
                                </ion-col>
                                <ion-col align-self-center>
                                    <span color="dark" style="font-size:1.2rem;">{{f.DurationMinute.toString()}}{{'hint.min'|translate}}</span>
                                </ion-col>
                            </ion-row>
                        </ion-col>
                    </ion-row>
                </ion-item>
            </ion-card-content>
        </ion-card>
    </div>`})
export class FileListCardComp
{
    constructor(private app: Svc.TApplication)
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
                    <ion-row>
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
    constructor(private app: Svc.TApplication)
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
            return '低头族肩颈放松按摩';
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
