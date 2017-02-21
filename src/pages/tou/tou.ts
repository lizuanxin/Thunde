import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {TApplication, TLocalizeService} from '../services';

@Component({selector: 'page-tou', templateUrl: 'tou.html'})
export class TouPage
{
    constructor(public nav: NavController, public app: TApplication, private Localize: TLocalizeService)
    {
        this.IsFirstTime = ! app.AcceptedTerms;
    }

    get TopArea(): string
    {
        let topArea = Math.trunc(screen.height / 5);
        return topArea + 'px';
    }

    public IsFirstTime: boolean = true;
}
