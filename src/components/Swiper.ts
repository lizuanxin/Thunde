import {Component, Input,ElementRef, AfterViewChecked, AfterViewInit, NgZone} from '@angular/core';
/// npm install @types/swiper
import 'swiper';

@Component({selector: 'swiper',
    template: `<div [ngClass]="{'swiper-container': config?.containerModifierClass === undefined }"><ng-content></ng-content></div>`,
    styles: [':host {display: block;}', ':host > div {width: 100%;height: 100%;}']
})
export class SwiperComp implements AfterViewChecked, AfterViewInit
{
    constructor(private elementRef: ElementRef, private ngZone: NgZone)
    {

    }

    ngAfterViewInit()
    {
        this.swiperWrapper = this.elementRef.nativeElement.querySelector('.swiper-wrapper');
        this.slideCount = this.swiperWrapper.childElementCount;
        this.Swiper = new Swiper(this.elementRef.nativeElement.querySelector('swiper > div'), this.config);
    }

    ngAfterViewChecked()
    {
        if (this.swiperWrapper && this.slideCount !== this.swiperWrapper.childElementCount)
        {
            this.slideCount = this.swiperWrapper.childElementCount;
            this.Swiper.update();
        }
    }

    @Input() config: SwiperOptions;

    Swiper: Swiper;
    private swiperWrapper: any;
    private slideCount = 0;
}
