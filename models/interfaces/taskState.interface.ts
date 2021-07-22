export interface TaskState {
    taskId?: number;
    message: string;
    progress?: number;
    error: boolean;
}