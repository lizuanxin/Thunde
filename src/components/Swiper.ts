import {Component, Input, Output, EventEmitter, ElementRef, AfterViewInit, NgZone} from '@angular/core';
/**
 *  to get Swiper
 *  npm install swiper
 *  npm install @types/swiper
 */
import 'swiper';

@Component({selector: 'swiper',
    template: `<div [ngClass]="{'swiper-container': config?.containerModifierClass === undefined}">
        <ng-content></ng-content></div>`,
    styles: [':host {display: block; height: 100%;}',':host > div {width: 100%; height: 100%; overflow: hidden}']
})

export class SwiperComp implements AfterViewInit
{
    constructor(private Ref: ElementRef, private ngZone: NgZone)
    {
    }

    ngAfterViewInit()
    {
        this.Wrapper = this.Ref.nativeElement.querySelector('.swiper-wrapper');

        this.Instance = new Swiper(this.Ref.nativeElement.querySelector('swiper > div'), this.Config);
        this.HookSwiperEvents();
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

                    this.LastActiveIndex = undefined;
                    this.CheckSlideChanging();
                    resolve();
                }, 0);
            })
        }

        return this.Refreshing;
    }

    Instance: Swiper;

    @Input() Config: SwiperOptions;

    // onInit(swiper)       function    Callback function, will be executed right after Swiper initialization
    // onDestroy(swiper)    function    Callback function, will be executed when you destroy Swiper

    @Output() OnSlideChanged = new EventEmitter<number>();

    /** 300ms delay */
    @Output() OnClick = new EventEmitter<{Inst: Swiper, ev: TouchEvent}>();
    /** no delay */
    @Output() OnTap = new EventEmitter<{Inst: Swiper, ev: TouchEvent}>();
    @Output() OnDoubleTap = new EventEmitter<{Inst: Swiper, ev: TouchEvent}>();

    @Output() OnImagesReady = new EventEmitter<Swiper>();

    /**  will be executed when Swiper progress is changed, as second arguments it receives progress that is always from 0 to 1 */
    @Output() OnProgress = new EventEmitter<{Inst: Swiper, Progress: number}>();

    @Output() OnReachBeginning = new EventEmitter<Swiper>();
    @Output() OnReachEnd = new EventEmitter<Swiper>();

    /** Same as onSlideChangeStart but caused by autoplay */
    @Output() OnAutoplay = new EventEmitter<Swiper>();
    @Output() OnAutoplayStart = new EventEmitter<Swiper>();
    @Output() OnAutoplayStop = new EventEmitter<Swiper>();
    /*
    onSetTranslate(swiper, translate) 	function 		Callback function, will be executed when swiper's wrapper change its position. Receives swiper instance and current translate value as an arguments
    onSetTransition(swiper, transition) 	function 		Callback function, will be executed everytime when swiper starts animation. Receives swiper instance and current transition duration (in ms) as an arguments
    onLazyImageLoad(swiper, slide, image) 	function 		Callback function, will be executed in the beginning of lazy loading of image
    onLazyImageReady(swiper, slide, image) 	function 		Callback function, will be executed when lazy loading image will be loaded
    onPaginationRendered(swiper, paginationContainer) 	function 		Callback function, will be executed after pagination elements generated and added to DOM
    onScroll(swiper, e) 	function 		Callback function, will be executed when slider sliding or scrolling happens with mousehweel control
    onBeforeResize(swiper) 	function 		Callback function, will be executed on window resize right before swiper's onresize manipulation
    onAfterResize(swiper) 	function 		Callback function, will be executed on window resize right after swiper's onresize manipulation
    onKeyPress(swiper, kc) 	function 		Callback function, will be executed on "keydown" event when keyboard control is enabled
    */
    private HookSwiperEvents()
    {
        /* all these can not simply use to decide slide changed
        (this.Instance as any).on('slideChangeStart', (Inst: Swiper) => this.OnSlideChangeStart.next(Inst));
        (this.Instance as any).on('slideChangeEnd', (Inst: Swiper) => this.OnSlideChangeEnd.next(Inst));
        (this.Instance as any).on('slideNextStart', (Inst: Swiper) => this.OnSlideNextStart.next(Inst));
        (this.Instance as any).on('slideNextEnd', (Inst: Swiper) => this.OnSlideNextEnd.next(Inst));
        (this.Instance as any).on('slidePrevStart', (Inst: Swiper) => this.OnSlidePrevStart.next(Inst));
        (this.Instance as any).on('slidePrevEnd', (Inst: Swiper) => this.OnSlidePrevEnd.next(Inst));
        (this.Instance as any).on('transitionStart', (Inst: Swiper) => this.OnTransitionStart.next(Inst));
        (this.Instance as any).on('transitionEnd', (Inst: Swiper) => this.OnTransitionEnd.next(Inst));

        (this.Instance as any).on('touchStart', (Inst: Swiper, ev: TouchEvent) => this.OnTouchStart.next({Inst: Inst, ev: ev}));
        (this.Instance as any).on('touchMove', (Inst: Swiper, ev: TouchEvent) => this.OnTouchMove.next({Inst: Inst, ev: ev}));
        (this.Instance as any).on('touchMoveOpposite', (Inst: Swiper, ev: TouchEvent) => this.OnTouchMoveOpposite.next({Inst: Inst, ev: ev}));
        (this.Instance as any).on('slidesMove', (Inst: Swiper, ev: TouchEvent) => this.OnSlidesMove.next({Inst: Inst, ev: ev}));
        (this.Instance as any).on('touchEnd', (Inst: Swiper, ev: TouchEvent) => this.OnTouchEnd.next({Inst: Inst, ev: ev}));
        */
        (this.Instance as any).on('touchEnd', (Inst: Swiper, ev: TouchEvent) => this.CheckSlideChanging());

        (this.Instance as any).on('click', (Inst: Swiper, ev: TouchEvent) => this.OnClick.next({Inst: Inst, ev: ev}));
        (this.Instance as any).on('tap', (Inst: Swiper, ev: TouchEvent) => this.OnTap.next({Inst: Inst, ev: ev}));
        (this.Instance as any).on('doubleTap', (Inst: Swiper, ev: TouchEvent) => this.OnDoubleTap.next({Inst: Inst, ev: ev}));

        (this.Instance as any).on('imagesReady', (Inst: Swiper) => this.OnImagesReady.next(Inst));

        (this.Instance as any).on('progress', (Inst: Swiper, Progress: number) => this.OnProgress.next({Inst: Inst, Progress: Progress}));

        (this.Instance as any).on('reachBeginning', (Inst: Swiper) => this.OnReachBeginning.next(Inst));
        (this.Instance as any).on('reachEnd', (Inst: Swiper) => this.OnReachEnd.next(Inst));

        (this.Instance as any).on('autoplay', (Inst: Swiper) => this.OnAutoplay.next(Inst));
        (this.Instance as any).on('autoplayStart', (Inst: Swiper) => this.OnAutoplayStart.next(Inst));
        (this.Instance as any).on('autoplayStop', (Inst: Swiper) => this.OnAutoplayStop.next(Inst));
    }

    private CheckSlideChanging()
    {
        setTimeout(() =>
        {
            if (this.LastActiveIndex !== this.Instance.activeIndex)
            {
                this.OnSlideChanged.next(this.Instance.activeIndex);
                this.LastActiveIndex = this.Instance.activeIndex;
            }
        });
    }

    private Wrapper: HTMLElement;
    private Refreshing: Promise<void>;
    private LastActiveIndex: number;
}
