import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, map, startWith, tap } from 'rxjs/operators';
import { TaskState } from '../models/interfaces/taskState.interface';
import { TaskType, AsyncTasksService } from './async-tasks.service';
import { FileDownloadService } from 'src/generic/app/file-download/file-download.service';

@Injectable()
export class ReportsService {

  constructor(
    private asyncTasksService: AsyncTasksService,
    private fileDownloadService: FileDownloadService
  ) { }

  public getReport(reportId: string, filenamePreffix: string = '', fileExt: string, ...reportParams: any[]) : Observable<TaskState> {

    const fileName = `${filenamePreffix || reportId}_${moment().format('YYYYMMDDHHmmss')}.${fileExt}`;

    return this.asyncTasksService.runTask(TaskType.rpc, {name: 'getReport', params: {reportId, reportParams}}).pipe(
      concatMap( (fileData: any) => {
        return typeof fileData === 'string'?
          this.fileDownloadService.downloadFile(fileData) :
          of(fileData);
      }),
      tap((fileContent: any) => {
        let blobContent;
        if (fileContent instanceof Blob) {
          blobContent = fileContent;
        } else if (fileContent instanceof ArrayBuffer) {
          blobContent = new Blob([new Uint8Array(fileContent)]);
        } else {
          blobContent = new Blob([fileContent]);
        }
        saveAs(blobContent, fileName);
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
