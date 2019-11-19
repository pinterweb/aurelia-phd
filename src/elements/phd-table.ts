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
  ViewSlot
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
type HeaderClickedArgs = import("../model").HeaderClickedArgs;

interface PhdTableInstruction extends BehaviorInstruction {
  nestedTableFactory: ViewFactory;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type PropertyValue = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  @bindable items: T[];
  @bindable options: TableOptions;
  @bindable page: Page;
  @bindable selectedItems: T[];

  _$nestedTableCell: HTMLTableCellElement;
  _$nestedTableRow: HTMLTableRowElement;
  _nestedTableSlot: ViewSlot;
  _nestedTableView: View;
  _columns: Column[] = [];
  _bindingContext: BindingContext;
  _sorts: Sort[];
  _rows: RowData<T>[];
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
  }

  itemsChanged(): void {
    this._rows = this.items.map(item => ({
      item,
      expanded: false
    }));

    this._headerRow.selected = false;

    this._closeDetailRow();
  }

  columnsChanged(): void {
    this._columns = this.columns
      .filter(c => !c.hidden)
      .map(c => ({
        ...c,
        header:
          !c.header && typeof c.field === "string"
            ? toTitleCase(c.field)
            : c.header,
        sort: c.sort ? { ...c.sort, field: c.field } : c.sort
      }));

    this.optionsChanged();
    this._sort();
  }

  _cellClicked<T>($event: MouseEvent, args: CellClickedArgs<T>): boolean {
    let fnName =
      ($event.target as Element).getAttribute("click.delegate") || "";

    fnName = fnName.substring(0, fnName.indexOf("("));

    // has external handler
    if (this._bindingContext[fnName]) {
      $event.stopPropagation();
      this._bindingContext[fnName].call(this._bindingContext, args);
      return false;
    }

    return true;
  }

  _headerClicked(args: HeaderClickedArgs): void {
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

  _selectAllRows(): boolean {
    if (this._headerRow.selected) {
      this.selectedItems.splice(0, this.selectedItems.length);
    } else {
      this._rows.forEach(item => {
        const itemIndex = this.selectedItems.indexOf(item.item);

        if (itemIndex === -1) {
          this.selectedItems.push(item.item);
        }
      });
    }

    return true;
  }

  _sort(): void {
    this._sorts = this._columns
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

    const _row = row || this._rows.find(i => i.expanded);

    if (_row) _row.expanded = !_row.expanded;
  }
}
