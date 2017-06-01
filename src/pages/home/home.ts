import {isDevMode, Component, OnInit} from '@angular/core';
import {NavParams} from 'ionic-angular';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo'
import * as View from '..'
import * as Svc from '../../providers';

@Component({selector: 'page-home', templateUrl: 'home.html'})
export class HomePage implements OnInit
{
    constructor(private app: Svc.TApplication, private navParams: NavParams,
        private Asset: Svc.TAssetService, private Distribute: Svc.TDistributeService)
    {
        this.app.Platform.ready()
            .then(() =>
            {
                if (this.app.IsIos)
                    Svc.Loki.TShell.LinearTable = '3.3v';
                else if (this.app.IsAndroid)
                    Svc.Loki.TShell.LinearTable = '5v';

                console.log(Svc.Loki.TShell.LinearTable);
            });
    }

    ngOnInit(): void
    {
        if (isDevMode())
            console.log('develope mode....');

        // this.Tabs.push(new TTabItem(255, Svc.const_data.Category.recommend));
        this.Tabs.push(new TTabItem(0, Svc.const_data.Category.relax));
        this.Tabs.push(new TTabItem(1, Svc.const_data.Category.muscle_training));
        this.Tabs.push(new TTabItem(2, Svc.const_data.Category.fat_burning));

        let ProfileTab = new TTabItem(65536, 0xE94c)
        this.Tabs.push(ProfileTab);

        if (! this.app.AcceptedTerms)
        {
            this.SelectTab(ProfileTab);

            this.ShowTOU()
                .then(() => this.app.IsSupportedOTG())
                .then(support_otg =>
                {
                    if (! support_otg)
                    {
                        this.app.ShowAlert({title: 'OTG', message: this.app.Translate('hint.e_usb_otg') as string,
                            buttons: [{text: this.app.Translate('button.ok') as string, role: 'cancel'}]});
                    }
                });
        }
        else
            this.SelectTab(this.Tabs[0]);
    }

    ionViewWillEnter()
    {
        this.app.EnableHardwareBackButton();
    }

    ActiveSwitch(): string
    {
        switch(this.ActiveTab.Index)
        {
            case 1: return 'sport';
            case 2: return 'thin';
            default: return ''
        }
    }

    SelectTab(Tab: TTabItem): void
    {
        if (! TypeInfo.Assigned(this.ActiveTab))
            this.ActiveTab = Tab;

        if (TypeInfo.Assigned(Tab.CategoryId) && ! TypeInfo.Assigned(Tab.FileList))
        {
            this.app.ShowLoading()
                .then(() => this.Asset.FileList(Tab.CategoryId))
                .then(List => Tab.FileList = List)
                .catch(err => console.log(err))
                .then(() => this.app.HideLoading())
                .then(() => this.ActiveTab = Tab)
        }
        else
        {
            this.ActiveTab = Tab;
            this.app.HideLoading();
        }
    }

    SelectFile(ScriptFile: Svc.TScriptFile)
    {
        let params = this.navParams.data;
        params.ScriptFile = ScriptFile;

        this.app.DisableHardwareBackButton();
        this.app.ShowLoading()
            .then(() => this.DeviceScanning = true);
    }

    DeviceSelection(DeviceId?: string)
    {
        this.DeviceScanning = false;

        if (TypeInfo.Assigned(DeviceId))
        {
            let params = this.navParams.data;
            params.DeviceId = DeviceId;

            this.app.ShowLoading()
                .then(() => this.app.Nav.push(View.RunningPage, params))
        }
    }

    private ShowTOU(): Promise<any>
    {
        return this.app.Nav.push(View.TouPage);
    }

    private Tabs: Array<TTabItem> = [];
    private ActiveTab: TTabItem;

    private DeviceScanning = false;
}

class TTabItem
{
    constructor (public Index: number, public IconOrCategory?: number | Svc.ICategory)
    {
    }

    get Icon(): number
    {
        if (TypeInfo.IsNumber(this.IconOrCategory))
            return this.IconOrCategory;
        else
            return this.IconOrCategory.Icon;
    }

    get Name(): string
    {
        if (this.Index === 65536)
            return 'profile_page.title'
        else
            return 'category.' + (this.IconOrCategory as Svc.ICategory).Name;
    }

    get CategoryId(): string
    {
        return (this.IconOrCategory as Svc.ICategory).Id;
    }

    FileList?: Svc.TScriptFileList;
}
