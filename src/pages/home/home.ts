import {Component, OnInit, OnDestroy} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo'
import * as View from '..'
import * as Svc from '../../providers';

@Component({selector: 'page-home', templateUrl: 'home.html'})
export class HomePage implements OnInit, OnDestroy
{
    constructor(private nav: NavController, private navParams: NavParams,
        private app: Svc.TApplication, private Asset: Svc.TAssetService, private Distribute: Svc.TDistributeService)
    {
    }

    ngOnInit(): void
    {
        this.Tabs.push(new TTabItem(0, Svc.const_data.Category.relax));
        this.Tabs.push(new TTabItem(1, Svc.const_data.Category.muscle_training));
        // this.Tabs.push(new TTabItem(2, Svc.const_data.Category.fat_burning));

        let ProfileTab = new TTabItem(65536, 0xE907)
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

    ngOnDestroy(): void
    {
    }

    SelectTab(Tab: TTabItem): void
    {
        this.ActiveTab = Tab;

        if (TypeInfo.Assigned(Tab.CategoryId) && ! TypeInfo.Assigned(Tab.FileList))
        {
            this.Asset.FileList(Tab.CategoryId)
                .then(List => Tab.FileList = List)
                .catch(err => console.log(err));
        };
    }

    SelectFile(ScriptFile: Svc.TScriptFile)
    {
        let params = this.navParams.data;
        params.ScriptFile = ScriptFile;
    }

    ProfileSwitch(id: string)
    {
        switch(id)
        {
        case 'faq':
            return this.ShowFAQ();
        case 'demo':
            return this.ShowDemo();
        case 'tou':
            this.ShowTOU();
        }
    }

    private ShowFAQ(): Promise<any>
    {
        console.log('FAQ');
        return Promise.resolve();
        // return this.nav.push(View.DemoPage)
    }

    private ShowDemo(): Promise<any>
    {
        return this.nav.push(View.DemoPage)
    }

    private ShowTOU(): Promise<any>
    {
        return this.nav.push(View.TouPage);
    }

    private Tabs: Array<TTabItem> = [];
    private ActiveTab: TTabItem;
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
