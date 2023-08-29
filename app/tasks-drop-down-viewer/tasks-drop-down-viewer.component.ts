import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TaskState } from '../../../generic/models/interfaces/taskState.interface';
import { BackgroundTasksService } from '../services/backgroundTasks/background-tasks.service';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-tasks-drop-down-viewer',
  templateUrl: './tasks-drop-down-viewer.component.html',
  styleUrls: ['./tasks-drop-down-viewer.component.scss']
})
export class TasksDropDownViewerComponent implements OnInit, OnDestroy {

  subscription!: Subscription;
  taskList: TaskState[] = [];

  constructor(
    private backgroundTasksService: BackgroundTasksService
  ) {
  }

  ngOnInit() {
    this.subscription = this.backgroundTasksService.taskListEmitter
      .subscribe((taskList: TaskState[])=>this.taskList = taskList);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  clearFinalized() {
    this.backgroundTasksService.clearFinalized();
  }

  /* Mostrar/ocultar componentes */
  showSpinner(taskState: TaskState): boolean {
    return !taskState.error && (!taskState.progress || taskState.progress<0);
  }
  spinnerMode(taskState: TaskState): ProgressSpinnerMode {
    return !taskState.progress || taskState.progress<0? 'indeterminate' : 'determinate';
  }
  spinnerValue(taskState: TaskState): number {
    return taskState.progress && taskState.progress>0? taskState.progress : 0;
  }
  showDoneIcon(taskState: TaskState): boolean {
    return !taskState.error && taskState.progress===100;
  }
  get showClearFinalizedButton(): boolean {
    let ret = !!this.taskList.filter((taskState: TaskState)=>taskState.error || taskState.progress===100).length;
    return ret;
  }
  /* Fin: mostrar/ocultar componentes */

}
