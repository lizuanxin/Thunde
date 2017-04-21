import { Component, OnInit, Input, Output, AfterViewInit, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Slides } from 'ionic-angular';

const BODY = ['&#xe93d;','&#xe93e;','&#xe93f;','&#xe940;','&#xe941;','&#xe942;'];
const Massage = ['酸痛缓解','疲劳缓解','快速镇痛','搓揉','按压','肌肉放松'];

@Component({
  selector: 'comp-commonmode',
  template: `
    <ion-row [ngStyle]="VslideH" margin-top margin-bottom>
        <ion-col col-3 no-padding style="background-color:rgba(255,255,255,.1)">
            <ion-row no-padding VSideLeft #VLeftSide>
                <ion-col offset-2 col-8 no-padding text-center [class.active]="CurrentBodyValue === item" *ngFor="let item of BodyValues" (click)="SelectBody(item)" tappable>
                    <span app-icon [innerHTML]="item"></span> 
                    <ion-icon *ngIf = "CurrentBodyValue === item">&#xf488;</ion-icon>
                </ion-col>
            </ion-row>
        </ion-col>
        <ion-col col-7 text-center align-self-center>
            <ion-icon app-icon [ngStyle]="BodyFixScreen(0)">&#xe91b;</ion-icon>
        </ion-col>
        <ion-col col-2>
            <ion-row RSideTop>
                <ion-col col-12 text-center><ion-icon app-icon [ngStyle]="BodyFixScreen(1)">&#xe943;</ion-icon></ion-col>
                <ion-col col-12 text-center><ion-icon app-icon [ngStyle]="BodyFixScreen(1)">&#xe95a;</ion-icon></ion-col>
            </ion-row>
            <button ion-fab style="position:absolute;bottom:20px;left:-20px">
                <ion-icon>&#xf488;</ion-icon>
            </button>
        </ion-col>
    </ion-row>  
    <ion-row [ngStyle]="HslideH" Hslide align-items-center>
        <ion-col col-1>
            <ion-icon app-icon text-light translateLeft *ngIf="IsHArrowLeftShow">&#xe93c;</ion-icon>
        </ion-col>
        <ion-col col-10>
            <ion-slides [ngStyle]="HslideH" pager=false slidesPerView=3 (ionSlideDidChange)="HSlideChanged()" #HSlide>
                <ion-slide *ngFor="let item of MasValues" [class.active]="CurrentMasValue === item" (click)="SelectMas(item)"  text-center tappable>
                    <span>{{item}}</span>
                    <div DOT></div>
                </ion-slide>
            </ion-slides>
        </ion-col>
        <ion-col col-1>
            <ion-icon app-icon text-light translateRight *ngIf="IsHArrowRightShow">&#xe93c;</ion-icon>
        </ion-col>
    </ion-row>
  `,
})

export class ComponentCommonmode implements OnInit
{
  @ViewChild('HSlide') HSlides: Slides;
  @ViewChild('VLeftSide') VLSide: ElementRef;
  constructor(private Elements: ElementRef) 
  {
     
  }

  ngOnInit()
  {
    
     
      
  } 

  ngAfterViewInit() 
  {
    //   this.HSlides.lockSwipes(true);
      this.SetVLside();   
  }

  HSlideChanged()
  {
       let currentIndex = this.HSlides.getActiveIndex();
console.log(this.HSlides.length());

       if (currentIndex > 0)
            this.IsHArrowLeftShow = true;
       else
            this.IsHArrowLeftShow = false;
            
       if (currentIndex < (this.HSlides.length() - 3))
            this.IsHArrowRightShow = true;
       else
            this.IsHArrowRightShow = false;
        
       console.log(currentIndex);
       
  }

  VerticalSlideChanged()
  {
    
    // let slideItem = this.Vslides.container.children[0], IndexArr = [];
    // for (let i = 0; i < this.Vslides.length(); i++)
    // {
    //     let itemslide = slideItem.children[i] as HTMLElement;
    //     itemslide.style.color = "#333";
    //     if(slideItem.children[i].classList.contains('swiper-slide-active') || slideItem.children[i].classList.contains('swiper-slide-duplicate-active'))
    //     {
    //         IndexArr.push(i);
    //     }   
    // }
    // setTimeout(() => 
    // {
    //     if (IndexArr.length > 0) 
    //     {
    //         for (let i = 0; i < IndexArr.length; i++)
    //         {
    //             if (slideItem.children[IndexArr[i] + 2]) {
    //                 let activeItem = slideItem.children[IndexArr[i] + 2] as HTMLElement;
    //                 activeItem.style.color = 'red';
    //             }
                
    //         }
    //     }
    // })
    
    // let currentIndex = this.Vslides.getActiveIndex();
    // console.log("Current index is", currentIndex);
  }

  BodyFixScreen(n: number): Object
  {
      switch(n)
        {
          case 0: return { fontSize: Math.ceil(window.innerHeight * 0.5) + 'px' }
          case 1: return { fontSize: Math.ceil(window.innerWidth * 0.1) + 'px' }
        }
      
  }

  SelectBody(item: string)
  {
    return this.CurrentBodyValue = item;
  }

  SelectMas(item: string)
  {
    return this.CurrentMasValue = item;
  }

  SetVLside()
  {
      let VLS = this.VLSide.nativeElement, AvHeight;      
      AvHeight = Math.ceil(window.innerHeight * 0.6) / VLS.children.length; 

      for (let i = 0; i < VLS.children.length; i++)
      {        
        VLS.children[i].style.height = VLS.children[i].style.lineHeight = AvHeight + 'px';
        VLS.children[i].style.fontSize = '10vw';
        if (i < VLS.children.length - 1)
            VLS.children[i].style.borderBottom = 'solid 1px rgba(255,255,255,.5)';
      
      } 
  }

  get VslideH(): Object
  {
      return { height: this.VSLHeight + 'px' }
  }

  get HslideH(): Object
  {
      return { height: Math.ceil(window.innerHeight * 0.1) + 'px' }
  }

  BodyValues: Array<string> = BODY;
  MasValues: Array<string> = Massage;
  CurrentBodyValue: string = this.BodyValues[0];
  CurrentMasValue: string = this.MasValues[0];
  IsHArrowLeftShow: Boolean = false;
  IsHArrowRightShow: Boolean = true;
  VslideOption: Object;
  VSLHeight: number = Math.ceil(window.innerHeight * 0.6);

  

 
}