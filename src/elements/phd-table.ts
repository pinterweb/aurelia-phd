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
  nestedTableBodyFactory: ViewFactory;
  factories: ViewFactory[];
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
    const $nestedRows = [];
    instruction["factories"] = [];

    for (let c = 0, len = $node.children.length; c < len; c++) {
      // for (const $child of Array.from($node.children)) {
      const $child = $node.children[c];
      if ($child.tagName === "PHD-TABLE") {
        instruction["nestedTableFactory"] = compiler.compile(
          `<template>${$node.innerHTML}</template>`,
          resources
        );
        $node.removeChild($child);
      } else if ($child.tagName === "PHD-ROW") {
        const $cells = $child.querySelectorAll("PHD-CELL");
        const $tr = DOM.createElement("tr");

        for (const $cell of Array.from($cells)) {
          const $td = DOM.createElement("td");

          if ($cell.hasAttributes()) {
            for (let i = $cell.attributes.length - 1; i >= 0; i--) {
              $td.setAttribute(
                $cell.attributes[i].name,
                $cell.attributes[i].value
              );
            }
          }

          $td.innerHTML = $cell.innerHTML;
          $child.replaceChild($td, $cell);
        }

        $nestedRows.push($node.replaceChild($tr, $child));
      }
    }

    if ($nestedRows.length) {
      instruction["nestedTableBodyFactory"] = compiler.compile(
        `<template>${$nestedRows.map($n => $n.innerHTML).join("")}</template>`,
        resources
      );
    }

    if ($node.children.length) {
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

  _nestedTable: {
    $cell: HTMLTableCellElement;
    $row: HTMLTableRowElement;
    slot: ViewSlot;
    view: View;
  };

  _nestedTableBody: {
    $body: HTMLTableElement;
    slot: ViewSlot;
    view: View;
  };

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

    const slotInstruction = this._instruction
      .elementInstruction as PhdTableInstruction;

    if (slotInstruction.nestedTableFactory) {
      this._nestedTable = {
        view: slotInstruction.nestedTableFactory.create(
          this._container,
          bindingContext
        ),
        $cell: DOM.createElement("td") as HTMLTableCellElement,
        $row: DOM.createElement("tr") as HTMLTableRowElement,
        slot: null
      };

      this._nestedTable.$row.appendChild(this._nestedTable.$cell);
    }

    if (slotInstruction.nestedTableBodyFactory) {
      this._nestedTableBody = {
        view: slotInstruction.nestedTableBodyFactory.create(
          this._container,
          bindingContext
        ),
        $body: DOM.createElement("tbody") as HTMLTableElement,
        slot: null
      };

      this._nestedTableBody.slot = new ViewSlot(
        this._nestedTableBody.$body,
        true
      );
      this._nestedTableBody.slot.add(this._nestedTableBody.view);
      this._nestedTableBody.slot.bind(this._bindingContext, null);
      this._addTableBodyFromSlot(this._nestedTableBody.$body);
    }

    if (this.columns) this.columnsChanged();
    if (this.items) this.itemsChanged();

    if (this.page) {
      this._subscription = this._bindingEngine
        .propertyObserver(this.page, "pageNumber")
        .subscribe(() => this._closeDetailRow());
    }
  }

  attached(): void {
    if (this._nestedTableBody && this._nestedTableBody.slot) {
      this._nestedTableBody.slot.attached();
    }
  }

  detached(): void {
    if (this._nestedTable && this._nestedTable.slot) {
      this._nestedTable.slot.detached();
      this._nestedTable.slot.removeAll();
    }

    if (this._nestedTableBody && this._nestedTableBody.slot) {
      this._nestedTableBody.slot.detached();
      this._nestedTableBody.slot.removeAll();
    }
  }

  unbind(): void {
    if (this._subscription) this._subscription.dispose();

    if (this._nestedTable && this._nestedTable.slot) {
      this._nestedTable.slot.unbind();
    }

    if (this._nestedTableBody && this._nestedTableBody.slot) {
      this._nestedTableBody.slot.unbind();
    }
  }

  optionsChanged(): void {
    if (this._nestedTable) {
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
            : c.header
      }));

    this.optionsChanged();
    this._sort();
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
      this._nestedTable.$cell.colSpan = this._columns.length;
      $element
        .closest("tr")
        .insertAdjacentElement("afterend", this._nestedTable.$row);

      this._nestedTable.slot = new ViewSlot(this._nestedTable.$cell, true);

      this._nestedTable.slot.add(this._nestedTable.view);
      this._nestedTable.slot.bind(this._bindingContext, null);
      this._nestedTable.slot.attached();
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
    if (this._nestedTable && this._nestedTable.slot) {
      this._nestedTable.slot.unbind();
      this._nestedTable.slot.detached();
      this._nestedTable.slot.removeAll();
      this._nestedTable.slot = null;
      this._nestedTable.$row.parentElement.removeChild(this._nestedTable.$row);
    }

    const _row = row || this._rows.find(i => i.expanded);

    if (_row) _row.expanded = !_row.expanded;
  }

  _addTableBodyFromSlot($body: HTMLTableElement): void {
    const $mainBody = this._$element.querySelector("tbody");
    const $table = this._$element.querySelector("table");

    $table.insertBefore($body, $mainBody);
    // this._nestedTableBody.slot = new ViewSlot($table, true);

    // this._nestedTableBody.slot.add(this._nestedTableBody.view);
    // this._nestedTableBody.slot.bind(this._bindingContext, null);
    // this._nestedTableBody.slot.attached();
  }
}
