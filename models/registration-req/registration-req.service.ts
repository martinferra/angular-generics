import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from '../data.service';
import { AsyncTasksService } from '../../reports/async-tasks.service';
import { RegistrationReq } from './registration-req.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrationReqService extends DataService {
  constructor(http: HttpClient, asyncTasksService: AsyncTasksService) {
    super(http, asyncTasksService);
  }

  getModel(): string {
    return 'registrationreq';
  }

  getMainEntityClass(): any {
    return RegistrationReq;
  }

  findGridData(query?: any): Observable<any> {
    let _query: any = {
      filter: query ?? {},
    };
    return this.find(_query);
  }
}
