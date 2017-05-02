import {Component, OnInit, OnDestroy} from '@angular/core';
import {NavController, MenuController, Platform} from 'ionic-angular';
import {TypeInfo} from '../../UltraCreation/Core'

import * as View from '..'
import * as Svc from '../../providers';

@Component({selector: 'page-home', templateUrl: 'home.html'})
export class HomePage implements OnInit, OnDestroy
{
    constructor( private platform: Platform, public nav: NavController, private MenuCtrl: MenuController,
        private app: Svc.TApplication, private Asset: Svc.TAssetService)
    {
    }

    ngOnInit(): void
    {
        this.Tabs.push({Index: 0, Category: Svc.const_data.Category.relax});
        this.Tabs.push({Index: 1, Category: Svc.const_data.Category.muscle_training});
        this.Tabs.push({Index: 2, Category: Svc.const_data.Category.fat_burning});
        this.SelectTab(this.Tabs[0]);

        if (! this.app.AcceptedTerms)
        {
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
    }

    ngOnDestroy(): void
    {
    }

    ShowDemo()
    {
        this.MenuCtrl.close()
            .then(() => this.nav.push(View.DemoPage))
    }

    ShowTOU()
    {
        return this.MenuCtrl.close()
            .then(() => this.nav.push(View.TouPage));
    }

    SelectTab(Tab: ITabItem): void
    {
        this.ActiveTab = Tab;

        if (! TypeInfo.Assigned(Tab.FileList))
        {
            this.Asset.FileList(Tab.Category.Id)
                .then(List => Tab.FileList = List)
                .then(() => this.ActiveTab = Tab)
                .catch(err => console.log(err));
        };
    }

    SelectFile(ScriptFile: Svc.TScriptFile)
    {
        console.log(ScriptFile);

        /*
        if (! Loki.TShell.IsUsbPlugin)
        {
            if (this.DeviceList.length === 1)
                this.Start(this.DeviceList[0].id);
            else
                this.IsShowingDeviceList = true;
        }
        else
            this.Start('USB');
        */
    }

    private Tabs: Array<ITabItem> = [];
    private ActiveTab: ITabItem;
}

interface ITabItem
{
    Index: number;
    Category: Svc.ICategory;
    FileList?: Svc.TScriptFileList;
}
