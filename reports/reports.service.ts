import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
import { TaskState } from '../models/interfaces/taskState.interface';
import { TaskType, AsyncTasksService } from './async-tasks.service';

@Injectable()
export class ReportsService {

  constructor(
    private asyncTasksService: AsyncTasksService
  ) { }

  public getReport(reportId: string, filenamePreffix: string = '', fileExt: string, ...reportParams: any[]) : Observable<TaskState> {

    const fileName = `${filenamePreffix || reportId}_${moment().format('YYYYMMDDHHmmss')}.${fileExt}`;

    return this.asyncTasksService.runTask(TaskType.rpc, {name: 'getReport', params: {reportId, reportParams}}).pipe(
      tap((fileContent: any) => {
        saveAs(fileContent instanceof Blob? fileContent : new Blob([fileContent]), fileName);
      }),
      map(()=>{ return {
        message: fileName,
        error: false
      }}),
      catchError((error)=>{
        console.error(error);
        return of({
          message:'Error en la descarga:  '+fileName,
          error: true
        });
      }),
      startWith({
        message:'Descargando:  '+fileName,
        error: false
      }),
    )
  }
}
