import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {TApplication, TLocalizeService, TAssetService} from '../services';

import {DemoPage} from '../demo/demo';

@Component({selector: 'page-tou', templateUrl: 'tou.html'})
export class TouPage
{
    constructor(public nav: NavController, public app: TApplication, private Localize: TLocalizeService, private AssetSvc: TAssetService)
    {
        this.IsFirstTime = ! app.AcceptedTerms;
        this.AssetSvc.GetKey("DEMO_MODE")
            .then((value: boolean) => this.IsDemoModeUsed = value)
            .catch(err => console.log(err.message));
    }

    ionViewDidLoad()
    {
        this.Touch.Outer = document.getElementById('OuterHtml');
        this.Touch.Outer.addEventListener("touchstart", this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener("touchmove", this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener("touchend", this.TouchHandler.bind(this));
    }

    Submit()
    {
        if (this.IsDemoModeUsed)
        {
            this.nav.pop();
        }
        else
        {
            this.app.ShowAlert(
                {
                    title: 'Demo Mode',
                    message: this.Localize.Translate('hint.show_demo_mode') as string,
                    buttons: [
                                {
                                    text: this.Localize.Translate('button.cancel') as string,
                                    handler: ()=> this.nav.pop(),
                                    role: 'cancel'
                                },
                                {
                                    text: this.Localize.Translate('button.ok') as string,
                                    handler: ()=> setTimeout(this.ShowDemoMode(), 0)
                                }
                            ]
                });
        }
    }

    ShowDemoMode()
    {
        this.app.SetSkin(this.app.Skins[1]);
        this.nav.push(DemoPage);
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

    private IsDemoModeUsed: boolean = false;
    public IsFirstTime: boolean = true;
    public Touch = new TouchParam();
}

class TouchParam
{
    Outer: any;
    Start_Y: number;
    y: number = 0;
}
