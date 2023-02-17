import { Directive, Type, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicContainer]'
})
export class DynamicContainerDirective {

  constructor(private viewContainerRef: ViewContainerRef) { }

  setComponent(componentType: Type<any>): void {
    this.viewContainerRef.clear();
    this.viewContainerRef.createComponent(componentType);
  }
}
