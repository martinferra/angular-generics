import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-filter-handler',
  templateUrl: './filter-handler.component.html',
  styleUrls: ['./filter-handler.component.scss'],
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
})
export class FilterHandlerComponent {

  @Output() toggleFilterViewEmitter: EventEmitter<any> = new EventEmitter();

  constructor() { }

  toggleFilterView(): void {
    this.toggleFilterViewEmitter.emit(null);
  }

  public updateFilter(): void {}

}
