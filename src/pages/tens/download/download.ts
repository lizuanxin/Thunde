import {Component, Input, Output, EventEmitter} from '@angular/core';
import * as Svc from '../../../providers';

@Component({selector: 'download-default-file', templateUrl: 'download.html'})
export class DownloadPage
{
    constructor(public app: Svc.TApplication)
    {
    }

    Replace(FileName: string)
    {
        let Idx = this.FileList.indexOf(FileName);
        if (Idx < 0 || Idx > 2)
            Idx = 0;

        this.app.ShowLoading()
            .then(() => this._Shell.SetDefaultFile(this.RefFile.Name, Idx))
            .catch(err => console.error(err))
            .then(() => this.app.HideLoading())
    }

    @Input() set Shell(v: Svc.Loki.TShell)
    {
        this._Shell = v;

        this.FileList = v.DefaultFileList;
        this.RefFile = v.RefFile as Svc.TScriptFile;

        console.log(this.FileList);
    }

    @Output() OnClose = new EventEmitter<void>()

    private _Shell: Svc.Loki.TShell;
    private FileList: Array<string>;
    private RefFile: Svc.TScriptFile;
}
