import {Component, OnInit, OnDestroy} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {TApplication} from '../services';

@Component({selector: 'page-skin', templateUrl: 'skin.html'})
export class SkinPage implements OnInit, OnDestroy
{
    constructor(public nav: NavController, public navParams: NavParams, private app: TApplication)
    {

    }

    ngOnInit(): void
    {
    }

    ngOnDestroy(): void
    {

    }

    SelectSkin(Skin: string)
    {
        this.app.SetSkin(Skin);
        this.nav.popToRoot();
    }
}
