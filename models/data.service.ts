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

    mainEntityClass.prototype[saveMethodName] = function(discriminator?: string) {
      return this.constructor[dataServiceName].save(this, discriminator);
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

  protected getDiscriminatorFieldName(): string {
    return '';
  }

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
    let discriminatorFieldName: string = this.getDiscriminatorFieldName();
    if(discriminatorFieldName) {
      if(data instanceof Array) {
        data.forEach((elem: any)=>delete elem[discriminatorFieldName])
      } else {
        delete data[discriminatorFieldName]
      }
    }
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

  private getUri(method: string, discriminator?: string): string {
    var discParam: string = discriminator? '/'+discriminator : ''
    return `/api/${this.getModel()}/${method}${discParam}`;
  }

  private init(obj: any) {
    if(obj.init) {
      obj = obj.init();
    };
    obj.loaded = true;
    return obj;
  }

  private plainToClass(cls: any, plainObject: any, discriminator?: string) {
    if(discriminator) {
      plainObject[this.getDiscriminatorFieldName()] = discriminator;
    }
    return plainToClass(cls, plainObject);
  }

  private convertToClassInstance(plainObject: any, discriminator?: string): any {
    let obj: any;
    if(this.mainEntityClass.childClasses) {
      if(plainObject instanceof Array) {
        obj = plainObject.map( (po: any) => this.plainToClass(this.childClass(po), po, discriminator) );
      } else {
        obj = this.plainToClass(this.childClass(plainObject), plainObject, discriminator);
      }
    } else {
      obj = this.plainToClass(this.mainEntityClass, plainObject, discriminator);
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

  public find(query: any = {}, method: string = 'find', discriminator?: string) : Observable<any> {
    return this.http.post(this.getUri(method, discriminator), query).pipe(
      map((plainObject: any) => {
        if(!plainObject) return plainObject;
        if(!(plainObject.documents && plainObject.count)) {
          return this.convertToClassInstance(plainObject, discriminator);
        } else {
          return {
            list: this.convertToClassInstance(plainObject.documents, discriminator), 
            count: plainObject.count
          };
        }
      })
    )
  }

  public findById(id: string, query: any = {}, discriminator?: string) : Observable <any> {
    query.id = id;
    return this.find(query, 'findById', discriminator)
  }

  public save(objectToSave: any, discriminator?: string) : Observable<any> {
    return this.http.post(
      this.getUri('save', discriminator), 
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

  public updateMany(query: any, data: any, discriminator?: string) : Observable<any> {
    return this.http.post(
      this.getUri('updateMany', discriminator), {
        query: query,
        data: this.translateToServerData(classToPlain(data))
      }
    )
  }

  public remove(query: any = {}, method: string = 'remove', discriminator?: string) : any {
    return Observable.create( (observer: Observer<any>) => {
      this.http.post(this.getUri(method, discriminator), query).subscribe( data => {
        observer.next(data);
        observer.complete();
      })
    })
  }

  public removeById(id: string, discriminator?: string) : any {
    return this.remove({ id }, 'removeById', discriminator)
  }

  public count(query: any = {}, discriminator?: string) : Observable<number> {
    return this.http.post(this.getUri('count', discriminator), query).pipe(
      map((value: any) => Number.parseInt(value))
    )
  }

  public custom(customFnName: string, params: any, convertToClassInstance?: boolean, discriminator?: string) : Observable<any> {
    let ret =  this.http.post(this.getUri(customFnName, discriminator), params);
    if(convertToClassInstance) {
      ret = ret.pipe(map(plainObject => this.convertToClassInstance(plainObject, discriminator)))
    };
    return ret;
  }

  public newElementObserver(discriminator?: string): Observable<any> {
    let discPath: string = discriminator? '/'+discriminator : '';
    return this.asyncTasksService.runTask(TaskType.subscription, this.getModel()+discPath).pipe(
      map((plainObject: any) => this.convertToClassInstance(plainObject, discriminator))
    );
  }
}
