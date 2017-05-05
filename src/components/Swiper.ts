import {Component, Input, ElementRef, AfterViewChecked, AfterViewInit, NgZone} from '@angular/core';
/**
 *  to get Swiper
 *  npm install swiper
 *  npm install @types/swiper
 */
import 'swiper';

@Component({selector: 'swiper',
    template: `<div [ngClass]="{'swiper-container': config?.containerModifierClass === undefined}">
        <ng-content></ng-content></div>`,
    styles: [':host {display: block;}', ':host > div {width: 100%;height: 100%;}']
})
export class SwiperComp implements AfterViewChecked, AfterViewInit
{
    constructor(private Ref: ElementRef, private ngZone: NgZone)
    {

    }

    ngOnDestroy()
    {
        console.log('swiper component destroyed');
    }

    ngAfterViewInit()
    {
        this.Wrapper = this.Ref.nativeElement.querySelector('.swiper-wrapper');
        this.Instance = new Swiper(this.Ref.nativeElement.querySelector('swiper > div'), this.Config);
    }

    ngAfterViewChecked()
    {
        /*
        if (this.Wrapper && this.slideCount !== this.Wrapper.childElementCount)
        {
            this.slideCount = this.Wrapper.childElementCount;
            this.Instance.slideTo(0, 0);
            this.Instance.update();
        }
        */
    }

    Update(): Promise<void>
    {
        if (! this.Refreshing)
        {
            this.Refreshing = new Promise<void>((resolve, reject) =>
            {
                setTimeout(() =>
                {
                    this.Instance.slideTo(0, 0);
                    this.Instance.update();
                    this.Refreshing = null;

                    resolve();
                }, 0);
            })
        }

        return this.Refreshing;
    }

    Instance: Swiper;
    @Input() Config: SwiperOptions;

    private Wrapper: HTMLElement;
    private Refreshing: Promise<void>;
}
