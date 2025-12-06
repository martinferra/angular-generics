import { Component, Input, Output, OnInit, EventEmitter, ViewChild, ElementRef, AfterViewInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { map } from 'rxjs/internal/operators/map';
import { tap } from 'rxjs/internal/operators/tap';
import { Observable, Subject, of } from 'rxjs';
import { mergeWith, shareReplay, startWith, switchMap, concatMap, take } from 'rxjs/operators';
import { StaticHtmlDirective } from '../static-html.directive';
import { isInteger } from 'lodash';
import { clone } from 'lodash';
import { ControlValidator } from '../appValidators';

function toString(inputValue: any): string { 
  return typeof inputValue === 'string'? inputValue : ''
}

function getElementSelectedValidatorFn(validateFn: Function) {
  return (control: UntypedFormControl) => {
    if(!validateFn())
        return { 'noElementSelected': true };
    return null;
  };
}

enum ComponentState {
  noElementSelected = 0,
  elementSelected = 1,
  editing = 2
}

@Component({
  selector: 'app-basic-autocompleted-input',
  templateUrl: './basic-autocompleted-input.component.html',
  styleUrls: ['./basic-autocompleted-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BasicAutocompletedInputComponent),
      multi: true
    }
  ]
})
export class BasicAutocompletedInputComponent<T> implements OnInit, AfterViewInit, ControlValueAccessor {   

  @Input() componentSpec: any;
  @Input() required!: boolean;
  @Input() requiredFn!: Function;
  @Input() requiredErrorMessage: string = "";
  @Input() inputCssClass: string = "";
  @Input() label!: string;
  @Input() placeholder: string = "";
  @Input() hint: string = "";
  @Input() panelWidth!: number | string;
  @Input() allowEditing: boolean = false;
  @Input() allowClear: boolean = true;
  @Input() contextData: any = {};
  @Input() tabIndex: number | boolean = 0;
  @Input() entityName!: string;
  @Input() disabled: boolean = false;
  @Input() defaultElementsList$!: Observable<T[]> | undefined; 
  @Input() showTooltip: boolean = true;
  @Input() controlValidator!: ControlValidator;

  @Output() afterViewInitEmitter: EventEmitter<any> = new EventEmitter<any>();

  elementCtrl = new UntypedFormControl();
  public filteredElements$!: Observable<T[]>;
  selectedElement: any;
  componentState!: ComponentState;
  onFocusEmitter: Subject<void> = new Subject();
  _defaultElementsList$: Observable<T[]> | undefined
  
  @ViewChild('input', { static: false }) input!: ElementRef;

  constructor(
    public dialog: MatDialog,
  ) {
  }

  get noElementSelected(): boolean {
    return this.componentState === ComponentState.noElementSelected;
  }

  setNoElementSelected(emitChange: boolean = true): void {
    this.componentState = ComponentState.noElementSelected;
    this.elementCtrl.setValue('', {emitEvent: false});
    if(emitChange) {
      this.onChange(null);
    }
    this.elementCtrl.updateValueAndValidity({emitEvent: false});
  }

  get elementSelected(): boolean {
    return this.componentState === ComponentState.elementSelected;
  }

  setSelectedElement(element?: any, emitChange: boolean = true): void {
    this.componentState = ComponentState.elementSelected;
    if(element) {
      this.selectedElement = element;
      if(emitChange) {
        this.onChange(this.getOuterElement(element));
      }
    };
    this.elementCtrl.setValue(this.selectedElement, {emitEvent: !element});
    this.elementCtrl.updateValueAndValidity({emitEvent: false});
  }

  get editing(): boolean {
    return this.componentState === ComponentState.editing;
  }
  
  setEditing(): void {
    this.elementCtrl.setValue('', {emitEvent: false});
    this.componentState = ComponentState.editing;
  }

  /* Implemetación de interfáz ControlValueAccessor */
  onChange: any = () => { };
  onTouched: any = () => { };
  writeValue(obj: any): void {
    setTimeout(()=>{
      this.setValue(obj);
    })
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    if(isDisabled) {
      this.elementCtrl.disable();
    } else {
      this.elementCtrl.enable();
    }
  }
  /* Fin implemetación de interfáz ControlValueAccessor */

  ngOnInit() {

    this.componentSpec = Object.assign({
      minIndividualLength: 2,
      minGlobalLength: 3,
      getOuterElement: (element: any) => element,
      getInnerElement: (outerElement: any) => outerElement,
    }, this.componentSpec || {})

    this.initializeFormControl();

    this.setObservable();
  }

  ngAfterViewInit(): void {
    this.afterViewInitEmitter.emit();
  }

  /* Métodos para sobreescribir en clases herederas */
  protected get validators(): any | any[] {
    return this.componentSpec.validators;
  };
  protected get asyncValidators(): any | any[] {
    return this.componentSpec.asyncValidators;
  };
  protected get initialValue(): any {
    return this.componentSpec.initialValue;
  };
  protected get minIndividualLength(): number {
    return this.componentSpec.minIndividualLength;
  }
  protected get minGlobalLength(): number {
    return this.componentSpec.minGlobalLength;
  }
  protected filterElements(query: any): Observable<T[]> {
    return this.componentSpec.filterElements(query);
  }
  protected getNewElementFromQuery(queryStr: any): any {
    return this.componentSpec.getNewElementFromQuery(queryStr);
  }
  protected getInnerElement(element: any): any {
    return this.componentSpec.getInnerElement(element);
  }
  protected getOuterElement(element: any): any {
    return this.componentSpec.getOuterElement(element);
  }
  protected get displayElementInListFn(): any {
    return (element: any) => this.componentSpec.displayElementInList(element);
  }
  protected get displayInnerElementInInputFn(): (e: any)=>string {
    return (element: any) => this.componentSpec.displayInnerElementInInput(element);
  }
  protected get displayElementInTooltip(): (e: any)=>string {
    return (element: any) => !this.showTooltip? '' : this.componentSpec.displayElementInTooltip?.(element) ||
      this.displayElementInListFn(element);
  }
  protected get editorComponentClass(): any {
    return this.componentSpec.editorComponentClass;
  }
  /* Fin métodos para sobreescribir en clases herederas */

  get selectedElementDescription(): string {
    return this.displayInnerElementInInputFn(this.selectedElement);
  }

  get selectedElementShortenedDescription(): string {
    return this.shortenedDescriptionFn(this.selectedElement);
  }

  get shortenedDescriptionFn(): (element: any)=>string {
    return (element: any) => {
      let description: string = this.displayInnerElementInInputFn(element);
      return this.elementSelected? 
        description :
        description.substring(0, 1).toUpperCase();
    }
  }

  private getOuterValidatorFn(): any {
    // El objeto "thisComponent" se pasa via closure a la función interna
    var thisComponent: BasicAutocompletedInputComponent<T> = this;
    return (control: AbstractControl): Observable<ValidationErrors|null> => {
      let err: ValidationErrors = { outerValidatorError: true };
      let returnObs$: Observable<ValidationErrors|null>;
      switch(thisComponent.controlValidator.control.status) {
        case 'VALID':
          returnObs$ = of(null);
          break;
        case 'INVALID':
          returnObs$ = of(err);
          break;
        case 'PENDING':
          returnObs$ = thisComponent.controlValidator.control.statusChanges.pipe(
            map( status => status === 'VALID'? null : err ),
            take(1) // Add this to complete the observable
          );
          break;
        default:
          returnObs$ = of(null);
      }
      return returnObs$.pipe(
        tap( validationErrors => console.log('Outer validator emitted: ', validationErrors) )
      )
    };
  }

  private initializeFormControl() {
    let validators, asyncValidators;

    if (this.validators && this.validators instanceof Array) {
      validators = this.validators;
    }
    else if (this.validators) {
      validators = [this.validators];
    }
    else {
      validators = [];
    }

    if (this.asyncValidators && this.asyncValidators instanceof Array) {
      asyncValidators = this.asyncValidators;
    }
    else if (this.asyncValidators) {
      asyncValidators = [this.asyncValidators];
    }
    else {
      asyncValidators = [];
    } 

    validators.push(getElementSelectedValidatorFn( 
      this.requiredFn !== undefined?
        () => !(this.requiredFn() && this.noElementSelected) :
        () => !(this.required && this.noElementSelected)
    ));

    if (this.controlValidator) {
      asyncValidators.push(this.getOuterValidatorFn());
    }

    this.elementCtrl = new UntypedFormControl(
      this.initialValue,
      {
        validators: validators,
        asyncValidators: asyncValidators
      }
    );
  }

  private setObservable() {

    this._defaultElementsList$ = this.defaultElementsList$?.pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.filteredElements$ = this.elementCtrl.valueChanges.pipe(
      // Si se selecciona un objeto, se emite. Si se 
      // selecciona "Crear nuevo", se abre el diálogo.
      tap( value => this.processNewValue(value) ),
      // Si se selecciona un objeto, se mapea a un string vacío
      map( toString ),
      // Se normaliza la query
      map( queryStr => this.normalize(queryStr) ),
      switchMap( queryStr => queryStr? this.getFilteredElementsObs(queryStr) : this._defaultElementsList$||of([])),
      mergeWith(this.onFocusEmitter.pipe(concatMap(()=>this._defaultElementsList$||of([])))),
      startWith([])
    )
  }

  private processNewValue(value: any) {
    if (value && typeof value !== 'string') {
      let outputOuterElement = this.getOuterElement(value)
      if (!Boolean(outputOuterElement._id)) {
        this.openDialog(outputOuterElement);
      } else {
        this.setSelectedElement(value);
      }
    }
  }

  private normalize(queryStr: string): string {
    if(queryStr.length === 0) return queryStr
    let queryArr = queryStr.split(' ').filter(term=>term.length>=this.minIndividualLength)
    let maxLengh = queryArr.reduce((acc, curr) => Math.max(acc, curr.length), 0)
    return maxLengh<this.minGlobalLength? '' : queryArr.join(' ') 
  }

  private getFilteredElementsObs(queryStr: string): Observable<any[]> {

    if(queryStr.length === 0) return of([])

    let obs$ = this.filterElements(Object.assign({}, this.contextData, {queryStr}))
    if(this.allowEditing) {
      obs$ = obs$.pipe(
        map((filteredElements: any[])=>{
          let newElement = this.getNewElementFromQuery(queryStr);
          filteredElements.unshift(newElement);
          return filteredElements
        })
      )
    }

    return obs$
  }

  displayElementInList(innerFilteredElement: any): string {
    let str = this.displayElementInListFn(innerFilteredElement);
    let isNew = !Boolean((this.getOuterElement(innerFilteredElement))._id);
    return isNew? `"${str}" (crear nuevo)` : str
  }

  public editSelectedElement() {
    if(!this.allowEditing) {
      return;
    }
    this.setSelectedElement();
    let elementForEdition = this.getOuterElement(this.selectedElement);
    if(!elementForEdition.isNew()) {
      this.openDialog(elementForEdition);
    }
  }

  private openDialog(element: any): void {

    const dialogRef = this.dialog.open(this.editorComponentClass, {
      width: '750px',
      data: { 
        element,
        contextData: clone(this.contextData),
        entityName: this.entityName || this.placeholder
      }
    });

    dialogRef.afterClosed().subscribe( newElementData => {
      if(newElementData) {
        this.setSelectedElement(this.getInnerElement(newElementData));
      }
    });
  }

  public resetForm() {
    this.elementCtrl.reset();
  }

  public setValue(value: any): void {
    if(value) {
      this.setSelectedElement(this.getInnerElement(value), false);
    } else {
      this.setNoElementSelected(false);
    }
  }

  public markAsTouched() {
    this.elementCtrl.markAsTouched()
  }

  public updateValueAndValidity(opts?: any) {
    this.elementCtrl.updateValueAndValidity(opts)
  }

  public hasErrors(): boolean {
    return this.elementCtrl.invalid;
  }

  get showEditButton(): boolean {
    return this.allowEditing && this.elementSelected;
  }

  public updateContext(contextData: any): void {
    this.contextData = Object.assign(this.contextData, contextData)
  }

  public get _tabIndex() {
    return isInteger(this.tabIndex)? this.tabIndex : (this.tabIndex? 0 : -1)
  }

  public setFocus() {
    if (this.input) {
      this.input.nativeElement.focus();
    }
  }

  onInputFocus(): void {
    if(!this.elementCtrl.value && this.defaultElementsList$) {
      this.onFocusEmitter.next();
    }
  }

  onInputFocusOut(): void {
    if(this.editing) {
      this.setSelectedElement();
    }
  }

  public get value(): any {
    return (typeof this.elementCtrl.value !== 'string')? this.elementCtrl.value : null
  }

  get errorMessage(): string | null {
    if(this.required && this.noElementSelected) {
      return this.requiredErrorMessage || 'Este campo es requerido'
    }
    return this.controlValidator?.errorMessage
  }
} 
