import { Injectable } from '@angular/core';
import { TokenStorage } from '@app/shared/services/auth/token.storage';
import { Observable, throwError } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export enum TaskType {
  rpc = 'rpc',
  subscription = 'subscription'
}

type Rpc = {
  name: string;
  params?: any;
};

function deserializer(rawMessage: any) {
  if(rawMessage.data instanceof Blob) {
    return {
      type: 'blob',
      data: rawMessage.data
    }
  } else if(typeof rawMessage.data === 'string') {
    let messageObject: any;
    try {
      messageObject = JSON.parse(rawMessage.data);
    } catch(e) {
      return {
        type: 'txt',
        data: rawMessage.data
      }
    }
    return {
      type: messageObject.type || 'object',
      data: messageObject.data || messageObject
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class AsyncTasksService {

  constructor(private tokenStorage: TokenStorage) { }

  public runTask(type: TaskType, spec: string|number|Rpc): Observable<any> {
    let socket$: WebSocketSubject<any>;
    try {
      socket$ = webSocket({
        url: location.origin.replace(/^http/, 'ws'),
        deserializer: deserializer
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
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      return throwError(() => new Error(`Error sending websocket data: AsyncTasksService -> runTask -> ${errorMessage}`));
    };
    return socket$.asObservable().pipe(
      tap((message: any)=>{
        if(message.type === 'keepAlive') {
          console.log('keepAlive');
          let timeOut: number = message.data.timeOut || 30000;
          setTimeout(()=>{
            if(!socket$.closed) {
              socket$.next({type: 'keepAlive', spec: timeOut});
            }
          }, timeOut);
        }
      }),
      filter((message: any) => message.type !== 'keepAlive'),
      map( (message: any) => {
        if(message.type !== 'error') {
          return message.data;
        } else {
          throw new Error(JSON.stringify(message.data));
        }
      }),
      tap(() => {
        if(type === TaskType.rpc) {
          socket$.complete();
        }
      })
    );
  }
}
