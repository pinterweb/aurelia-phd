import { bindable } from "aurelia-framework";
import { DOM } from "aurelia-pal";
import { getIn } from "../utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SearchableItem = any;
/* eslint-enable @typescript-eslint/no-explicit-any */
type FilterMethod = (items: SearchableItem[]) => SearchableItem[];

export interface FilterEventDetail {
  searchTerm: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredItems: any[];
}

export interface Filter {
  [key: string]: string;
}

export class PhdSearchBarCustomElement {
  static inject = [Element];

  @bindable items: SearchableItem[] = [];
  @bindable searchTerm: Filter | string = "";
  @bindable method: FilterMethod;

  _attached = false;

  constructor(private _$element: Element) {}

  attached(): void {
    this._attached = true;
    this.itemsChanged();
  }

  itemsChanged(): void {
    // if it is not attached the event will not properly dispatch
    if (this._attached && this.items && this.items.length) this.handleSubmit();
  }

  handleKeypress(event): boolean {
    if (event.key === "Enter") {
      this.handleSubmit();
    } else if (event.key === "Escape") {
      this.clear();
    }

    return true;
  }

  clear(): void {
    this.searchTerm = "";
    this.handleSubmit();
  }

  handleSubmit(): boolean {
    this._$element.dispatchEvent(
      DOM.createCustomEvent("filtered", {
        bubbles: true,
        detail: {
          searchTerm: this.searchTerm,
          filteredItems: this._filterLike()
        }
      })
    );

    return false;
  }

  _filterLike(): SearchableItem[] {
    if (!this.items.length) return this.items;

    const filterKeys = Object.keys(this.searchTerm);

    if (this.method) return this.method(this.items);

    if (typeof this.searchTerm === "string") {
      const searchFields = Object.keys(this.items[0]);

      return this.items.filter(d =>
        searchFields.some(
          f =>
            typeof d[f] !== "undefined" &&
            d[f] !== null &&
            d[f]
              .toString()
              .toLowerCase()
              .indexOf((this.searchTerm as string).toLowerCase()) !== -1
        )
      );
    }

    return this.items.filter(v => {
      for (const path of filterKeys) {
        if (this.searchTerm[path] === getIn(v, path.split("."))) {
          return true;
        }

        return false;
      }

      return true;
    });
  }
}
