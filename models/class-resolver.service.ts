import { Injectable } from '@angular/core';

export class ClassResolver {

  private classMap: Map<string, Function>

  // Singleton pattern
  private static _instance: ClassResolver
  public static getInstance() {
      if(!this._instance) this._instance = new this()
      return this._instance
  }

  private constructor() {
    this.classMap = new Map<string, Function>()
  }

  public setClass(classObj: any, classId?: string): void {
    this.classMap.set(classId || classObj['classId'], classObj);
  }

  public getClass(key: string): any {
    return this.classMap.get(key);
  }

}

@Injectable()
export class ClassResolverService {

  private classResolver: ClassResolver = ClassResolver.getInstance()

  public getClass(classId: string) {
    return this.classResolver.getClass(classId)
  }
}
