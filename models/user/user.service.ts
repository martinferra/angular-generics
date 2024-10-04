import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from '../data.service';
import { AsyncTasksService } from '../../reports/async-tasks.service';
import { User } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService extends DataService {
  constructor(http: HttpClient, asyncTasksService: AsyncTasksService) {
    super(http, asyncTasksService);
  }

  getModel(): string {
    return 'user';
  }

  getMainEntityClass(): any {
    return User;
  }

  findGridData(query?: any): Observable<any> {
    let _query: any = {
      filter: query ?? {},
    };
    return this.find(_query);
  }

  findAutocompleteOptions(queryData: any, discriminator?: string): Observable<any> {
    return this.find(queryData, 'findAutocompleteOptions', discriminator)
  }
}
