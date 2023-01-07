import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { TaskState } from '../../../../generic/models/interfaces/taskState.interface';

@Injectable({
  providedIn: 'root'
})
export class BackgroundTasksService {

  constructor() { }

  private _taskListEmitter: ReplaySubject<TaskState[]> = new ReplaySubject<TaskState[]>(1);

  public get taskListEmitter(): Subject<TaskState[]> {
    return this._taskListEmitter;
  }

  private tasksPool: Map<number, {taskState:TaskState,subscription:Subscription|undefined}> = new Map();

  private getTaskList(): TaskState[] {

    let list: TaskState[] = [];

    this.tasksPool.forEach((value: {taskState: TaskState, subscription: Subscription|undefined}, key: number)=>{
      list.push({
        taskId: key,
        message: value.taskState.message,
        progress: (value.subscription && value.subscription.closed)? 100 : 
                    (value.taskState.progress !== undefined? value.taskState.progress : -1),
        error: value.taskState.error
      })
    });

    return list;
  }

  private emitTaskList(): void {
    this._taskListEmitter.next(this.getTaskList());
  }

  private getTaskId(): number {
    let taskId = Date.now();
    while(this.tasksPool.get(taskId)) {
      taskId++;
    }
    return taskId;
  }

  private finalizeTask(taskId: number): void {
    this.tasksPool.get(taskId)?.subscription?.unsubscribe();
    this.emitTaskList();
  }

  private updateTaskState(taskId: number, taskState: TaskState): void {
    let task = this.tasksPool.get(taskId);
    if(task) {
      task.taskState = taskState;
    }
    this.emitTaskList();
  }

  public addTask(taskObs: Observable<TaskState>, message?: string): void {

    let taskId: number = this.getTaskId();

    let obs = taskObs.pipe(
      tap((taskState: TaskState)=>this.updateTaskState(taskId, taskState)),
      finalize(() => this.finalizeTask(taskId))
    );

    this.tasksPool.set(taskId, {
      taskState: {
        taskId: taskId,
        message: message || 'Iniciando tarea...',
        progress: 0,
        error: false
      },
      subscription: undefined
    });

    let task = this.tasksPool.get(taskId);
    if(task) {
      task.subscription = obs.subscribe();
    }
  }

  public subscribeToListChanges(callback: (taskList: TaskState[])=>void): Subscription {
    return this._taskListEmitter.subscribe(callback);
  }

  public clearFinalized(): void {
    this.tasksPool.forEach((value: {taskState: TaskState, subscription: Subscription|undefined}, key: number)=>{
      if(value.subscription?.closed) {
        this.tasksPool.delete(key);
      }
    });
    this.emitTaskList();
  }
}
