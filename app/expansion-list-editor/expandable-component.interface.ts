import { EventEmitter } from "@angular/core";
import { Observable } from "rxjs";

export interface ExpandableComponent {
    parentComponent: any;
    inputElement: any;
    contextData: any;
    inputClonning: boolean;
    readOnly: boolean;
    required: boolean;
    markedAsTouched: boolean;
    changedElementEmitter: EventEmitter<any>;
    closeEditorEmitter: EventEmitter<any>;
    afterViewInitEmitter: Observable<void>;
    contextChangeEmitter: EventEmitter<any>;
    isEmpty: boolean;
    markAsTouched(): void;
    getElement(): any;
    hasErrors(): boolean;
    updateContext(contextData: any): void;
}