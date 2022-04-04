import { HttpClient } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass, classToPlain } from 'class-transformer';
import { AsyncTasksService, TaskType } from '../reports/async-tasks.service';

export abstract class DataService {

  constructor(
    private http : HttpClient,
    private asyncTasksService: AsyncTasksService
  ) {
    this.initializeMainEntityClass(this.mainEntityClass)
    this.getNestedEntityClasses().forEach( nestedEntityClass => this.initializeEntityClass(nestedEntityClass) )
  }

  private managedClasses: Map<string, any> = new Map()

  private initializeMainEntityClass(mainEntityClass: any) {

    let dataServiceName = 'entityService';

    mainEntityClass[dataServiceName] = this;

    Object.assign(mainEntityClass, this.getClassServices());

    let saveMethodName: string = mainEntityClass.prototype.save? '_save' : 'save'

    mainEntityClass.prototype[saveMethodName] = function() {
      return this.constructor[dataServiceName].save(this);
    };

    mainEntityClass.prototype.remove = function() {
      return this.constructor[dataServiceName].removeById(this._id);
    };

    mainEntityClass.prototype.entityService = function() {
      return this.constructor[dataServiceName];
    };

    this.initializeEntityClass(mainEntityClass);
  }

  private initializeEntityClass(entityClass: any) {

    if(entityClass.classId)
      this.managedClasses[entityClass.classId] = entityClass

    entityClass.prototype.isNew = function() {
      return this._id ? false : true;
    };

    entityClass.prototype.isEqualTo = function(obj: any): boolean {
      return obj && (this === obj || this._id && obj._id && this._id === obj._id);
    };
  }

  abstract getModel(): string;

  abstract getMainEntityClass(): any;

  protected getNestedEntityClasses(): any[] {
    return [];
  }

  private get mainEntityClass(): any {
    return this.getMainEntityClass();
  }

  protected customPreTranslateToServerData(data: any): any {
    return data;
  }

  protected customTranslateToServerData(data: any): any {
    return data;
  }

  private translateToServerData(data: any): any {
    return this.customTranslateToServerData(
      classToPlain(
        this.customPreTranslateToServerData(data)
      )
    );
  }

  protected getClassServices(): any {
    // Debe ser implementado en las clases herederas cuando se deséen
    // inyectar servicios adicionales
    return {};
  }

  private getUri(method: string): string {
    return '/api/'+this.getModel()+'/'+method;
  }

  private init(obj: any) {
    if(obj.init) {
      obj = obj.init();
    };
    obj.loaded = true;
    return obj;
  }

  private convertToClassInstance(plainObject: any): any {
    let obj: any;
    if(this.mainEntityClass.childClasses) {
      if(plainObject instanceof Array) {
        obj = plainObject.map( (po: any) => plainToClass(this.childClass(po), po) );
      } else {
        obj = plainToClass(this.childClass(plainObject), plainObject);
      }
    } else {
      obj = plainToClass(this.mainEntityClass, plainObject);
    };
    return obj instanceof Array?
      obj.map((o: any)=>{
        o.loaded = true;
        return o;
      }) : 
      this.init(obj);
  }

  private childClass(plainObject: any): any {
    return this.mainEntityClass.childClasses.find((cc: any) => cc.classId === plainObject.__t)
  }

  public getClassByName(className: string): any {
    return this.managedClasses[className]
  }

  public getInstance(className: string, ...args: any[]): any {
    const _class = this.getClassByName(className);
    let obj: any;
    obj = new _class(...args);
    obj.loaded = true;
    return obj;
  }

  public find(query: any = {}, method: string = 'find') : Observable<any> {
    return this.http.post(this.getUri(method), query).pipe(
      map((plainObject: any) => {
        if(!plainObject) return plainObject;
        if(!(plainObject.documents && plainObject.count)) {
          return this.convertToClassInstance(plainObject);
        } else {
          return {
            list: this.convertToClassInstance(plainObject.documents), 
            count: plainObject.count
          };
        }
      })
    )
  }

  public findById(id: string, query: any = {}) : Observable <any> {
    query.id = id;
    return this.find(query, 'findById')
  }

  public save(objectToSave: any) : Observable<any> {
    return this.http.post(
      this.getUri('save'), 
      this.translateToServerData(objectToSave)
    ).pipe(
      map((plainObject: any) => {
        if(!objectToSave._id && plainObject._id) {
          objectToSave._id = plainObject._id;
        }
        return plainObject;
      })
    )
  }

  public updateMany(query: any, data: any) : Observable<any> {
    return this.http.post(
      this.getUri('updateMany'), {
        query: query,
        data: this.translateToServerData(classToPlain(data))
      }
    )
  }

  public remove(query: any = {}, method: string = 'remove') : any {
    return Observable.create( (observer: Observer<any>) => {
      this.http.post(this.getUri(method), query).subscribe( data => {
        observer.next(data);
        observer.complete();
      })
    })
  }

  public removeById(id: string) : any {
    return this.remove({ id }, 'removeById')
  }

  public count(query: any = {}) : Observable<number> {
    return this.http.post(this.getUri('count'), query).pipe(
      map((value: any) => Number.parseInt(value))
    )
  }

  public custom(customFnName: string, params: any, convertToClassInstance?: boolean) : Observable<any> {
    let ret =  this.http.post(this.getUri(customFnName), params);
    if(convertToClassInstance) {
      ret = ret.pipe(map(plainObject => this.convertToClassInstance(plainObject)))
    };
    return ret;
  }

  public newElementObserver(): Observable<any> {
    return this.asyncTasksService.runTask(TaskType.subscription, this.getModel()).pipe(
      map((plainObject: any) => this.convertToClassInstance(plainObject))
    );
  }
}
