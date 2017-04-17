import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {NavController} from 'ionic-angular';

import {TApplication, TAssetService} from '../services';
import {DemoPage} from '../demo/demo';

@Component({selector: 'page-tou', templateUrl: 'tou.html'})
export class TouPage implements OnInit, OnDestroy, AfterViewInit
{
    constructor(public nav: NavController, public app: TApplication, private AssetSvc: TAssetService)
    {
    }

    ngOnInit()
    {
        this.IsFirstTime = ! this.app.AcceptedTerms;

        if (this.IsFirstTime)
            this.app.DisableHardwareBackButton();
    }

    ngOnDestroy()
    {
        this.app.EnableHardwareBackButton();
    }

    ngAfterViewInit()
    {
        this.Touch.Outer = document.getElementById('OuterHtml');
        this.Touch.Outer.addEventListener("touchstart", this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener("touchmove", this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener("touchend", this.TouchHandler.bind(this));
    }

    Submit()
    {
        this.nav.pop()
            .then(() =>
            {
                if (this.IsFirstTime)
                    this.nav.push(DemoPage);
            });
    }

    get TopArea(): string
    {
        let topArea = Math.trunc(screen.height / 5);
        return topArea + 'px';
    }

    get FadeOut(): string
    {
        if (this.Touch.y === 0) return 'fadeOut';
    }

    get OffsetY(): string
    {
        if (this.Touch.y < 0) return;
        if (this.Touch.y > 70) this.Touch.y = 70;
        return this.Touch.y + 'px';
    }

    private TouchHandler(e: TouchEvent)
    {
        switch (e.type)
        {
            case 'touchstart':
                this.Touch.Start_Y = e.touches[0].pageY;
                break;
            case 'touchmove':
                this.Touch.y = e.touches[0].pageY - this.Touch.Start_Y;
                this.OffsetY;
                break;
            case 'touchend':
                setTimeout(() => this.Touch.y = 0);
                break;
        }
    }

    public IsFirstTime: boolean = true;
    public Touch = new TouchParam();
}

class TouchParam
{
    Outer: any;
    Start_Y: number;
    y: number = 0;
}
