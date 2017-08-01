import {Component, OnInit} from '@angular/core';

import * as Demo from '../demo';
import {TouPage} from './tou/tou';
import {FaqPage} from './faq/faq';

@Component({selector: 'page-profile', templateUrl: 'profile.html'})
export class ProfilePage implements OnInit
{
    constructor()
    {
    }

    ngOnInit()
    {
        App.IsSupportedOTG().then(value => this.IsSupportedOTG = value);
    }

    ShowFAQ(): Promise<any>
    {
        return App.Nav.push(FaqPage);
    }

    ShowDemo(): Promise<any>
    {
        return App.Nav.push(Demo.StartPage);
    }

    ShowTOU(): Promise<any>
    {
        return App.Nav.push(TouPage);
    }

    private IsSupportedOTG: boolean;
}
