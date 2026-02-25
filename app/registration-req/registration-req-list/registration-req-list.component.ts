import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RegistrationReqService } from '../../../models/registration-req/registration-req.service';
import { RegistrationReq } from '../../../models/registration-req/registration-req.model';
import { User } from '../../../models/user/user.model';
import { UserService } from '../../../models/user/user.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { FloatingComponent } from 'src/generic/app/floating-component';

@Component({
  selector: 'app-registration-req-list',
  templateUrl: './registration-req-list.component.html',
  styleUrls: ['./registration-req-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ]
})
export class RegistrationReqListComponent implements FloatingComponent, OnInit {
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  columnsToDisplay = ['email', 'fullname', 'actions'];

  registrationReqList$!: Observable<MatTableDataSource<any>>;

  constructor(
    private registrationReqService: RegistrationReqService,
    private userService: UserService,
    public dialog: MatDialog,
    private confirmationDialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadGridData();
  }

  loadGridData(registrationReqFilterData: any = null): void {
    setTimeout(() => {
      this.paginator.pageIndex = 0;

      this.registrationReqList$ = this.registrationReqService
        .findGridData(registrationReqFilterData || {})
        .pipe(
          map((registrationReqs: Array<any>) =>
            this.createDataSource(registrationReqs)
          )
        );
    });
  }

  private createDataSource(list: Array<any>): MatTableDataSource<any> {
    let mtds = new MatTableDataSource<any>(list);
    this.paginator.length = list.length;
    this.paginator.pageSize = 10;
    this.paginator.pageSizeOptions = [3, 5, 10];
    mtds.paginator = this.paginator;
    return mtds;
  }

  acceptRequest(registrationReq: RegistrationReq): void {
    let user = new User();
    user.email = registrationReq.email;
    user.fullname = registrationReq.fullname;
    this.userService.save(user).subscribe();
    (registrationReq as any).remove().subscribe(() => {
      this.loadGridData();
    });
  }

  rejectRequest(registrationReq: RegistrationReq): void {
    this.confirmationDialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Confirmación',
          message: `Se va a eliminar el pedido para "${registrationReq.fullname}"`,
          cancelBtnText: 'Cancelar',
          confirmBtnText: 'Aceptar',
        },
      })
      .afterClosed()
      .subscribe((confirm: boolean) => {
        if (confirm) {
          (registrationReq as any).remove().subscribe(() => {
            this.loadGridData();
          });
        }
      });
  }

  // FloatingComponent implementation
  setElement?: (element: any) => void;
}
