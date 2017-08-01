import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import * as Demo from '../../demo';

@Component({selector: 'page-tou', templateUrl: 'tou.html'})
export class TouPage implements OnInit, OnDestroy, AfterViewInit
{
    constructor()
    {
    }

    ngOnInit()
    {
        this.IsFirstTime = ! App.AcceptedTerms;

        if (this.IsFirstTime)
            App.DisableHardwareBackButton();
    }

    ngOnDestroy()
    {
        App.EnableHardwareBackButton();
    }

    ngAfterViewInit()
    {
        this.Touch.Outer = document.getElementById('OuterHtml');
        this.Touch.Outer.addEventListener('touchstart', this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener('touchmove', this.TouchHandler.bind(this));
        this.Touch.Outer.addEventListener('touchend', this.TouchHandler.bind(this));
    }

    Submit()
    {
        App.Nav.pop()
            .then(() =>
            {
                if (this.IsFirstTime)
                    App.Nav.push(Demo.StartPage);
            });
    }

    get TopArea(): string
    {
        let topArea = Math.trunc(screen.height / 5);
        return topArea + 'px';
    }

    get FadeOut(): string
    {
        if (this.Touch.y === 0)
            return 'fadeOut';
    }

    get OffsetY(): string | undefined
    {
        if (this.Touch.y < 0)
            return undefined;

        if (this.Touch.y > 70) this.Touch.y = 70;
        return this.Touch.y + 'px';
    }

    private TouchHandler(e: TouchEvent): void
    {
        switch (e.type)
        {
        case 'touchstart':
            this.Touch.Start_Y = e.touches[0].pageY;
            break;
        case 'touchmove':
            this.Touch.y = e.touches[0].pageY - this.Touch.Start_Y;
            // this.OffsetY;
            break;
        case 'touchend':
            setTimeout(() => this.Touch.y = 0);
            break;
        }
    }


    App = window.App;

    private IsFirstTime: boolean = true;
    private Touch = new TouchParam();
}

class TouchParam
{
    Outer: any;
    Start_Y: number;
    y: number = 0;
}
