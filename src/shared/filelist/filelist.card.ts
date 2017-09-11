import {Component, Input, Output, EventEmitter} from '@angular/core';
import * as Svc from '../../providers';

@Component({selector: 'filelist-card', template: `
    <div class="card-view">
        <ion-row align-items-center justify-content-center class="card-item" *ngFor="let f of FileList">
            <ion-col col-4 text-center class="wave-edge">
                <ion-icon *ngIf="f.Id === '{00000000-0000-4000-4100-000000004001}'" app-icon color="light" class="big-icon">&#xe970;</ion-icon>
                <ion-icon *ngIf="f.Id === '{00000000-0000-4000-4100-000000004002}'" app-icon color="light" class="big-icon">&#xe9a4;</ion-icon>
                <ion-icon *ngIf="f.Id === '{00000000-0000-4000-4100-000000004003}'" app-icon color="light" class="big-icon">&#xe959;</ion-icon>
            </ion-col>
            <ion-col col-5 align-self-center padding-left>
                <div style="display: flex;align-items: center;">
                    <span ion-text color="dark" class="big-text">{{f.Name_LangId|translate}}</span>
                    <ion-icon *ngIf="DefaultFiles && DefaultFiles.indexOf(f.Name) !== -1" app-icon class="default-file">&#xe916;</ion-icon>
                </div>
                <span class="little-text">{{f.DurationMinute.toString()}}{{'hint.min'|translate}}</span>
            </ion-col>
            <ion-col col-3 align-self-center text-center (tap)="OnSelection.emit(f)">
                <ion-row align-items-center justify-content-center>
                    <ion-col col-12 align-self-center text-center>
                        <ion-icon app-icon class="border-icon">{{App.IconFont(f.Icon)}}</ion-icon>
                    </ion-col>
                    <ion-col col-12 style="height:1.4vh">
                    </ion-col>
                    <ion-col col-12 align-self-center text-center style="background-color:transparent">
                        <ion-icon app-icon class="nav-icon">&#xe929;</ion-icon>
                    </ion-col>
                </ion-row>
            </ion-col>
        </ion-row>
    </div>`})
export class FileListCardComp
{
    constructor()
    {
    }

    App = window.App;

    @Input() DefaultFiles: Array<string>;
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
                            <p style="display: flex;align-items: center;">
                                <span f-1-2 ion-text color="dark">{{'home_page.remommend_bodypart'|translate}}</span>
                                <ion-icon *ngIf="DefaultFiles && DefaultFiles.indexOf(f.Name) !== -1" class="default-file">&#xe916;</ion-icon>
                            </p>
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
    constructor()
    {
    }

    Message(FileId: string): string
    {
        switch (FileId)
        {
        case '{00000000-0000-4000-4100-0000000FF001}':
            return App.Translate('scriptfile.recommend1');
        case '{00000000-0000-4000-4100-0000000FF002}':
            return App.Translate('scriptfile.recommend2');
        case '{00000000-0000-4000-4100-0000000FF003}':
            return App.Translate('scriptfile.recommend3');
        default:
            return '';
        }
    }

    SetImg(FileId: string): string
    {
        switch (FileId)
        {
        case '{00000000-0000-4000-4100-0000000FF001}':
            return 'assets/img/shoulders_recommend1.jpg';
        case '{00000000-0000-4000-4100-0000000FF002}':
            return 'assets/img/shoulders_recommend2.jpg';
        case '{00000000-0000-4000-4100-0000000FF003}':
            return 'assets/img/shoulders_recommend3.jpg';
        default:
            return '';
        }
    }

    SetBackgroundImg(id: string): string
    {
        return 'url(' + this.SetImg(id) + ') right bottom no-repeat';
    }

    @Input() DefaultFiles: Array<string>;
    @Input() FileList: Svc.TScriptFileList;
    @Output() OnSelection = new EventEmitter<Svc.TScriptFile>();
}
