import { Directive, Type, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicContainer]'
})
export class DynamicContainerDirective {

  constructor(private viewContainerRef: ViewContainerRef) { }

  public setComponent(componentType: Type<any>): Object {
    this.clear();
    return this.viewContainerRef.createComponent(componentType).instance;
  }

  public clear(): void {
    this.viewContainerRef.clear();
  }

}
