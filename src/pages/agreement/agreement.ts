import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TApplication, TLocalizeService } from '../services';

@Component({ selector: 'page-agreement', templateUrl: 'agreement.html' })
export class AgreementPage {

    constructor(public nav: NavController, public app: TApplication, private Localize: TLocalizeService) {
        this.IsFirstTime = !app.AcceptedTerms;
    }

    ionViewDidLoad() {
        this.Touch.Outer = document.getElementById('OuterHtml');
        this.Touch.Inner = document.getElementById('InnerHtml');
        this.Touch.Outer.addEventListener("touchstart", this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener("touchmove", this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener("touchend", this.TouchHandler.bind(this));
    }

    get TopArea(): string {
        let topArea = Math.trunc(screen.height / 5)
        return topArea + 'px';
    }

    get OffsetY(): string {
        if (this.Touch.y < 0) return;
        if (this.Touch.y > 70) this.Touch.y = 70;
        return this.Touch.y + 'px';
    }

    get FadeOut(): string {
        if (this.Touch.y === 0) return 'fadeOut';
    }

    private TouchHandler(e: TouchEvent) {
        switch (e.type) {
            case 'touchstart':
                //起始Y坐标
                this.Touch.Start_Y = e.touches[0].pageY;
                break;
            case 'touchmove':
                //滑动Y距离                
                this.Touch.y = e.touches[0].pageY - this.Touch.Start_Y;
                this.OffsetY;
                break;
            case 'touchend':
                setTimeout(() => this.Touch.y = 0);
                break;

        }

    }

    public IsFirstTime: boolean = true;
    private Touch = new TouchParam();
}

class TouchParam {
    Outer: any;
    Inner: any;
    Start_X: number;
    Start_Y: number;
    x: number;
    y: number = 0;
}