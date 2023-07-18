import { DataSource } from '@angular/cdk/collections';
import { LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, startWith, map, share, tap } from 'rxjs/operators';
//import { indicate } from './operators';
import { Page, Sort, PageRequest, PaginatedEndpoint, NavDirection } from './pagination.types';

export interface SimpleDataSource<T> extends DataSource<T> {
  connect(): Observable<T[]>;
  disconnect(): void;
}

export class PaginatedDataSource<T, Q> implements SimpleDataSource<T> {

  private pageEvents = new Subject<PageEvent>();
  private sort: BehaviorSubject<Sort<T>>;
  private query: BehaviorSubject<Q>;
  private refreshments: Subject<void> = new Subject<void>();
  private loading = new Subject<boolean>();

  public firstElement?: T;
  public lastElement?: T;
  private refElement: T | undefined;
  private lastPageSize: number;

  public loading$ = this.loading.asObservable();
  public page$: Observable<Page<T>>;

  constructor(
    private endpoint: PaginatedEndpoint<T, Q>,
    initialSort: Sort<T>,
    initialQuery: Q,
    public pageSize: number
  ) {
    this.lastPageSize = this.pageSize;
    this.query = new BehaviorSubject<Q>(initialQuery);
    this.sort = new BehaviorSubject<Sort<T>>(initialSort);
    const param$ = combineLatest([this.query, this.sort]);
    this.page$ = param$.pipe(
      switchMap(([query, sort]) =>
        this.refreshments.pipe(
          startWith(null),
          switchMap(() =>
            this.pageEvents.pipe(
              startWith(null),
              switchMap((pageEvent: PageEvent | null)=>
                this.getPage(pageEvent, sort, query)/* .pipe(
                  indicate(this.loading)
                ) */
              )
            )
          )
        )
      ),
      share()
    );
  }

  private getPage(pageEvent: PageEvent | null, sort: Sort<T>, query: Q): Observable<Page<T>> {

    let pageWasResized: boolean = false;
    let navDirection: NavDirection = '';

    if(pageEvent) {
      pageWasResized = !!this.lastPageSize && pageEvent.pageSize !== this.lastPageSize;
      if(pageWasResized) {
        this.lastPageSize = pageEvent.pageSize;
      } else {
        if(pageEvent.previousPageIndex != null) {
          navDirection = (pageEvent.pageIndex - pageEvent.previousPageIndex) > 0? 'right' : 'left'
        } 
      }
    }

    // Si el usuario navegó hacia la página siguiente o la anterior
    if(navDirection) {
      this.refElement = navDirection==='right'? this.lastElement : this.firstElement;
    }

    let sortParameters: Sort<T> = {
      property: sort.property,
      direction: sort.direction,
      refValue: (this.refElement? this.refElement[sort.property] : null),
      refId: this.refElement? (this.refElement as any)._id : null
    }

    let paginationParams: PageRequest<T> = {
      sort: sortParameters,
      pageSize: pageEvent?.pageSize || this.pageSize,
      navDirection: navDirection
    }

    return this.endpoint(paginationParams, query).pipe(
      tap( (page: Page<T>) => {
        this.firstElement = page.content[0];
        this.lastElement = page.content[page.content.length-1];
      })
    )
  }

  public get lastQuery(): Q {
    return this.query.getValue();
  }

  sortBy(sort: Partial<Sort<T>>): void {
    const lastSort = this.sort.getValue();
    const nextSort = { ...lastSort, ...sort };
    this.sort.next(nextSort);
  }

  queryBy(query: Partial<Q>): void {
    const nextQuery = { ...this.lastQuery, ...query };
    this.query.next(nextQuery);
  }

  fetch(pageEvent: PageEvent): void {
    this.pageEvents.next(pageEvent);
  }

  refresh(): void {
    this.refreshments.next();
  }

  connect(): Observable<T[]> {
    return this.page$.pipe(map((page) => page.content));
  }

  disconnect(): void {}
}
