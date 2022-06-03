import { Observable } from 'rxjs';

export type NavDirection = 'left' | 'right' | '';

export type SortDirection = 'asc' | 'desc' | '';

export interface Query {
  ownFieldsFilter?: any;
  computedFieldsFilter?: any;
  computedFields?: any
}

export interface Sort<T> {
  property: keyof T;
  direction: SortDirection;
  refValue?: T[keyof T] | null;
  refId?: string | null;
}

export interface PageRequest<T> {
  sort: Sort<T>;
  navDirection: NavDirection;
  pageSize: number;
  pageNumber?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  size: number;
  pageNumber?: number;
}

export type PaginatedEndpoint<T, Q> = (pageRequest: PageRequest<T>, query: Q) => Observable<Page<T>>