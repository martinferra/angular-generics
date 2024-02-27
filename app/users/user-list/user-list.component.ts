import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../models/user/user.model';
import { UserService } from '../../../models/user/user.service';
import { UserNewEditDialogWrapperComponent } from '../user-new-edit/user-new-edit.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { FloatingComponent } from 'src/generic/app/floating-component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements FloatingComponent, OnInit {
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  columnsToDisplay = ['email', 'fullname', 'isAdmin', 'actions'];

  userList$!: Observable<MatTableDataSource<any>>;

  constructor(
    private userService: UserService,
    public dialog: MatDialog,
    private confirmationDialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadGridData();
  }

  loadGridData(userFilterData: any = null): void {
    setTimeout(() => {
      this.paginator.pageIndex = 0;

      this.userList$ = this.userService
        .findGridData(userFilterData || {})
        .pipe(map((users: Array<any>) => this.createDataSource(users)));
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

  openUserNewEditDialog(user?: any): void {
    const dialogRef = this.dialog.open(UserNewEditDialogWrapperComponent, {
      width: '20em',
      data: { element: user },
    });

    dialogRef.afterClosed().subscribe(user => {
      if (user) {
        this.loadGridData();
      }
    });
  }

  remove(user: User): void {
    this.confirmationDialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Confirmación',
          message: `Se va a eliminar el usuario "${user.fullname}"`,
          cancelBtnText: 'Cancelar',
          confirmBtnText: 'Aceptar',
        },
      })
      .afterClosed()
      .subscribe((confirm: boolean) => {
        if (confirm) {
          (user as any).remove().subscribe(() => {
            this.loadGridData();
          });
        }
      });
  }

    // FloatingComponent implementation
    setElement?: (element: any) => void;
}
