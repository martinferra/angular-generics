import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class ConfirmationDialogComponent {

  constructor(
    public dialog: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any) {   
  }

  cancell(): void {
    this.dialog.close(false);
  }
  confirm(): void {
    this.dialog.close(true);
  }

  get confirmBtnText(): string {
    return this.dialogData?.confirmBtnText || 'Aceptar';
  }

  get showCancelBtn(): boolean {
    return Boolean(this.dialogData?.showCancelBtn !== false);
  }

  get cancelBtnText(): string {
    return this.dialogData?.cancelBtnText || 'Cancelar';
  }
}
