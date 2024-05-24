import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {

  constructor(
    private http : HttpClient
  ) { }

  public downloadFile(fileName: string): Observable<Blob> {
    return this.http.get('api/file-download/' + fileName, {responseType: 'blob'});
  }

}