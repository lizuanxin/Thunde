import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import * as Svc from '../providers'

@Component({selector: 'profile', templateUrl: 'Profile.html',
})
export class Profile implements OnInit
{
    constructor(private app: Svc.TApplication)
    {

    }

    ngOnInit()
    {
        this.app.IsSupportedOTG().then(value => 
        {
            if (value)
                this.OTG_Value = 'yes'
            else
                this.OTG_Value = 'no'
        });
    }

    @Output() OnSelection = new EventEmitter<string>();

    OTG_Value: string;
}
