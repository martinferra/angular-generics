import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-check-cards-group',
  templateUrl: './check-cards-group.component.html',
  styleUrls: ['./check-cards-group.component.scss']
})
export class CheckCardsGroupComponent implements OnInit {

  @Input() datasource: any[];
  @Input() title: string;
  @Input() isChecked: (item:any)=>boolean;
  @Input() toggleCheckState: (item:any)=>void;
  @Input() getLabel: (item:any)=>string;
  @Input() maxChecked: number = 0;
  @Input() msgForMaxReached: string = "";

  @Output() listChangeEmitter: EventEmitter<any[]> = new EventEmitter<any[]>();

  constructor() { }

  ngOnInit() {
  }

  onCardClick(item: any, idx: number): void {
    if(!this.maxChecked || this.isChecked(this.datasource[idx])) {
      this._toggleCheckState(item);
    } else {
      let checkedNumber = this.datasource.reduce((acc: number, curr: any) => { 
        return (acc += this.isChecked(curr)? 1 : 0) 
      }, 0);
      if(checkedNumber<this.maxChecked) {
        this._toggleCheckState(item);
      } else if(this.msgForMaxReached) {
        alert(this.msgForMaxReached);
      }
    }
  }

  private _toggleCheckState(item: any): void {
    this.toggleCheckState(item);
    this.listChangeEmitter.emit();
  }
}
