import { Injectable } from '@angular/core';
import {MatLegacyPaginatorIntl as MatPaginatorIntl} from '@angular/material/legacy-paginator';

@Injectable()
export class MatPaginatorIntlEsp extends MatPaginatorIntl {
  itemsPerPageLabel = 'Items por página';
  nextPageLabel     = 'Página siguiente';
  previousPageLabel = 'Página anterior';

  getRangeLabel = function (page: number, pageSize: number, length: number) {
    if (length === 0 || pageSize === 0) {
      return '0 de ' + length;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
      Math.min(startIndex + pageSize, length) :
      startIndex + pageSize;
    return startIndex + 1 + ' - ' + endIndex + ' de ' + length;
  };

}