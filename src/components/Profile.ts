import {Component, Output, EventEmitter} from '@angular/core';
import * as Svc from '../providers'

@Component({selector: 'profile', templateUrl: 'Profile.html',
})
export class Profile
{
    constructor(private app: Svc.TApplication)
    {

    }

    @Output() OnSelection = new EventEmitter<string>();
}
