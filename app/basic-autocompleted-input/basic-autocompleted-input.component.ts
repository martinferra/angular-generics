import { Component, Input, Output, OnInit, EventEmitter, SimpleChanges, OnChanges, ViewChild, ElementRef, AfterViewInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material';

import { map } from 'rxjs/internal/operators/map';
import { tap } from 'rxjs/internal/operators/tap';
import { Observable, of } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { StaticHtmlDirective } from '../static-html.directive';
import { isInteger } from 'lodash';

import { clone } from 'lodash';

function toString(inputValue: any): string { 
  return typeof inputValue === 'string'? inputValue : ''
}

function getElementSelectedValidatorFn(requiredFn: Function) {
  return (control: FormControl) => {
    if(requiredFn() && (!control.value || typeof control.value === 'string'))
        return { 'noSelectedElement': true, 'required': true };
    return null;
  };
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
export class BasicAutocompletedInputComponent implements OnInit, OnChanges, AfterViewInit, ControlValueAccessor {   

  @Input() componentSpec: any;
  @Input() required: boolean = false;
  @Input() requiredErrorMessage: string = "";
  @Input() inputCssClass: string = "";
  @Input() label: string;
  @Input() placeholder: string = "";
  @Input() hint: string = "";
  @Input() panelWidth: number | string;
  @Input() allowEditing: boolean = false;
  @Input() contextData: any = {};
  @Input() tabIndex: number | boolean = 0;
  @Input() entityName: string

  @Output() afterViewInitEmitter: EventEmitter<any> = new EventEmitter<any>();

  elementCtrl = new FormControl()
  public filteredElements$: Observable<any[]>;
  private elementSelected: boolean = false;

  @ViewChild('input', { static: false }) input: ElementRef;

  constructor(
    public dialog: MatDialog
  ) {
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
    //this.disabled = isDisabled;
    if(isDisabled) {
      this.elementCtrl.disable();
    } else {
      this.elementCtrl.enable();
    }
  }
  /* Fin implemetación de interfáz ControlValueAccessor */

  ngOnChanges(changes: SimpleChanges) {
    if(changes.element && !changes.element.firstChange)
      this.updateFormFromElement()
  }

  ngOnInit() {

    this.componentSpec = Object.assign({
      minIndividualLength: 2,
      minGlobalLength: 3,
      getOuterElement: element => element,
      getInnerElement: outerElement => outerElement,
    }, this.componentSpec || {})

    this.initializeFormControl();

    this.setObservable();
  }

  ngAfterViewInit(): void {
    this.afterViewInitEmitter.emit();
    //this.renderer.setProperty(this.input.nativeElement, 'disabled', this.disabled);
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
  protected filterElements(query: any): Observable<any[]> {
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
  protected get displayInnerElementInInputFn(): any {
    return (element: any) => this.componentSpec.displayInnerElementInInput(element);
  }
  protected get editorComponentClass(): any {
    return this.componentSpec.editorComponentClass;
  }
  /* Fin métodos para sobreescribir en clases herederas */

  /* La idea de este getter copiado de la versión "protected"
     es evitar tener que hacer "public" a este último (lo cual
     es necesario ya que se lo invoca en el template) y así mantener
     la misma convención que con el resto de los getters "protected"*/
  get _displayInnerElementInInputFn(): any {
    return this.displayInnerElementInInputFn;
  }

  private initializeFormControl() {
    let validators;

    if (this.validators && this.validators instanceof Array) {
      validators = this.validators;
    }
    else if (this.validators) {
      validators = [this.validators];
    }
    else {
      validators = [];
    }

    validators.push(getElementSelectedValidatorFn(()=>this.required));

    this.elementCtrl = new FormControl(
      this.initialValue,
      {
        validators: validators,
        asyncValidators: this.asyncValidators
      }
    );
  }

  private setObservable() {
    this.filteredElements$ = this.elementCtrl.valueChanges.pipe(
      // Si se intenta editar cuando hay un objeto seleccionado, se mapea a un string vacío
      map( value => this.blankIfSelected(value) ),
      // Si se selecciona un objeto, se emite. Si se selecciona "Crear nuevo", se abre el
      // diálogo. Si hay un objeto previamente seleccionado, se vacía el input
      tap( value => this.processNewValue(value) ),
      // Si se selecciona un objeto, se mapea a un string vacío
      map( toString ),
      // Se normaliza la query
      map( queryStr => this.normalize(queryStr) ),
      switchMap( queryStr => this.getFilteredElementsObs(queryStr) ),
      startWith([])
    )
  }

  private blankIfSelected(value: any): any {
    return value && typeof value === 'string' && this.elementSelected? '' : value
  }

  private processNewValue(value: any) {
    if (value && typeof value !== 'string') {
      let outputOuterElement = this.getOuterElement(value)
      if (outputOuterElement.isNew()) {
        this.openDialog(outputOuterElement);
        this.elementSelected = false;
      } else {
        this.onChange(outputOuterElement);
        this.elementSelected = true;
      }
    } else {
      let elementSelected = this.elementSelected;
      this.elementSelected = false;
      if(elementSelected) {
        this.onChange(null);
        this.elementCtrl.setValue('');
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

  private updateFormFromElement(outerElement?: any) {
    let value = outerElement
    this.elementSelected = !!value
    this.elementCtrl.patchValue(this.getInnerElement(value))
  }

  displayElementInList(innerFilteredElement: any): string {
    let str = this.displayElementInListFn(innerFilteredElement);
    let isNew = this.getOuterElement(innerFilteredElement).isNew();
    return isNew? `"${str}" (crear nuevo)` : str
  }

  public editSelectedElement() {
    let selectedElement = this.elementCtrl.value
    if(selectedElement && typeof selectedElement !== 'string') {
      let elementForEdition = this.getOuterElement(selectedElement)
      if(!elementForEdition.isNew()) {
        this.openDialog(elementForEdition)
      }
    } 
  }

  private openDialog(element): void {

    const dialogRef = this.dialog.open(this.editorComponentClass, {
      width: '600px',
      data: { 
        element,
        contextData: clone(this.contextData),
        entityName: this.entityName || this.placeholder
      }
    });

    dialogRef.afterClosed().subscribe( newElementData => {
      if(newElementData) {
        this.updateFormFromElement(newElementData)
      }
    });
  }

  public resetForm() {
    this.elementCtrl.reset();
  }

  public setValue(value: any): void {
    this.elementCtrl.setValue(
      value? this.getInnerElement(value) : null, 
      { emitEvent: false }
    );
    this.elementSelected = !!value;
  }

  public markAsTouched() {
    this.elementCtrl.markAsTouched()
  }

  public updateValueAndValidity(opts?: any) {
    this.elementCtrl.updateValueAndValidity(opts)
  }

  public hasErrors(): boolean {
    return !!this.elementCtrl.errors
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

  public get value(): any {
    return (typeof this.elementCtrl.value !== 'string')? this.elementCtrl.value : null
  }
} 
