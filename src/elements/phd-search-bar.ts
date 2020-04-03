import { bindable } from "aurelia-framework";
import { DOM } from "aurelia-pal";
import { getIn } from "../utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SearchableItem = any;
/* eslint-enable @typescript-eslint/no-explicit-any */
type FilterMethod = (items: SearchableItem[]) => SearchableItem[];

export interface FilterEventDetail {
  filter: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredItems: any[];
}

/**
 * A dictionary key/value that will be used to filter the items
 */
export interface Filter {
  fields?: string[];
  display: string;
  values: any[];
}

interface ExtendedFilter extends Filter {
  tags: TagValue[];
}

interface TagValue {
  value: any;
  tagIndex: number;
}

export class PhdSearchBarCustomElement {
  static inject = [Element];

  @bindable items: SearchableItem[] = [];
  @bindable filter: Filter[] | string;
  @bindable method: FilterMethod;

  _filters: ExtendedFilter[] = [];
  _tags: string[] = [];

  constructor(private _$element: Element) {}

  attached(): void {
    this.filterChanged();
  }

  bind(): void {
    // stop propertyChanged methods from firing before element is setup
  }

  itemsChanged(): void {
    if (this.items && Array.isArray(this.items)) this._handleSubmit();
  }

  filterChanged(): void {
    if (typeof this.filter === "string") {
      this._tagAdded(this.filter);
      this._handleSubmit();
    } else if (this._isFilterArray(this.filter)) {
      this._filters = [...this.filter.map(f => ({ ...f, tags: [] }))];
      this._handleSubmit();
    }
  }

  _tagAdded(term: string): void {
    const keyValue = term.split("=").map(f => f.trim());
    let targetFilter = this._filters.find(
      s =>
        s.display.toLowerCase() ===
        (keyValue.length === 1 ? "" : keyValue[0].toLowerCase())
    );

    if (targetFilter) {
      targetFilter.values.push(keyValue[1] || term);
    } else {
      targetFilter = {
        display: "",
        fields: [],
        values: [term],
        tags: []
      };
      this._filters.push(targetFilter);
    }

    targetFilter.tags.push({
      value: term,
      tagIndex:
        this._filters.reduce((accu, f) => f.tags.length - 1 + accu, 0) + 1
    });
  }

  _removeFilter({ index }: { index: number }): void {
    const filter = this._filters.find(f =>
      f.tags.find(t => t.tagIndex === index)
    );
    const targetTagIndex = filter.tags.findIndex(f => f.tagIndex === index);

    filter.values.splice(targetTagIndex, 1);
    filter.tags.splice(targetTagIndex, 1);

    this._handleSubmit();
  }

  _clear(): void {
    this._filters.forEach(f => {
      f.values = [];
      f.tags = [];
    });
    this._handleSubmit();
  }

  _handleSubmit(): boolean {
    this._$element.dispatchEvent(
      DOM.createCustomEvent("filtered", {
        bubbles: true,
        detail: {
          filter: this._filters,
          filteredItems: this._filterLike()
        }
      })
    );

    return false;
  }

  _filterLike(): SearchableItem[] {
    if (!this.items || !this.items.length) {
      return this.items;
    }

    if (this.method) return this.method(this.items);

    this._tags = [].concat(
      ...this._filters
        .filter(s => s.values.length)
        .map((s, i) => {
          s.tags = [];
          return s.values.map((v, ii) => {
            const text = `${s.display ? s.display + "=" : ""}${v}`;
            s.tags.push({ value: text, tagIndex: i + ii });

            return text;
          });
        })
    );

    return this.items.filter(v => {
      let evaluations = [];
      for (const term of this._filters) {
        if (!term.fields.length) {
          evaluations = evaluations.concat(
            term.values.map(val => this._searchAnyField(v, val))
          );
        } else {
          evaluations = evaluations.concat(
            term.values.map(
              val =>
                val.toString().toLowerCase() ===
                getIn(v, term.fields)
                  .toString()
                  .toLowerCase()
            )
          );
        }
      }

      return evaluations.every(e => e === true);
    });
  }

  _isFilterArray(value: any): value is Filter[] {
    return value && value.length && typeof value[0].display !== "undefined";
  }

  _searchAnyField<T>(item: T, term: string): boolean {
    return Object.values(item).some(
      v =>
        v
          .toString()
          .toLowerCase()
          .indexOf(term.toLowerCase()) !== -1
    );
  }
}
