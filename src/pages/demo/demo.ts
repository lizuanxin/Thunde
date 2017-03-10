import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as UI from '../../UltraCreation/Graphic';

@Component({
  selector: 'page-demo',
  templateUrl: 'demo.html'
})
export class DemoPage implements OnInit, OnDestroy {

  constructor(public navCtrl: NavController, public navParams: NavParams) { }

  ngOnInit(): void
  { 
    this.Canvas = document.getElementById("demo_canvas") as HTMLCanvasElement;     
    this.Ctx = this.Canvas.getContext('2d'); 
    let width = window.innerWidth * window.devicePixelRatio;
    let height = window.innerHeight * window.devicePixelRatio;
    this.Canvas.style.width = width.toString();
    this.Canvas.style.height = height.toString();
    this.Canvas.width = width;
    this.Canvas.height = height;    
    this.DrawBody();
    // this.DrawStick();
    // this.DrawLine();
  }  
  
  ngOnDestroy(): void 
  {
    
  }

  DrawBody()
  {
    this.Ctx.save();
    let fontsize = 30 * window.devicePixelRatio;
    this.Ctx.font = fontsize + 'px Thundericons';
    console.log(this.Ctx.font)
    let Str: string = String.fromCharCode(0xe91f); 
    let text = this.Ctx.measureText(Str);
    
    this.Ctx.fillStyle = "#FFFFFF";
    let x = (window.innerWidth-text.width) * window.devicePixelRatio; 
    let y = 120 * window.devicePixelRatio;
    console.log(y)
    this.Ctx.fillText(Str,0,y);
    this.Ctx.restore();
  }

  DrawStick()
  {
    this.Ctx.save();
    this.Ctx.font = new UI.TFont('Thundericons', 28, UI.TFontStyle.Normal).toString();
    let Str: string = String.fromCharCode(0xe930);
    this.Ctx.fillStyle = "#FFFFFF";  
    this.Ctx.fillText(Str,150,150);
    this.Ctx.restore();
  }

  DrawLine()
  {
    this.Ctx.save();
    this.Ctx.font = new UI.TFont('Thundericons', 80, UI.TFontStyle.Normal).toString();
    let Str: string = String.fromCharCode(0xe91d);
    this.Ctx.fillStyle = "#FFFFFF";  
    this.Ctx.fillText(Str,150,400);
    this.Ctx.restore();
  } 

  ionViewDidLoad() {
    console.log('ionViewDidLoad DemoPage');
  }

  get ScreenHeight(): string
  {
    return screen.height + 'px';
  }


  private Canvas: HTMLCanvasElement;
  Ctx: CanvasRenderingContext2D;
  DisplayHeight:number;

}
