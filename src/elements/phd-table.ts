import { DOM } from "aurelia-pal";
import {
  BehaviorInstruction,
  bindable,
  BindingEngine,
  Container,
  processContent,
  TargetInstruction,
  View,
  ViewCompiler,
  ViewFactory,
  ViewResources,
  ViewSlot,
  LogManager
} from "aurelia-framework";
import { toTitleCase, getIn } from "../utils";

type Disposable = import("aurelia-framework").Disposable;
type TableOptions = import("../model").Options;
type Page = import("../model").Page;
type Column = import("../model").Column;
type Sort = import("../model").Sort;
type SortDirection = import("../model").SortDirection;
type RowData<T> = import("../model").RowData<T>;
type BindingContext = Record<string, PropertyValue>;
type CellClickedArgs<T> = import("../model").CellClickedArgs<T>;
type RowEvent<T> = import("../model").RowEvent<T>;
type Header = import("../model").Header;
type HeaderClickedArgs = import("../model").HeaderClickedArgs;

interface PhdTableInstruction extends BehaviorInstruction {
  nestedTableFactory: ViewFactory;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type PropertyValue = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const logger = LogManager.getLogger("aurelia-phd");

@processContent(
  (
    compiler: ViewCompiler,
    resources: ViewResources,
    $node: Element,
    instruction: BehaviorInstruction
  ): boolean => {
    const $nestedTable = $node.firstElementChild;

    if ($nestedTable && $nestedTable.tagName === "PHD-TABLE") {
      instruction["nestedTableFactory"] = compiler.compile(
        `<template>${$node.innerHTML}</template>`,
        resources
      );

      while ($node.firstElementChild) {
        $node.removeChild($node.firstElementChild);
      }
    }

    return false;
  }
)
export class PhdTableCustomElement<T> {
  static inject = [
    Element,
    TargetInstruction,
    ViewCompiler,
    Container,
    BindingEngine
  ];

  @bindable columns: Column[] = [];
  /**
   * @deprecated use rows instead
   */
  @bindable items: T[];
  @bindable options: TableOptions;
  @bindable page: Page;
  /**
   * @deprecated use selected property on row object
   */
  @bindable selectedItems: T[];
  @bindable rows: RowData<T>[];

  _$nestedTableCell: HTMLTableCellElement;
  _$nestedTableRow: HTMLTableRowElement;
  _nestedTableSlot: ViewSlot;
  _nestedTableView: View;
  _columns: Column[] = [];
  _bindingContext: BindingContext;
  _sorts: Sort[];
  _headerRow = {
    selected: false
  };
  _subscription: Disposable;

  constructor(
    private _$element: Element,
    private _instruction: TargetInstruction,
    private _compiler: ViewCompiler,
    private _container: Container,
    private _bindingEngine: BindingEngine
  ) {}

  bind(bindingContext: BindingContext): void {
    this._bindingContext = bindingContext;

    const nestedTableViewFactory = (this._instruction
      .elementInstruction as PhdTableInstruction).nestedTableFactory;

    if (nestedTableViewFactory) {
      this._nestedTableView = nestedTableViewFactory.create(
        this._container,
        bindingContext
      );

      this._$nestedTableRow = DOM.createElement("tr") as HTMLTableRowElement;
      this._$nestedTableCell = DOM.createElement("td") as HTMLTableCellElement;
      this._$nestedTableRow.appendChild(this._$nestedTableCell);
    }

    if (this.columns) this.columnsChanged();
    if (this.items) this.itemsChanged();
    if (this.rows) this.rowsChanged();
    if (this.selectedItems) this.selectedItemsChanged();

    if (this.page) {
      this._subscription = this._bindingEngine
        .propertyObserver(this.page, "pageNumber")
        .subscribe(() => this._closeDetailRow());
    }
  }

  detached(): void {
    if (this._nestedTableSlot) {
      this._nestedTableSlot.unbind();
      this._nestedTableSlot.detached();
      this._nestedTableSlot.removeAll();
    }
  }

  unbind(): void {
    if (this._subscription) this._subscription.dispose();
  }

  optionsChanged(): void {
    if (this._nestedTableView) {
      this._columns.unshift({
        style: { width: "0px" },
        className: "table__cell--clickable",
        renderer: (): string =>
          `<span show.bind=!row.expanded click.trigger="_masterRowClicked($event, row)">&gt;</span>
          <span show.bind="row.expanded" click.trigger="_masterRowClicked($event, row)">&or;</span>`
      });
    }

    if (this.options.selectable && !this.options.selection) {
      logger.warn(
        "options.selectable is deprecated. Used options.selection instead."
      );
      this.options.selection = true;
    }
  }

  /**
   * @deprecated use rowsChanged instead
   */
  itemsChanged(): void {
    logger.warn(
      "the bindable items property is deprecated. Use the rows property instead."
    );

    this.rows = this.items.map(item => ({
      item,
      expanded: false,
      selected: this.selectedItems && this.selectedItems.indexOf(item) !== -1
    }));

    this._headerRow.selected = false;

    this._closeDetailRow();
  }

  rowsChanged(): void {
    this._updateHeaderRow();
  }

  columnsChanged(): void {
    this._columns = this.columns
      .filter(c => !c.hidden)
      .map(c => ({
        ...c,
        header:
          !c.header && typeof c.field === "string"
            ? toTitleCase(c.field)
            : c.header || ""
      }));

    this.optionsChanged();
    this._sort();

    const selectionColumns = this._columns.filter(c => c.selection);

    if (this.options.selection) {
      const checkbox = {
        header: {
          template: `<header-selector row.bind="_headerRow"
                                      change.delegate="_selectAllRows($event)"
                    ></header-selector>`
        },
        renderer: ({ row }): string =>
          row.selectable === false
            ? ""
            : `<cell-selector row.bind="row" index.bind="$index"
                              change.delegate="_rowSelectionChanged($event, [ row ])"
              ></cell-selector>`
      };
      if (!selectionColumns.length) {
        this._columns.unshift(checkbox);
      } else {
        selectionColumns.forEach(col => {
          const originalColumn = { ...col };
          col.header = {
            name:
              typeof originalColumn === "string"
                ? originalColumn
                : (originalColumn as Header).name,
            template:
              checkbox.header.template + this._renderHeader(originalColumn)
          };
          col.renderer = ({ row }): string =>
            checkbox.renderer({ row }) + this._render(row, originalColumn);
        });
      }
    }
  }

  selectedItemsChanged(): void {
    if (this.selectedItems) {
      logger.warn(
        "selected items is deprecated. use the selected property on the row"
      );
    }

    this.selectedItems = this.selectedItems || [];
  }

  _cellClicked($event: MouseEvent, args: CellClickedArgs<T>): boolean {
    let target = $event.target as any;

    while (target) {
      const handler =
        target.getAttribute("click.delegate") ||
        target.getAttribute("click.trigger") ||
        target.getAttribute("click.capture") ||
        "";

      const fnName = handler.substring(0, handler.indexOf("("));

      // has external handler
      if (this._bindingContext[fnName]) {
        $event.stopPropagation();

        this._bindingContext[fnName].call(this._bindingContext, args);

        return false;
      } else if (handler || (event.target as Element).tagName === "A") {
        return true;
      }

      target = target.parentNode;
    }

    $event.stopPropagation();
    return false;
  }

  _headerClicked(args: HeaderClickedArgs): boolean {
    if (
      (args.$event.target as Element).closest("header-selector") !== null ||
      args.column.sort === null
    ) {
      return true;
    }

    const sortableColumns = this._columns.filter(
      c => c.sort && c !== args.column
    );

    if (!args.$event.ctrlKey) {
      sortableColumns.forEach(c => (c.sort.direction = null));
    }

    for (let c = 0; c < sortableColumns.length; c++) {
      const target = sortableColumns[c];
      target.sort.order = c + 1;
    }

    args.column.sort = args.column.sort || { order: 0 };
    args.column.sort.field = args.column.field;
    args.column.sort.order = 0;

    if (args.column.sort.direction === "asc") {
      args.column.sort.direction = "desc";
    } else if (args.column.sort.direction === "desc") {
      args.column.sort.direction = null;
      return;
    } else {
      args.column.sort.direction = "asc";
    }

    this._sort();

    return true;
  }

  _renderHeader(column: Column): string {
    if (typeof column.header === "string") {
      return column.header;
    }

    return column.header.template || column.header.name;
  }

  _render<T>(row: RowData<T>, column: Column): string {
    if (column.renderer) {
      return column.renderer({ row, column, item: row.item });
    }

    if (column.formatter) {
      return column.formatter({ item: row.item });
    }

    if (!column.field) {
      return "";
    }

    return Array.isArray(column.field)
      ? getIn(row.item, column.field)
      : row.item[column.field];
  }

  _getFieldData<T>(item: T, column: Column): string {
    if (column.formatter) {
      return column.formatter({ item });
    }

    if (!column.field) {
      return "";
    }

    return Array.isArray(column.field)
      ? getIn(item, column.field)
      : item[column.field];
  }

  _selectAllRows($event: MouseEvent): boolean {
    const selectableRows = this.rows.filter(r => r.selectable !== false);
    const allSelected = selectableRows.every(row => row.selected);
    selectableRows.forEach(row => (row.selected = !allSelected));

    selectableRows.forEach(row => this._updatedSelectedItems(row));

    return this._rowSelectionChanged($event, selectableRows);
  }

  _sort(): void {
    this._sorts = this._columns
      .map(c => ({
        ...c,
        sort: c.sort ? { ...c.sort, field: c.field } : c.sort
      }))
      .filter(c => c.sort)
      .map(c => c.sort)
      .sort((a, b) => a.order - b.order);
  }

  _masterRowClicked($event: MouseEvent, row: RowData<T>): boolean {
    this._closeDetailRow(row);

    if (row.expanded) {
      const $element = $event.target as Element;
      this._$nestedTableCell.colSpan = this._columns.length;
      $element
        .closest("tr")
        .insertAdjacentElement("afterend", this._$nestedTableRow);

      this._nestedTableSlot = new ViewSlot(this._$nestedTableCell, true);

      this._nestedTableSlot.add(this._nestedTableView);
      this._nestedTableSlot.bind(this._bindingContext, null);
      this._nestedTableSlot.attached();
    }

    $event.stopPropagation();

    this._$element.dispatchEvent(
      DOM.createCustomEvent("row-expanded", {
        bubbles: true,
        detail: {
          row
        }
      })
    );

    return false;
  }

  _closeDetailRow<T>(row?: RowData<T>): void {
    if (this._nestedTableSlot) {
      this._nestedTableSlot.unbind();
      this._nestedTableSlot.detached();
      this._nestedTableSlot.removeAll();
      this._nestedTableSlot = null;
      this._$nestedTableRow.parentElement.removeChild(this._$nestedTableRow);
    }

    const _row = row || this.rows.find(i => i.expanded);

    if (_row) _row.expanded = !_row.expanded;
  }

  _rowSelectionChanged($event: MouseEvent, rows: RowData<T>[]): boolean {
    this._$element.dispatchEvent(
      DOM.createCustomEvent("row-selection-changed", {
        bubbles: true,
        detail: {
          $event,
          selection: this.rows
            .filter(r => r.selected)
            .map(row => ({ row, column: null }))
        }
      })
    );

    this._updateHeaderRow();
    rows.forEach(row => this._updatedSelectedItems(row));

    return true;
  }

  _updateHeaderRow(): void {
    this._headerRow.selected = this.rows
      .filter(r => r.selectable !== false)
      .every(r => r.selected);
  }

  /**
   * @deprecated use row.selected property instead
   */
  _updatedSelectedItems(row: RowData<T>): void {
    if (this.selectedItems) {
      const index = this.selectedItems.indexOf(row.item);

      if (row.selected && index === -1) {
        this.selectedItems.push(row.item);
      } else if (!row.selected) {
        this.selectedItems.splice(this.selectedItems.indexOf(row.item), 1);
      }
    }
  }
}
