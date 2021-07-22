import { AfterViewInit, EventEmitter } from "@angular/core";

export interface ExpandableComponent extends AfterViewInit {
    parentComponent: any;
    inputElement: any;
    contextData: any;
    inputClonning: boolean;
    readOnly: boolean;
    required: boolean;
    changedElementEmitter: EventEmitter<any>;
    closeEditorEmitter: EventEmitter<any>;
    afterViewInitEmitter: EventEmitter<any>;
    contextChangeEmitter: EventEmitter<any>;
    isEmpty: boolean;
    markAsTouched(): void;
    getElement(): any;
    hasErrors(): boolean;
    updateContext(contextData: any): void;
}