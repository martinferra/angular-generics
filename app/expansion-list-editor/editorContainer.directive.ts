import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[editor-container]',
})
export class EditorContainerDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}