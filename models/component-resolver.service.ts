import { Injectable } from '@angular/core';

export enum operations {
  new = 'new',
  edit = 'edit',
  newEdit = 'newEdit',
  list = 'list'
}

export class ComponentResolver {

  private relationshipsMap: Map<string, string>
  private componentsMap: Map<string, Function>

  // Singleton pattern
  private static _instance: ComponentResolver
  public static getInstance() {
      if(!this._instance) this._instance = new this()
      return this._instance
  }

  private constructor() {
    this.relationshipsMap = new Map<string, string>()
    this.componentsMap = new Map<string, Function>()
  }

  public setRelationship(classObj: Function, operation: string, compName: string) {
    this.relationshipsMap[classObj['classId']+'_'+operation] = compName
  }

  public setComponent(componentClass: Function, key?: string) {
    this.componentsMap[key || componentClass['classId']] = componentClass;

  }

  public getComponentClass(classObj: Function, operation: string) {
    return this.componentsMap[this.relationshipsMap[classObj['classId']+'_'+operation]]
  }
}

@Injectable()
export class ComponentResolverService {

  private componentResolver: ComponentResolver = ComponentResolver.getInstance()

  public getComponentClass(classObj: Function, operation: string) {
    return this.componentResolver.getComponentClass(classObj, operation)
  }
}
