export type SortDirection = "asc" | "desc" | "";

export interface RowData<T> {
  item: T;
  expanded?: boolean;
  selected?: boolean;
}

export interface Header {
  name: string;
}

export interface Page {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  items: any[];
  /* eslint-enable @typescript-eslint/no-explicit-any */
  size?: number;
  pageNumber?: number;
}

export interface Sort {
  field?: string | string[];
  direction?: SortDirection;
  order?: number;
  compare?: <T>({ a, b }: { a: T; b: T }) => number;
}

export interface Column {
  header?: Header | string;
  hidden?: boolean;
  field?: string | string[];
  sort?: Sort;
  renderer?: <T>({ item }: { item: T }) => string;
  formatter?: <T>({ item }: { item: T }) => string;
  style?: { [key: string]: string };
  className?: string;
}

export interface SelectionOption {
  highlightOnSelect: boolean;
}

export interface Options {
  /**
   * @deprecated use selection property instead
   */
  selectable?: boolean;
  selection?: boolean | Partial<SelectionOption>;
}

export interface CellClickedArgs<T> {
  row: RowData<T>;
}

export interface RowEvent<T> {
  row: RowData<T>;
  column: Column;
}

export interface HeaderClickedArgs {
  $event: MouseEvent;
  column: Column;
}
