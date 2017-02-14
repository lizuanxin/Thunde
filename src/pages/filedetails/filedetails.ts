import {Component } from '@angular/core';
import {NavController,ViewController, NavParams} from 'ionic-angular';
import {TApplication} from '../services';

@Component({selector: 'page-filedetails', templateUrl: 'filedetails.html'})
export class FiledetailsPage
{
    constructor(public navCtrl: NavController, public navParams: NavParams,private view: ViewController,private app: TApplication)
    {
        this.FileDetails = navParams.get('FileDetails');
        /*
        console.log(JSON.stringify(this.FileDetails));
        */
    }

    dismiss() {
        this.view.dismiss();
    }

    FileDetails = [];
}
