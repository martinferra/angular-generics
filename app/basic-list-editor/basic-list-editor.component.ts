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

  @Input() componentSpec: any;
  @Input() listChangeEmitter: { emit: (arg: any[]|undefined) => void; } | undefined;
  @Input() allowEdition: boolean = true;
  @ViewChild(MatTable, { static:false }) table!: MatTable<any>;
  columns: any[] | undefined = undefined;
  datasource: any[] | undefined = undefined;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public dialog: MatDialog
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateComponentSpec();
  }

  ngOnInit() {
    this.updateComponentSpec();
  }

  private updateComponentSpec() {
    this.columns = this.componentSpec.tableSpec.columnsSpec.map((elem: { id: any; }) => elem.id);
    this.datasource = this.componentSpec.tableSpec.datasource ? this.componentSpec.tableSpec.datasource : [];
    this.columns?.push('actions');
  }

  public newElement() {
    this.openDialog()
  }

  public editElement(element: any, idx: number|undefined = undefined) {
    if(idx === undefined) idx = this.datasource?.findIndex(elem=>elem.isEqualTo(element))
    if(idx !== undefined && idx>=0) this.openDialog(element, idx)
  }

  deleteElement(element: any, idx: number) {
    this.datasource?.splice(idx, 1);
    this.table.renderRows();
    this.listChangeEmitter?.emit(this.datasource);
  }

  private openDialog(element: any = null, idx?: number): void {

    let dialogSpec: any = {
      data: { 
        element: element, 
        parentData: this.componentSpec.parentData, 
        index: idx !== undefined? idx : this.datasource?.length,
        new: idx === undefined,
        readOnly: !this.allowEdition
      },
    };

    if(this.componentSpec.newComponentDialogFitScreenSize) {
      Object.assign(dialogSpec, {
        disableClose: true,
        panelClass: ['full-screen-modal']
      });
    } else {
      Object.assign(dialogSpec, {
        width: this.componentSpec.newComponentDialogWidth,
      });
    };

    const dialogRef = this.dialog.open(this.componentSpec.newComponentClass, dialogSpec);

    dialogRef.afterClosed().subscribe( (event: any) => {

      if(event && event.element) {

        if(idx==null) //new
          this.datasource?.push(event.element);
        else { //update
          if(this.datasource) {
            this.datasource[idx] = event.element;
          }
        }

        this.listChangeEmitter?.emit(this.datasource);
        if(this.table) {
          this.table.renderRows();
        } else {
          this.changeDetectorRef.detectChanges();
        }
      }
    });
  }
}
