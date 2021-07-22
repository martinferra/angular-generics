import { Component, Input, OnInit, ViewChild, SimpleChanges, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-basic-list-editor',
  templateUrl: './basic-list-editor.component.html',
  styleUrls: ['./basic-list-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicListEditorComponent implements OnInit, OnChanges {

  @Input() componentSpec;
  @Input() listChangeEmitter;
  @Input() allowEdition: boolean = true;
  @ViewChild(MatTable, { static:false }) table: MatTable<any>;
  columns: any[] = null;
  datasource: any[] = null;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public dialog: MatDialog,
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateComponentSpec();
  }

  ngOnInit() {
    this.updateComponentSpec();
  }

  private updateComponentSpec() {
    this.columns = this.componentSpec.tableSpec.columnsSpec.map(elem => elem.id);
    this.datasource = this.componentSpec.tableSpec.datasource ? this.componentSpec.tableSpec.datasource : [];
    this.columns.push('actions');
  }

  public newElement() {
    this.openDialog()
  }

  public editElement(element: any, idx: number = undefined) {
    if(idx === undefined) idx = this.datasource.findIndex(elem=>elem.isEqualTo(element))
    if(idx>=0) this.openDialog(element, idx)
  }

  private deleteElement(element: any, idx: number) {
    this.datasource.splice(idx, 1);
    this.table.renderRows();
    this.listChangeEmitter.emit(this.datasource);
  }

  private openDialog(element: any = null, idx: number = null): void {

    const dialogRef = this.dialog.open(this.componentSpec.newComponentClass, {
      width: this.componentSpec.newComponentDialogWidth,
      data: { 
        element: element, 
        parentData: this.componentSpec.parentData, 
        index: idx !== null? idx : this.datasource.length,
        new: idx == null,
        readOnly: !this.allowEdition
      }
    });

    dialogRef.afterClosed().subscribe( (event: any) => {

      if(event && event.element) {

        if(idx==null) //new
          this.datasource.push(event.element);
        else //update
          this.datasource[idx] = event.element;

        this.listChangeEmitter.emit(this.datasource);
        if(this.table) {
          this.table.renderRows();
        } else {
          this.changeDetectorRef.detectChanges();
        }
      }
    });
  }
}
