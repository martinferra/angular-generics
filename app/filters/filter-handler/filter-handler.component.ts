import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-filter-handler',
  templateUrl: './filter-handler.component.html',
  styleUrls: ['./filter-handler.component.scss']
})
export class FilterHandlerComponent implements OnInit {

  @Output() toggleFilterViewEmitter: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  toggleFilterView(): void {
    this.toggleFilterViewEmitter.emit(null);
  }

  public updateFilter(): void {}

}
