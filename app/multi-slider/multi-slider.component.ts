import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, forwardRef, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-multi-slider',
  template: `
    <div class="component-container">
      <canvas
        #sliderCanvas
        width="100%"
        height="50"
        (mousedown)="startDragging()"
        (mousemove)="onDrag($event)"
        (mouseup)="stopDragging()">
      </canvas>
    </div>`,
  styles: [`
    .disabled {
      pointer-events: none;
      filter: grayscale(100%) opacity(0.6);
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSliderComponent),
      multi: true
    }
  ]
})
export class MultiSliderComponent implements AfterViewInit, OnChanges, ControlValueAccessor {

  @Input() inputRange: number[] = [0,1];
  @Input() colors: string[] = ['F6F6F6', 'F6F6F6'];
  @Input() offsetXThreshold: number = 0;
  @Output() onStopDragging: EventEmitter<number[]> = new EventEmitter<number[]>();
  private inputValues: number[] = [.5];

  @ViewChild('sliderCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private ranges!: number;
  private ctx: any;
  private sliderInnerValues!: number[];
  private isDragging: boolean = false;
  private currentSliderIndex: number = -1;

  private xAxisHeight: number = 5.3;
  private sliderRadius: number = this.xAxisHeight+2;
  private slidersGap: number = this.sliderRadius*2;
  private xAxisYCoord!: number;
  private canvasEl!: HTMLCanvasElement;
  private lastEmittedOffsetX: number | undefined;

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes.inputRange && !changes.inputRange.firstChange) {
      this.setSlidersInnerValues();
      this.drawCanvas();
    }
  }

  // ControlValueAccessor Interface Implementation: begin
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(obj: any): void {
    if (obj != undefined) {
      this.inputValues = obj;
    }
    /* Workaround: si no se utiliza setTimeout para ejecutar drawCanvas()
      falla la registración y no se invoca a registerOnChange() */
    setTimeout(()=>{
      this.setSlidersInnerValues();
      this.drawCanvas();
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    const disabledClassName: string = 'disabled';
    setTimeout(()=>{
      const classList: DOMTokenList = this.canvas.nativeElement.classList;
      if(isDisabled) {
        classList.add(disabledClassName);
      } else {
        classList.remove(disabledClassName);
      }
    })
  }
  // ControlValueAccessor Interface Implementation: end

  private initCanvas(): void {
    this.canvasEl = this.canvas.nativeElement;
    this.ctx = this.canvasEl.getContext('2d');
    this.xAxisYCoord = this.canvasEl.height/2;
  }

  private setSlidersInnerValues(): void {
    if(!this.canvasEl) return;
    this.ranges = this.inputValues.length+1;
    var parentWidth: number = this.canvasEl.parentElement?.clientWidth || 300;
    this.canvasEl.width = parentWidth;  // Set canvas width (drawing buffer)
    this.canvasEl.style.width = parentWidth + 'px';  // Set CSS width (display size)
    this.sliderInnerValues = this.inputValues.map(value => this.getInnerValue(value));
  }

  private drawCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    this.ctx.fillStyle = 'transparent';
    this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    this.drawRanges();
    this.drawSliders();
  }

  private drawRange(xCoord: number, width: number, colorIdx: number): void {
    this.ctx.fillStyle = '#'+this.colors[colorIdx];
    this.ctx.fillRect(xCoord, this.xAxisYCoord-this.xAxisHeight/2, width, this.xAxisHeight);
  }

  private drawFirstRange(): void {

    this.drawRange(
      this.xAxisHeight/2, 
      this.sliderInnerValues[0], 
      0
    );

    // The left end is rounded
    this.ctx.beginPath();
    this.ctx.arc(
      this.xAxisHeight/2, 
      this.xAxisYCoord, 
      this.xAxisHeight/2, 
      Math.PI*.5, 
      Math.PI*.75, 
      true
    );
    this.ctx.fill();
  }

  private drawLastRange(): void {

    this.drawRange(
      this.sliderInnerValues[this.ranges-2],
      this.canvasEl.width-this.sliderInnerValues[this.ranges-2]-this.xAxisHeight/2,
      this.ranges-1
    );

    // The right end is rounded
    this.ctx.beginPath();
    this.ctx.arc(
      this.canvasEl.width-this.xAxisHeight/2, 
      this.xAxisYCoord,
      this.xAxisHeight/2,
      -Math.PI*.5, 
      Math.PI*.5, 
      false
    );
    this.ctx.fill();
  }

  private drawMiddleRange(rangeIdx: number): void {
    this.drawRange(
      this.sliderInnerValues[rangeIdx-1], 
      this.sliderInnerValues[rangeIdx]-this.sliderInnerValues[rangeIdx-1],
      rangeIdx
    );
  }

  private drawRanges(): void {
    this.drawFirstRange();
    for(let i: number = 1; i <= this.ranges-2; i++) {
      this.drawMiddleRange(i);
    }
    this.drawLastRange();
  }

  private drawSliders(): void {
    this.sliderInnerValues.forEach((sliderValue: number, idx: number) => {
      // Draw sliders
      this.ctx.fillStyle = '#F6F6F6'; // Slider color
      this.ctx.beginPath();
      this.ctx.arc(sliderValue, this.xAxisYCoord, this.sliderRadius, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.font = "750 0.65em sans-serif";
      this.ctx.fillText(
        this.getOuterValue(sliderValue).toFixed(2), 
        sliderValue-9,
        this.xAxisYCoord+(this.isDragging && idx === this.currentSliderIndex? -10 : 19)
      );
    });
  }

  startDragging(): void {
    if(this.currentSliderIndex !== -1) {
      this.isDragging = true;
    }
  }

  onDrag(event: MouseEvent): void {
    if(this.isDragging) {
      const mouseX: number = event.offsetX;
      // Update slider position
      const lowerLimit: number = this.sliderInnerValues[this.currentSliderIndex-1];
      const upperLimit: number = this.sliderInnerValues[this.currentSliderIndex+1];
      if(
        (!lowerLimit || mouseX>lowerLimit+this.slidersGap) && 
        (!upperLimit || mouseX<upperLimit-this.slidersGap) &&
        mouseX > this.sliderRadius &&
        mouseX < this.canvasEl.width-this.sliderRadius
      ) {
        this.sliderInnerValues[this.currentSliderIndex] = mouseX;
        this.inputValues[this.currentSliderIndex] = this.getOuterValue(mouseX);
        this.drawCanvas();
        if (
          this.lastEmittedOffsetX == null ||
          Math.abs(mouseX - this.lastEmittedOffsetX) > this.offsetXThreshold
        ) {
          this.onChange(this.inputValues); // Notify Angular forms about the change
          this.lastEmittedOffsetX = mouseX; // Update the last drawn offsetX
        }
      }
    } else {
      this.updateCurrentSliderIndex(event);
    }
  }

  stopDragging(): void {
    if(this.isDragging) {
      this.isDragging = false;
      this.drawCanvas();
      this.onStopDragging.emit(this.inputValues);
    }
  }

  private updateCurrentSliderIndex(event): void {
    const mouseX: number = event.offsetX;
    const mouseY: number = event.offsetY;
    // Check if mouse is over a slider
    this.currentSliderIndex = this.sliderInnerValues.findIndex((sliderValue: number) =>
      mouseX > sliderValue-this.sliderRadius && mouseX < sliderValue+this.sliderRadius &&
      mouseY > this.xAxisYCoord-this.sliderRadius && mouseY < this.xAxisYCoord+this.sliderRadius
    );
    this.canvasEl.style.cursor = this.currentSliderIndex !== -1? 'pointer' : 'default';
  }

  private getOuterValue(innerValue): number {
    return this.inputRange[0] + (innerValue/this.canvasEl.width)*(this.inputRange[1]-this.inputRange[0]);
  }

  private getInnerValue(outerValue): number {
    return this.canvasEl.width*(outerValue-this.inputRange[0])/(this.inputRange[1]-this.inputRange[0]);
  }

}