import { EventEmitter } from "@angular/core";

export interface ExpandableListComponent {
    parentComponent: any;
    parentElement: any;
    componentSpec: any;
    contextData: any;
    datasource: any[];
    oneRequired: boolean;
    allowsSingleMode: boolean;
    cardFormat: boolean;
    listChangeEmitter: EventEmitter<any[]>;
    editingEmitter: EventEmitter<boolean>;
    changedElementEmitter: EventEmitter<any>;
    elementOperationEmitter: EventEmitter<any>; 
    elementDeletionEmitter: EventEmitter<any>;
    contextChangeEmitter?: EventEmitter<any>;
    updateView(expandLast: boolean): void;
    hasErrors(): boolean;
    updateContext?(contextdata: any): void
}