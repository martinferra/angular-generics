import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SharedConfigService {
  private sharedConfig: any;

  constructor(private http: HttpClient) {}

  getSharedConfig(): Observable<any> {
    if (this.sharedConfig) {
      return of(this.sharedConfig);
    }
    return this.http
      .get<any>('/api/sharedconfig/getSharedConfig')
      .pipe(tap((sharedConfig: any) => (this.sharedConfig = sharedConfig)));
  }
}
