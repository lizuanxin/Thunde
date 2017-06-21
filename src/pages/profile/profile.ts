import {Component, OnInit} from '@angular/core';
import * as Svc from '../../providers'

import {TouPage} from './tou/tou'
import {FaqPage} from './faq/faq'
import {DemoPage} from '..'

@Component({selector: 'page-profile', templateUrl: 'profile.html'})
export class ProfilePage implements OnInit
{
    constructor(public app: Svc.TApplication)
    {
    }

    ngOnInit()
    {
        this.app.IsSupportedOTG().then(value => this.IsSupportedOTG = value);
    }

    ShowFAQ(): Promise<any>
    {
        return this.app.Nav.push(FaqPage)
    }

    ShowDemo(): Promise<any>
    {
        return this.app.Nav.push(DemoPage)
    }

    ShowTOU(): Promise<any>
    {
        return this.app.Nav.push(TouPage);
    }

    private IsSupportedOTG: boolean;
}
