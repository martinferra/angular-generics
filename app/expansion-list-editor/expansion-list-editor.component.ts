import { Component, Input, EventEmitter, ChangeDetectionStrategy, ViewChildren, QueryList, ComponentFactoryResolver, Output, ComponentFactory } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { EditorContainerDirective } from './editorContainer.directive';
import { ComponentResolverService, operations } from '../../../generic/models/component-resolver.service';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ExpandableComponent } from './expandable-component.interface';
import { OnInit } from '@angular/core';
import { ExpandableListComponent } from './expandable-list-component.interface';
import { ElementOperation } from './enums';

enum ItemState {
  uncommitted = 0,
  committed = 1,
  changed = 2
}

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
  @Input() datasource!: any[];
  @Input() oneRequired: boolean = false;
  @Input() editingEmitter!: EventEmitter<boolean>;
  @Input() allowsSingleMode: boolean = false;
  @Input() cardFormat: boolean = false;

  @Output() listChangeEmitter: EventEmitter<any[]> = new EventEmitter<any[]>();
  @Output() changedElementEmitter: EventEmitter<any> = new EventEmitter();
  @Output() elementOperationEmitter: EventEmitter<any> = new EventEmitter();
  @Output() elementDeletionEmitter: EventEmitter<any> = new EventEmitter();
  @Output() contextChangeEmitter: EventEmitter<any> = new EventEmitter<any>();

  @ViewChildren(MatExpansionPanel) 
  expansionPanelList!: QueryList<MatExpansionPanel>;

  @ViewChildren(EditorContainerDirective) 
  editorContainerList!: QueryList<EditorContainerDirective>;

  public showDeleteButtonValues$!: Observable<any>

  public editing!: boolean;
  private editorComponents: Array<ExpandableComponent> = [];
  private _auxArray: Array<any> = [];
  private datasourceIndexes!: number[];
  private itemsState!: number[];
  showEntitySubtypes: boolean = false;
  private _firstEditorIsEmpty: boolean = false;
    
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private componentResolverService: ComponentResolverService,
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
    this.setDefaultSpec();
    this.InitializeDatasource();
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
    this.datasourceIndexes = this.datasource.map((elem: any, idx: number)=>idx);
    this.itemsState = this.datasource.map(()=>ItemState.committed);
    if(
      this.allowsSingleMode &&
      this.componentSpec.allowsAddingElements && 
      !this.entityHasSubtypes && 
      this.datasource.length === 0
    ) {
      this._firstEditorIsEmpty = true
      this.newElement(this.componentSpec.entityClass)
    } else {
      this.updateView();
    }
  }

  updateView(newElement: boolean = false) {
    this.showDeleteButtonValues$ = forkJoin(this.datasource.map((elem: any) => this.componentSpec.showDeleteButton(elem)))
      .pipe(tap(() => {
        this.loadEditorsAtNextLoop(newElement);
      }));
  }

  private loadEditorsAtNextLoop(newElement: boolean = false) {
    setTimeout(()=>{ 
      this.loadEditors(newElement);
    });
  }

  private loadEditors(newElement: boolean = false) {

    this.editorComponents = [];
    let editorComponent;
    let editorContainerArray: any[] = this.editorContainerList.toArray();

    editorContainerArray.forEach( (editorContainer: EditorContainerDirective, idx) => {
      let isLast: boolean = idx === editorContainerArray.length-1;
      let markedAsTouched: boolean = !isLast;
      let expand: boolean = newElement && isLast || this.singleMode;
      let expandAfterInit: boolean = newElement && (isLast || this.singleMode);
      editorComponent = this.loadEditor(editorContainer, idx, markedAsTouched, expand, expandAfterInit);
      this.editorComponents.push(editorComponent);
    });
    
  }

  private loadEditor(
    editorContainer: EditorContainerDirective, 
    idx: number, 
    markedAsTouched: boolean = false, 
    expand: boolean = false,
    expandAfterInit: boolean = false
    ): ExpandableComponent {

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
    editorComponent.markedAsTouched = markedAsTouched

    subscriptions.add(editorComponent.changedElementEmitter.subscribe(()=>this.onChangedElement(editorComponent, idx)))
    subscriptions.add(editorComponent.closeEditorEmitter.subscribe(()=>this.closePanel(idx)))
    subscriptions.add(editorComponent.contextChangeEmitter.subscribe(contextValue=>this.updateContextFromEditor(idx, contextValue)))
    if(expand) {
      if(expandAfterInit) {
        subscriptions.add(editorComponent.afterViewInitEmitter.subscribe(()=>
          setTimeout(()=>this.expansionPanelList.toArray()[idx].open())
        ));
      } else {
        this.expansionPanelList.toArray()[idx].open();
      }
    }

    componentRef.onDestroy(()=>subscriptions.unsubscribe())

    return editorComponent
  }

  private onChangedElement(editorComponent: ExpandableComponent, idx: number) {
    this.datasource[idx] = editorComponent.getElement();
    if(this.itemsState[idx] === ItemState.committed) {
      this.itemsState[idx] = ItemState.changed
    };
    if(this.singleMode) {
      let op: number = this.itemsState[idx] === ItemState.uncommitted? 
        ElementOperation.insert : 
        ElementOperation.update;
      this.emitElementOperation(idx, this.datasource[idx], op);
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
    this.itemsState.push(ItemState.uncommitted);
    this.updateView(true);
  }

  deleteElement(idx: number) {

    if(this.expansionPanelList.toArray()[idx].expanded) {
      this.toggleEditing(false);
    };
    
    let element: any = this.datasource[idx];
    this.datasource.splice(idx, 1);
    this.editorComponents.splice(idx, 1);
    this.datasourceIndexes.splice(idx, 1);

    if(this.itemsState[idx] !== ItemState.uncommitted) {
      this.emitElementOperation(idx, element, ElementOperation.delete);
    }

    this.itemsState.splice(idx, 1);

    this.updateView();
  }

  private toggleEditing(editing: boolean) {
    if(this.editing !== editing) {
      this.editing = editing;
      if(!this.singleMode) this.editingEmitter.emit(this.editing)
    }
  }

  onPanelOpened(idx: number) {
    /* Es necesario postergar el cambio de estado ya que el evento de expansión del 
    panel puede desencadenar el cierre de otro panel abierto, y puede darse que este
    último evento (cierre) se produzca en segundo lugar, realizando el cambio de 
    estado contrario */
    setTimeout(()=>{
      this.toggleEditing(true)
    })
  }

  onPanelClosed(idx: number) {

    let editorComponent: ExpandableComponent = this.editorComponents[idx];
    this.toggleEditing(false);
    editorComponent.markAsTouched();

    if(!editorComponent.hasErrors()) {
      switch(this.itemsState[idx]) {
        case ItemState.uncommitted:
          this.emitElementOperation(idx, this.datasource[idx], ElementOperation.insert);
          break;
        case ItemState.changed:
          this.emitElementOperation(idx, this.datasource[idx], ElementOperation.update);
          break;
      }
    } else if(this.itemsState[idx] !== ItemState.uncommitted) {
      this.emitElementOperation(idx, this.datasource[idx], ElementOperation.delete);
    }
  }

  editorHasErrors(idx: number): boolean {
    return this.editorComponents?.[idx]?.hasErrors();
  }

  getElementTitle(idx: number): string {
    return this.componentSpec.getElementTitle(this.datasource[idx])
  }

  getElementDescription(idx: number): string {
    return this.componentSpec.getElementDescription(this.datasource[idx])
  }

  private emitElementOperation(idx: number, element: any, op: ElementOperation) {

    let commitIndex: number = idx - this.itemsState.filter((item: ItemState, _idx: number) => 
        item === ItemState.uncommitted && _idx < idx
      ).length;

    this.elementOperationEmitter.emit({
      op: op,
      element: element,
      idx: commitIndex,
      inputIdx: this.datasourceIndexes[idx]
    });

    this.listChangeEmitter.emit(
      this.datasource.filter((elem: any, _idx: number)=>!this.editorComponents[_idx].hasErrors())
    );

    if(op !== ElementOperation.delete) {
      this.itemsState[idx] = ItemState.committed;
    }
  }

  public hasErrors(): boolean {
    return this.editorComponents.map( ec => ec.hasErrors() ).reduce( (acc, curr) => acc || curr, false )
  }
}
