import { Injectable } from '@angular/core';
import { TokenStorage } from '@app/shared/services/auth/token.storage';
import { Observable, throwError } from 'rxjs';
import { concatMap, filter, map, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { getMessageFromBlob } from 'common/generic/commonFunctions';

export enum TaskType {
  rpc = 'rpc',
  subscription = 'subscription'
}

type Rpc = {
  name: string;
  params?: any;
};

@Injectable({
  providedIn: 'root'
})
export class AsyncTasksService {

  constructor(private tokenStorage: TokenStorage) { }

  private getMessageFromBlobOperator(type: TaskType): any {
    const postProcessByDefault: boolean = type !== TaskType.subscription;
    return (blob: Blob): Promise<any> => getMessageFromBlob(blob, postProcessByDefault)
  }

  private getKeepAliveOperator(socket$: any): any { 
    return (message: any)=>{
      if(message.type === 'keepAlive') {
        let timeOut: number = message.payload.timeOut || 30000;
        setTimeout(()=>{
          if(!socket$.closed) {
            socket$.next({type: 'keepAlive', spec: timeOut});
          }
        }, timeOut);
      }
    }
  }
  private isNotKeepAliveOperator: any = (message: any) => message.type !== 'keepAlive';

  private errorOperator: any = (message: any) => {
    if (message.type === 'error') {
      throw new Error(JSON.stringify(message.payload));
    }
  }
  private isNotErrorOperator: any = (message: any) => message.type !== 'error';

  private payloadOperator: any = (message: any) => {
    return message.payload || message;
  }

  public runTask(type: TaskType, spec: string|number|Rpc): Observable<any> {
    let socket$: WebSocketSubject<any>;
    try {
      socket$ = webSocket({
        url: location.origin.replace(/^http/, 'ws'),
        deserializer: msg => msg.data,
      });
    } catch(e) {
      let errorMessage = "Not specified";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      return throwError(() => new Error(`Error connecting websocket: AsyncTasksService -> runTask -> ${errorMessage}`));
    };
    try {
      socket$.next({
        token: this.tokenStorage.getToken(),
        type,
        spec
      });
    } catch(e) {
      let errorMessage = "Not specified";
      if(e instanceof Error) {
        errorMessage = e.message;
      }
      return throwError(() => new Error(`Error sending websocket data: AsyncTasksService -> runTask -> ${errorMessage}`));
    };
    return socket$.asObservable().pipe(
      concatMap(this.getMessageFromBlobOperator(type)),
      tap(this.getKeepAliveOperator(socket$)),
      filter(this.isNotKeepAliveOperator),
      tap(this.errorOperator),
      filter(this.isNotErrorOperator),
      map(this.payloadOperator),
      tap(() => {
        if(type === TaskType.rpc) {
          socket$.complete();
        }
      })
    );
  }
}
