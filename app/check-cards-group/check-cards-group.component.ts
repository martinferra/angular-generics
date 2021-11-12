import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-check-cards-group',
  templateUrl: './check-cards-group.component.html',
  styleUrls: ['./check-cards-group.component.scss']
})
export class CheckCardsGroupComponent implements OnInit {

  @Input() datasource!: any[];
  @Input() title!: string;
  @Input() isChecked!: (item:any, idx:number)=>boolean;
  @Input() toggleCheckState!: (item:any, idx:number)=>void;
  @Input() getLabel!: (item:any, idx:number)=>string;
  @Input() maxChecked: number = 0;
  @Input() msgForMaxReached: string = "";

  @Output() listChangeEmitter: EventEmitter<any[]> = new EventEmitter<any[]>();

  constructor() { }

  ngOnInit() {
  }

  onCardClick(item: any, idx: number): void {
    if(!this.maxChecked || this.isChecked(this.datasource[idx], idx)) {
      this._toggleCheckState(item, idx);
    } else {
      let checkedNumber = this.datasource.reduce((acc: number, curr: any, _idx: number) => { 
        return (acc += this.isChecked(curr, _idx)? 1 : 0) 
      }, 0);
      if(checkedNumber<this.maxChecked) {
        this._toggleCheckState(item, idx);
      } else if(this.msgForMaxReached) {
        alert(this.msgForMaxReached);
      }
    }
  }

  private _toggleCheckState(item: any, idx: number): void {
    this.toggleCheckState(item, idx);
    this.listChangeEmitter.emit();
  }
}
