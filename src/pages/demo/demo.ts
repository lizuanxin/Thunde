import { Component, OnInit, OnDestroy,Renderer,ElementRef,ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

const STEP = [1,2,3,4,5,6,7,8,9,10,11,12];

@Component({
  selector: 'page-demo',
  templateUrl: 'demo.html',
})

export class DemoPage implements OnInit, OnDestroy
{
    @ViewChild('body') body : ElementRef;
    @ViewChild('arrowPoint') arrowPoint: ElementRef;
    @ViewChild('key') key: ElementRef;
    @ViewChild('line1') line1 : ElementRef;
    @ViewChild('line2') line2 : ElementRef;
    @ViewChild('line3') line3 : ElementRef;
    @ViewChild('line4') line4 : ElementRef;
    @ViewChild('describe1') describe1: ElementRef;
    @ViewChild('describe2') describe2: ElementRef;
    @ViewChild('describe3') describe3: ElementRef;
    @ViewChild('describe4') describe4: ElementRef;
    @ViewChild('num1') num1: ElementRef;
    @ViewChild('num2') num2: ElementRef;
    @ViewChild('num3') num3: ElementRef;
    @ViewChild('num4') num4: ElementRef;
    @ViewChild('ready') ready: ElementRef;

    constructor(public navCtrl: NavController, public navParams: NavParams,public renderer: Renderer)
    {}

    ngOnInit(): void
    {      

        this.AnimationFlow();  
 
    }

    AnimateFade(Agrement, Array, Duration: number)
    {
        this.renderer.invokeElementMethod(
            Agrement.nativeElement,
            'animate',
            [
                Array,
                {
                duration: Duration,
                delay: 0,
                fill: 'forwards'
                }   
            ]
        );
    }
  
    ngOnDestroy(): void 
    {

    }

    AnimationFlow()
    {
        if (!this.TypeMode) this.TypeMode = STEP[0];
        let width = window.innerWidth, height = width * 1.5;
        let time = 0, step = 0;  
        let Animation = () =>
        {
            time += 0.02;
            if (time <= 2){
                switch(this.TypeMode)
                {
                    case STEP[0]:           
                        this.AnimateFade(this.body, [{ opacity: 0,transform:'translateY(50px)' }, { opacity: 1,transform:'translateY(0)' }], 1000);
                        break;
                    case STEP[1]: 
                        this.AnimateFade(this.line1, [{ opacity: 0,transform:'scale(.5)'}, { opacity: 1,transform:'scale(1)'}], 500);                       
                        this.AnimateFade(this.describe1, [{ opacity: 0, left: width * 0.62 + 'px', top: height * 0.16 + 'px' }, { opacity: 1, left: width * 0.62 + 'px', top: height * 0.12 + 'px' }], 1500);
                        break;
                    case STEP[2]:
                        this.AnimateFade(this.num1, [{ opacity: 0, left: width * 0.88 + 'px', top: height * 0.06 + 'px' }, { opacity: 1, left: width * 0.88 + 'px', top: height * 0.14 + 'px' }], 1000);
                        break;
                    case STEP[3]:
                        break;
                    case STEP[4]:
                        this.AnimateFade(this.describe2, [{ opacity: 0, left: width * 0.85 + 'px', top: height * 0.35 + 'px',transform:'translateY(0)' }, { opacity: 1, left: width * 0.85 + 'px', top: height * 0.35 + 'px',transform:'translateY(0)' }], 1000);
                        break;
                    case STEP[5]:
                        this.AnimateFade(this.line2, [{ opacity: 0,transform:'scale(.5)'}, { opacity: 1,transform:'scale(1)'}], 500);
                        this.AnimateFade(this.num2, [{ opacity: 0, left: width * 0.88 + 'px', top: height * 0.52 + 'px' }, { opacity: 1, left: width * 0.88 + 'px', top: height * 0.56 + 'px' }], 500);
                        break;
                    case STEP[6]:
                        this.AnimateFade(this.arrowPoint, [{ opacity: 0, fontSize: '1rem', left: width * 0.74 + 'px', top: height * 0.6 + 'px' }, { opacity: 1, fontSize: '6rem', left: width * 0.64 + 'px', top: height * 0.6 + 'px' }], 600);                        
                        this.AnimateFade(this.key, [{ opacity: 0,left: width * 0.36 + 'px', top: height * 0.5 + 'px'}, { opacity: 1,left: width * 0.26 + 'px', top: height * 0.55 + 'px'}], 1000); 
                        break;
                    case STEP[7]:
                        this.AnimateFade(this.line3, [{ opacity: 0,transform:'scale(.5)'}, { opacity: 1,transform:'scale(1)'}], 500);
                        this.AnimateFade(this.describe3, [{ opacity: 0, left: width * 0.18 + 'px', top: height * 0.5 + 'px' }, { opacity: 1, left: width * 0.18 + 'px', top: height * 0.52 + 'px' }], 1000);
                        break;
                    case STEP[8]:
                        this.AnimateFade(this.num3, [{ opacity: 0, left: -width * 0.04 + 'px', top: height * 0.54 + 'px' }, { opacity: 1, left: width * 0.04 + 'px', top: height * 0.54 + 'px' }], 1000);
                        break;
                    case STEP[9]:
                        break;
                    case STEP[10]:
                        this.AnimateFade(this.line4, [{ opacity: 0,transform:'scale(.5)'}, { opacity: 1,transform:'scale(1)'}], 500);
                        this.AnimateFade(this.describe4, [{ opacity: 0, left: width * 0.18 + 'px', top: height * 0.82 + 'px' }, { opacity: 1, left: width * 0.18 + 'px', top: height * 0.84 + 'px' }], 1000);
                        break;
                    case STEP[11]:
                        this.AnimateFade(this.num4, [{ opacity: 0, left: -width * 0.04 + 'px', top: height * 0.86 + 'px' }, { opacity: 1, left: width * 0.04 + 'px', top: height * 0.86 + 'px' }], 1000);
                        this.AnimateFade(this.ready, [{ opacity: 0, marginTop: '-70px' }, { opacity: 1, marginTop: '-50px' }], 1500);
                        break;
                }      
            } else {

                if (step + 1 === STEP.length) return;
                time = 0;                								
                step += 1;                    
                this.TypeMode = STEP[step];
            }

            requestAnimationFrame(Animation);           
                
        }
        Animation();
    }

    SetTipsClass(n:number): string
    {        
        switch(n){
            case 1:
                if (this.TypeMode > STEP[1]) return 'animateTips';
            case 2:
                if (this.TypeMode > STEP[3]) return 'animateTips';
            case 3:
                if (this.TypeMode > STEP[9]) return 'animateTips';            
        } 
    }

    SetTipsStyle(n: number): Object 
    {
        let width = window.innerWidth, height = width * 1.5;

        switch (n) {
            case 0:
                return { width: '5rem', height: '5rem', left: width * 0.40 + 'px', top: height * 0.15 + 'px' }
            case 1:
                return { width: '2rem', height: '2rem', left: width * 0.83 + 'px', top: height * 0.455 + 'px' }
            case 2:
                return { width: '4rem', height: '4rem', left: width * 0.62 + 'px', top: height * 0.75 + 'px' }
        }
    }

    SetElement(Str: string): Object
    {
        let width = window.innerWidth, height = width * 1.5, colorYellow = "#f4e827", colorLight = "#FFFFFF", colorLightOpacity = 'rgba(255,255,255,.5';

        switch(Str){
            case 'body':
                return { fontSize: '80vw', transformOrigin: 'center bottom' }
            case 'num':
                return { fontSize: '3rem', color: colorYellow }
            case 'arrowPoint':
                return { color: colorLightOpacity, transform: 'rotate(-155deg)' }
            case 'key':
                return { fontSize: '60vw', color: colorLight}
            case 'line1':
                return { opacity: 0, zIndex: 0, fontSize: '50vw', color: colorYellow, left: width * 0.5 + 'px', top: height * 0.02 + 'px', transformOrigin: 'left center' }
            case 'line2':
                return { opacity: 0, zIndex: 0, fontSize: '10vw', color: colorYellow, left: width * 0.87 + 'px', top: height * 0.49 + 'px', transformOrigin: 'left top' }
            case 'line3':
                return { opacity: 0, zIndex: 0, fontSize: '50vw', color: colorYellow, left: width * 0.14 + 'px', top: height * 0.46 + 'px', transformOrigin: 'right bottom' }
            case 'line4':
                return { opacity: 0, zIndex: 0, fontSize: '72vw', color: colorYellow, left: width * 0.14 + 'px', top: height * 0.62 + 'px', transformOrigin: 'right center' }
            case 'describe1':
                return { fontSize: '1.6rem', color: colorYellow }
            case 'describe2':
                return { fontSize: '1.2rem', lineHeight: '1.4rem', color: colorYellow, transformOrigin: 'center bottom' }
            case 'describe3':
                return { fontSize: '1.6rem', color: colorYellow }
            case 'describe4':
                return { fontSize: '1.6rem', color: colorYellow }

        }
    }

    TypeMode:number = STEP[0];

}
