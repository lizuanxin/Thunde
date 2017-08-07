import {isDevMode, Component, OnInit} from '@angular/core';

import {TypeInfo} from '../UltraCreation/Core/TypeInfo';
import {RunningPage} from './running/running';
import {TouPage} from '../profile/tou/tou';

import * as Svc from '../providers';

@Component({selector: 'page-home', templateUrl: 'home.html'})
export class HomePage implements OnInit
{
    constructor(private Asset: Svc.TAssetService)
    {
        App.Platform.ready()
            .then(() =>
            {
                if (App.IsIos)
                    Svc.Loki.TShell.LinearTable = '3.3v';
                else if (App.IsAndroid)
                    Svc.Loki.TShell.LinearTable = '5v';

                console.log(Svc.Loki.TShell.LinearTable);
            });
    }

    ngOnInit(): void
    {
        if (isDevMode())
            console.log('develope mode....');

        this.Tabs.push(new TTabItem(255, Svc.const_data.Category.recommend));
        this.Tabs.push(new TTabItem(0, Svc.const_data.Category.relax));
        this.Tabs.push(new TTabItem(1, Svc.const_data.Category.muscle_training));
        // this.Tabs.push(new TTabItem(2, Svc.const_data.Category.fat_burning));

        let ProfileTab = new TTabItem(65536, 0xE94c);
        this.Tabs.push(ProfileTab);

        this.TabsIcons.set(0, {normal: 0xe951, active: 0xe952});
        this.TabsIcons.set(1, {normal: 0xe94d, active: 0xe94e});
        this.TabsIcons.set(65536, {normal: 0xe94f, active: 0xe950});

        if (! App.AcceptedTerms)
        {
            this.SelectTab(ProfileTab);

            this.ShowTOU()
                .then(() => App.IsSupportedOTG())
                .then(support_otg =>
                {
                    if (! support_otg)
                    {
                        App.ShowAlert({title: 'OTG', message: App.Translate('hint.e_usb_otg') as string,
                            buttons: [{text: App.Translate('button.ok') as string, role: 'cancel'}]});
                    }
                });
        }
        else
            this.SelectTab(this.Tabs[0]);
    }

    ionViewWillEnter()
    {
        this.DefaultFiles = Svc.Loki.TShell.DefaultFileList;

        if (this.DefaultFiles.length === 0)
        {
            StorageEngine.Get('def_filelist')
                .then(ary => this.DefaultFiles = ary as string[])
                .catch(err => {});
        }
        else
            StorageEngine.Set('def_filelist', this.DefaultFiles).catch(err => {});

        App.EnableHardwareBackButton();
        this.CheckIsStillRunning();
    }

    private CheckIsStillRunning()
    {
        this.IsStillRunning = TypeInfo.Assigned(Svc.Loki.TShell.RunningInstance);
        if (this.IsStillRunning)
            setTimeout(() => this.CheckIsStillRunning(), 500);
    }

    get TickingDownHint(): string
    {
        if (TypeInfo.Assigned(Svc.Loki.TShell.RunningInstance))
            return Svc.Loki.TShell.RunningInstance.TickingDownHint;
        else
            return '';
    }

    GetTabIcon(Index: number): string
    {
        let Icons = this.TabsIcons.get(Index);
        return Index === this.ActiveTab.Index ? App.IconFont(Icons.active) : App.IconFont(Icons.normal);
    }

    Resume()
    {
        if (! this.IsStillRunning)
            return;

        App.ShowLoading()
            .then(() => App.Nav.push(RunningPage, {Resume: true}))
            .catch(err => console.log(err.message));
    }

    SelectTab(Tab: TTabItem): void
    {
        if (! TypeInfo.Assigned(this.ActiveTab))
            this.ActiveTab = Tab;

        if (TypeInfo.Assigned(Tab.CategoryId) && ! TypeInfo.Assigned(Tab.FileList))
        {
            App.ShowLoading()
                .then(() => this.Asset.FileList(Tab.CategoryId))
                .then(List =>
                {
                    Tab.FileList = List;
                })
                .catch(err => console.log(err))
                .then(() => App.HideLoading())
                .then(() => this.ActiveTab = Tab)
                .catch(err => console.log(err));
        }
        else
        {
            this.ActiveTab = Tab;
            App.HideLoading().catch(err => console.log(err));
        }
    }

    SelectFile(ScriptFile: Svc.TScriptFile)
    {
        App.DisableHardwareBackButton();

        if (TypeInfo.Assigned(Svc.Loki.TShell.RunningInstance))
        {
            let Shell = Svc.Loki.TShell.RunningInstance;
            return Shell.StopOutput()
                .then(() => App.Nav.push(RunningPage, {Shell: Shell, ScriptFile: ScriptFile}));
        }
        else
        {
            App.ShowLoading().then(() =>
                {
                    this.SelectedFile = ScriptFile;
                    this.DeviceScanning = true;
                });
        }
    }

    Discovery()
    {
        this.DeviceScanning = false;
        App.EnableHardwareBackButton();
    }

    DeviceSelection(Peripheral: Svc.TConnectablePeripheral | undefined)
    {
        this.DeviceScanning = false;
        if (! TypeInfo.Assigned(Peripheral))
            return;

        App.ShowLoading()
            .then(() => App.Nav.push(RunningPage, {Shell: Peripheral.Shell, ScriptFile: this.SelectedFile}))
            .catch(err => console.log(err.message));
    }

    private ShowTOU(): Promise<any>
    {
        return App.Nav.push(TouPage);
    }

    App = window.App;

    private DefaultFiles: Array<string> = [];
    private SelectedFile: Svc.TScriptFile;

    private TabsIcons: Map<number, {normal: number, active: number}> = new Map();
    private Tabs: Array<TTabItem> = [];
    private ActiveTab: TTabItem;

    private DeviceScanning = false;
    private IsStillRunning = false;
}

class TTabItem
{
    constructor (public Index: number, public IconOrCategory: number | Svc.ICategory)
    {
    }

    get Icon(): number | null | undefined
    {
        if (TypeInfo.IsNumber(this.IconOrCategory))
            return this.IconOrCategory;
        else
            return this.IconOrCategory.Icon;
    }

    get Name(): string
    {
        if (this.Index === 65536)
            return 'profile_page.title';
        else
            return 'category.' + (this.IconOrCategory as Svc.ICategory).Name;
    }

    get CategoryId(): string
    {
        if (TypeInfo.IsNumber(this.IconOrCategory))
            return '';
        else
            return (this.IconOrCategory as Svc.ICategory).Id as string;
    }

    FileList?: Svc.TScriptFileList;
}
