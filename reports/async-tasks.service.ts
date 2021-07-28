import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

function deserializer(event: any) {
  if(event.data instanceof Blob) {
    return {
      command: 'blob',
      data: event.data
    }
  } else {
    let eventData: any = JSON.parse(event.data); 
    return {
      command: eventData.command,
      data: eventData.data
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class AsyncTasksService {

  constructor() { }

  public runTask(taskId: string, taskParams: any): Observable<any> {
    let socket$: WebSocketSubject<any>;
    try {
      socket$ = webSocket({
        url: location.origin.replace(/^http/, 'ws'),
        deserializer: deserializer
      });
    } catch(e) {
      return throwError(`Error connecting websocket: AsyncTasksService -> runTask -> ${e.toString()}`);
    };
    try {
      socket$.next({command: taskId, data: taskParams});
    } catch(e) {
      return throwError(`Error sending websocket data: AsyncTasksService -> runTask -> ${e.toString()}`);
    };
    return socket$.asObservable().pipe(
      tap((message: any)=>{
        if(message.command === 'keepAlive') {
          console.log('keepAlive');
          let timeOut: number = message.data.timeOut || 30000;
          setTimeout(()=>{
            if(!socket$.closed) {
              socket$.next({command: message.command, data: {timeOut}});
            }
          }, timeOut);
        }
      }),
      filter((message: any)=> message.command !== 'keepAlive'),
      map( (message: any) => {
        if(message.command !== 'error') {
          return message.data;
        } else {
          throw new Error(JSON.stringify(message.data));
        }
      }),
      tap(() => {
        socket$.complete();
      })
    );
  }
}
