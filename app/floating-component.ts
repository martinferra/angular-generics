import { EventEmitter } from "@angular/core";

export interface FloatingComponent {
    setElement?(element: any): void;
    onClose?: EventEmitter<void>;
    registerOnClose?(onClose: () => void): void;
}

export type FloatingComponentConstructor = new (...args: any[]) => FloatingComponent;