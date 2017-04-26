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
        this.Categories = this.Asset.Categories;
        this.SelectedCategory = this.Categories[0];

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

    ionViewDidEnter()
    {
        //this.app.SetSkin(this.app.Skins[2]);
        if (! TypeInfo.Assigned(this.SelectedCategory))
            this.SelectCategory(this.Categories[0]);
    }

    SelectCategory(Category: Svc.TCategory)
    {
        this.SelectedCategory = Category;
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

    SelectFile(ScriptFile: Svc.TScriptFile)
    {
        this.Asset.FileDesc(ScriptFile)
            .then(() => this.nav.push(View.GoPage, {Category: this.SelectedCategory, ScriptFile: ScriptFile}));
    }

    get PageIndex(): number
    {
        switch(this.SelectedCategory.Id)
        {
        case Svc.const_data.Category.relax.Id:
            return 0;
        case Svc.const_data.Category.muscle_training.Id:
            return 1;
        case Svc.const_data.Category.fat_burning.Id:
            return 2;
        }
    }

    Categories: Array<Svc.TCategory>;
    SelectedCategory: Svc.TCategory;
}
