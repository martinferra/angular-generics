export interface PaginationSortParameters {
    field: string;
    direction: number;
    lastValue?: any;
    lastId?: string;
}

export interface PaginationParameters {
    sort: PaginationSortParameters;
    navDirection: number;
    docsPerPage: number;
    pageNumber?: number;
}