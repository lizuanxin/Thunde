import {Component, Input, Output, EventEmitter} from '@angular/core';
import * as Svc from '../../providers';

@Component({selector: 'download-default-file', templateUrl: 'download.html'})
export class DownloadPage
{
    constructor()
    {
    }

    Replace(FileName: string)
    {
        let Idx: number;
        if (this.FileList.length < 3)
            Idx = this.FileList.length;
        else
            Idx = this.FileList.indexOf(FileName);

        if (Idx < 0 || Idx > 2)
            Idx = 0;

        App.ShowLoading()
            .then(() => this._Shell.SetDefaultFile(this.RefFile.Name as string, Idx))
            .then(() => this.FileList = this._Shell.DefaultFileList.filter(Iter => Iter.length > 0))
            .catch(err => console.error(err))
            .then(() => App.HideLoading());
    }

    @Input() set Shell(v: Svc.Loki.TShell)
    {
        this._Shell = v;

        this.FileList = v.DefaultFileList.filter(Iter => Iter.length > 0);
        this.RefFile = v.RefFile as Svc.TScriptFile;

        console.log(this.FileList);
    }

    @Output() OnClose = new EventEmitter<void>();

    private _Shell: Svc.Loki.TShell;
    private FileList: Array<string>;
    private RefFile: Svc.TScriptFile;
}
