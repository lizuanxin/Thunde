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

    ngAfterViewInit()
    {
        this.Div = this.Ref.nativeElement.querySelector('.swiper-wrapper');
        this.slideCount = this.Div.childElementCount;
        this.Instance = new Swiper(this.Ref.nativeElement.querySelector('swiper > div'), this.config);

        console.log(this.Ref.nativeElement);

    }

    ngAfterViewChecked()
    {
        console.log('after view checked');

        if (this.Div && this.slideCount !== this.Div.childElementCount)
        {
            this.slideCount = this.Div.childElementCount;
            this.Instance.activeIndex = 0;
            this.Instance.update();
        }
    }

    @Input() config: SwiperOptions;

    Instance: Swiper;
    private Div: HTMLElement;
    private slideCount = 0;
}
