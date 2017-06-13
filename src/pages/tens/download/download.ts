import {Component, OnDestroy, Input, Output, EventEmitter} from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';

import {Subscription} from 'rxjs/Subscription'
import 'rxjs/add/operator/toPromise';

import {TypeInfo} from '../../../UltraCreation/Core/TypeInfo';
import * as Svc from '../../../providers';

@Component({selector: 'download-default-file', templateUrl: 'download.html'})
export class DownloadPage implements OnDestroy
{
    constructor(private navParams: NavParams, private view: ViewController,
        public app: Svc.TApplication, private AssetSvc: Svc.TAssetService)
    {
    }

    ngOnDestroy(): void
    {
        if (TypeInfo.Assigned(this.ShellNotifySubscription))
        {
            this.ShellNotifySubscription.unsubscribe();
            this.ShellNotifySubscription = null;
        }

        this.app.HideLoading();
    }

    private Close(MessageId: string)
    {
        if (MessageId !== '')
            this.app.ShowError(MessageId).then(() => this.Dismiss(1));
        else
            this.Dismiss(1);
    }

    private AddNotify()
    {
        this.ShellNotifySubscription = this.Shell.OnNotify.subscribe(
            Notify =>
            {
                switch(Notify)
                {
                case Svc.Loki.TShellNotify.Shutdown:
                    this.Close('shutdown');
                    break;
                case Svc.Loki.TShellNotify.Disconnected:
                    this.Close('disconnected');
                    break;
                case Svc.Loki.TShellNotify.LowBattery:
                    this.Close('low_battery');
                    break;
                case Svc.Loki.TShellNotify.HardwareError:
                    this.Close('hardware_error');
                    break;

                case Svc.Loki.TShellNotify.Stopped:
                    this.Close('');
                    break;
                }
            },
            err=> console.log(err.message));
    }

    Dismiss(Value: number)
    {
        this.app.HideLoading();
        this.OnDismiss.emit(Value);
    }

    SetDefaultFile(Value: string)
    {
        this.app.ShowLoading()
            .then(loading =>
            {
                let Index = 0;
                if (TypeInfo.Assigned(this.Datas.FileNames))
                    Index = this.Datas.FileNames.indexOf(Value);

                if (Index === -1 || Index >= 3)
                    Index = 0;

                console.log("CurrentFile.Name:" + this.Datas.CurrentFile.Name + "  Value:" + Value);

                this.Shell.SetDefaultFile(this.Datas.CurrentFile.Name, Index)
                    .catch(err => console.error(err))
                    .then(() => this.Dismiss(1))
            });
    }

    @Input() set Value(Datas)
    {
        console.log("datas:" + JSON.stringify(Datas));

        if (TypeInfo.Assigned(Datas) && this.Datas !== Datas)
        {
            this.Datas = Datas;
            if (TypeInfo.Assigned(this.Datas.FileNames))
            {
                this.DefaultFileList = [];
                Svc.const_data.ScriptFile.forEach(File =>
                    {
                        if (this.Datas.FileNames.indexOf(File.Name) !== -1)
                            this.DefaultFileList.push({FileName: File.Name, Description: this.app.Translate("scriptfile." + File.Name)})
                    });

                console.log("DefaultFileList:" + JSON.stringify(this.DefaultFileList));
            }

            this.Shell = Svc.Loki.TShell.Get(this.Datas.DeviceId);
            this.AddNotify();
        }
    }

    @Output() OnDismiss = new EventEmitter<number>()

    private DefaultFileList: Array<{FileName: string, Description: string}> = [];
    private Datas: {FileNames: Array<string>, CurrentFile: Svc.TScriptFile, DeviceId: string};
    private Shell: Svc.Loki.TShell;
    private ShellNotifySubscription: Subscription;
}
