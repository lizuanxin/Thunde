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
        let Idx = Svc.Loki.TShell.DefaultFileList.indexOf(FileName);
        if (Idx < 0 || Idx > 2)
            Idx = 0;

        App.ShowLoading()
            .then(() => this._Shell.SetDefaultFile(this.RefFile.Name as string, Idx))
            .then(() =>
            {
                this.FileList = Svc.Loki.TShell.DefaultFileList.filter(Iter => Iter.length > 0);
                return StorageEngine.Set('def_filelist', this.FileList).catch(err => {});
            })
            .then(() => this.OnClose.next())
            .catch(err => console.error(err))
            .then(() => App.HideLoading());
    }

    @Input() set Shell(v: Svc.Loki.TShell)
    {
        this._Shell = v;

        this.FileList = Svc.Loki.TShell.DefaultFileList.filter(Iter => Iter.length > 0);
        this.RefFile = v.RefFile as Svc.TScriptFile;

        console.log(this.FileList);
    }

    @Output() OnClose = new EventEmitter<void>();

    private _Shell: Svc.Loki.TShell;
    private FileList: Array<string>;
    private RefFile: Svc.TScriptFile;
}
