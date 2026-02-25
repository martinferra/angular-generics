import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TaskState } from '../../../generic/models/interfaces/taskState.interface';
import { BackgroundTasksService } from '../services/backgroundTasks/background-tasks.service';
import { ProgressSpinnerMode, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-downloads-list',
  templateUrl: './downloads-list.component.html',
  styleUrls: ['./downloads-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ]
})
export class DownloadsListComponent implements OnInit, OnDestroy {

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
