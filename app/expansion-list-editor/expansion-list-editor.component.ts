import { Component, Input, EventEmitter, ChangeDetectionStrategy, ViewChildren, QueryList, ComponentFactoryResolver, ChangeDetectorRef, OnChanges, SimpleChanges, Output, ComponentFactory, } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { EditorContainerDirective } from './editorContainer.directive';
import { ComponentResolverService, operations } from '../../../generic/models/component-resolver.service';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ExpandableComponent } from './expandable-component.interface';
import { OnInit } from '@angular/core';
import { ExpandableListComponent } from './expandable-list-component.interface';

@Component({
  selector: 'app-expansion-list-editor',
  templateUrl: './expansion-list-editor.component.html',
  styleUrls: ['./expansion-list-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpansionListEditorComponent implements OnInit, ExpandableListComponent  {

  @Input() parentComponent: any;
  @Input() parentElement: any;
  @Input() componentSpec! : any;
  @Input() contextData: any = {}
  @Input() datasource!: any;
  @Input() oneRequired: boolean = false;
  @Input() listChangeEmitter!: EventEmitter<Array<any>>;
  @Input() editingEmitter: any;
  @Input() allowsSingleMode: boolean = false;
  @Input() cardFormat: boolean = false;

  @Output() changedElementEmitter: EventEmitter<any> = new EventEmitter();
  @Output() elementDeletionEmitter: EventEmitter<any> = new EventEmitter();
  @Output() contextChangeEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChildren(MatExpansionPanel) 
  expansionPanelList!: QueryList<MatExpansionPanel>;

  @ViewChildren(EditorContainerDirective) 
  editorContainerList!: QueryList<EditorContainerDirective>;

  public showDeleteButtonValues$!: Observable<any>

  private editing!: boolean;
  private editorComponents: Array<ExpandableComponent> = [];
  private _auxArray: Array<any> = [];
  private datasourceIndexes!: Array<number>;
  showEntitySubtypes: boolean = false;
  private _firstEditorIsEmpty: boolean = false;
    
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private changeDetectorRef: ChangeDetectorRef,
    private componentResolverService: ComponentResolverService
  ) { }

  get entityHasSubtypes(): boolean {
    return !!this.componentSpec.entityClass.childClasses
  }

  /* Este array auxiliar se utiliza para iterar sobre el mismo en el template y generar los
  contenedores para los componentes de edición. Solo se crea un nuevo array cuando cambia el  
  tamaño del datasource. Se lo utiliza en lugar del datasource ya que al modificar
  un elemento del datasource no debe regenerarse la lista de contenedores en el html */
  get auxArray(): Array<any> {
    if(this._auxArray.length !== this.datasource.length)
      this._auxArray = Array(this.datasource.length)
    return this._auxArray
  }

  ngOnInit() {
    this.setDefaultSpec()
    this.InitializeDatasource()
    this.resetShowDeleteButtonValues();
  }

  private resetShowDeleteButtonValues() {
    this.showDeleteButtonValues$ = forkJoin(this.datasource.map((elem: any) => this.componentSpec.showDeleteButton(elem)))
      .pipe(tap(() => this.loadEditorsAtNextLoop()));
  }

  private setDefaultSpec() {
    this.componentSpec = Object.assign({
      showAddButton: true,
      showDeleteButton: ()=>of(true),
      readOnlyEditor: ()=>false,
      cloneEachElement: true,
      allowsAddingElements: true,
    }, this.componentSpec)
  }

  private InitializeDatasource() {
    this.datasourceIndexes = this.datasource.map((elem: any, idx: number)=>idx)
    if(
      this.allowsSingleMode &&
      this.componentSpec.allowsAddingElements && 
      !this.entityHasSubtypes && 
      this.datasource.length === 0
    ) {
      this._firstEditorIsEmpty = true
      this.newElement(this.componentSpec.entityClass)
    }
  }

  private loadEditorsAtNextLoop(expandLast: boolean = false) {
    setTimeout(()=>{ 
      this.loadEditors();
      if(this.singleMode || expandLast) this.expansionPanelList.last.open();
    });
  }

  private loadEditors() {

    this.editorComponents = []
    let editorComponent

    this.editorContainerList.toArray().forEach( (editorContainer: EditorContainerDirective, idx) => {
      editorComponent = this.loadEditor(editorContainer, idx)
      this.editorComponents.push(editorComponent)
    })
  }

  private loadEditor(editorContainer: EditorContainerDirective, idx: number): ExpandableComponent {

    const element = this.datasource[idx];
    const newEditComponentClass = this.componentResolverService.getComponentClass(element.constructor, operations.newEdit)
    const subscriptions: Subscription = new Subscription()

    const componentFactory: ComponentFactory<ExpandableComponent> = this.componentFactoryResolver.resolveComponentFactory(newEditComponentClass)

    const viewContainerRef = editorContainer.viewContainerRef
    let editorComponent: ExpandableComponent
    viewContainerRef.clear()

    const componentRef = viewContainerRef.createComponent(componentFactory)
    editorComponent = componentRef.instance

    editorComponent.parentComponent = this.parentComponent
    editorComponent.inputElement = element
    editorComponent.contextData = this.contextData
    editorComponent.inputClonning = this.componentSpec.cloneEachElement
    editorComponent.readOnly = this.componentSpec.readOnlyEditor(element)
    editorComponent.required = !(this.singleMode && !this.oneRequired)

    subscriptions.add(editorComponent.changedElementEmitter.subscribe(()=>this.onChangedElement(editorComponent, idx)))
    subscriptions.add(editorComponent.closeEditorEmitter.subscribe(()=>this.closePanel(idx)))
    subscriptions.add(editorComponent.contextChangeEmitter.subscribe(contextValue=>this.updateContextFromEditor(idx, contextValue)))
    componentRef.onDestroy(()=>subscriptions.unsubscribe())

    return editorComponent
  }

  private onChangedElement(editorComponent: ExpandableComponent, idx: number) {
    this.datasource[idx] = editorComponent.getElement();
    if(!this.singleMode) {
      this.changedElementEmitter.emit({
        element: this.datasource[idx],
        idx: idx,
        inputIdx: this.datasourceIndexes[idx]
      });
    } else {
      if(editorComponent.isEmpty) {
        this.listChangeEmitter.emit([])
      } else {
        this.listChangeEmitter.emit(this.datasource)
      }
    }
  }

  private closePanel(idx: number) {
    this.expansionPanelList.toArray()[idx].close()
    this.toggleEditing(false)
  }

  get firstEditorIsEmpty(): boolean {
    if(this.editorComponents[0])
      this._firstEditorIsEmpty = this.editorComponents[0].isEmpty;
    return this._firstEditorIsEmpty;
  }

  private updateContextFromEditor(idx: number, contextData: any) {
    this.editorComponents.forEach((editorComponent: ExpandableComponent, index: number)=> {
      if(index !== idx) editorComponent.updateContext(contextData)
    })
    this.contextChangeEmitter.emit(contextData)
  }

  public updateContext(contextData: any) {
    this.contextData = Object.assign(this.contextData? this.contextData : {}, contextData)
    this.editorComponents.forEach((editorComponent: ExpandableComponent, index: number)=> {
      editorComponent.updateContext(contextData)
    })
  }

  public get showAddButton(): boolean {
    return this.componentSpec.allowsAddingElements && !(this.singleMode && this.firstEditorIsEmpty)
  }

  public get singleMode(): boolean {
    return this.allowsSingleMode && !this.entityHasSubtypes && this.datasource.length < 2
  }

  newElement(entityClass: any) {
    let newObj = new entityClass();
    this.datasource.push(newObj);

    if(!this.singleMode) {
      this.listChangeEmitter.emit(this.datasource);
      this.updateView(true)
    }
  }

  deleteElement(idx: number) {

    let element = this.datasource[idx]

    if(this.expansionPanelList.toArray()[idx].expanded)
      this.toggleEditing(false)
      
    this.datasource.splice(idx, 1);
    this.editorComponents.splice(idx, 1);

    this.listChangeEmitter.emit(this.datasource);
    this.elementDeletionEmitter.emit({
      element: element,
      idx: idx,
      inputIdx: this.datasourceIndexes[idx]
    })

    this.datasourceIndexes.splice(idx, 1);

    if(this.singleMode) {
      this.updateView()
    }
  }

  public updateView(expandLast: boolean = false) {
    this.resetShowDeleteButtonValues()
    this.changeDetectorRef.detectChanges();
    this.loadEditorsAtNextLoop(expandLast)
  }

  private toggleEditing(editing: boolean) {
    if(this.editing !== editing) {
      this.editing = editing;
      if(!this.singleMode) this.editingEmitter.emit(this.editing)
    }
  }

  onPanelOpened(idx: number) {
    this.toggleEditing(true)
  }

  onPanelClosed(idx: number) {
    let editorComponent: ExpandableComponent = this.editorComponents[idx]
    this.changeDetectorRef.detectChanges();
    this.toggleEditing(false)
    editorComponent.markAsTouched()
    this.onChangedElement(editorComponent, idx);
  }

  editorHasErrors(idx: number): boolean {

    let ret = (
      this.editorComponents && 
      this.editorComponents[idx] && 
      this.editorComponents[idx].hasErrors
    )?
      this.editorComponents[idx].hasErrors() :
      false

    return ret;
  }

  getElementTitle(idx: number): string {
    return this.componentSpec.getElementTitle(this.datasource[idx])
  }

  getElementDescription(idx: number): string {
    return this.componentSpec.getElementDescription(this.datasource[idx])
  }

  public hasErrors(): boolean {
    return this.editorComponents.map( ec => ec.hasErrors() ).reduce( (acc, curr) => acc || curr, false )
  }
}
