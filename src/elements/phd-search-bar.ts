import { bindable } from "aurelia-framework";
import { DOM } from "aurelia-pal";
import { getIn } from "../utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SearchableItem = any;
/* eslint-enable @typescript-eslint/no-explicit-any */
type FilterMethod = (items: SearchableItem[]) => SearchableItem[];

export interface FilterEventDetail {
  filter: Filter[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredItems: any[];
  queryString: string;
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

function _objToQueryStr(params: { [key: string]: string | string[] }): string {
  return Object.keys(params)
    .filter(key => key !== "id" && !!params[key])
    .map(key => {
      if (Array.isArray(params[key])) {
        return (params[key] as string[])
          .map(
            val =>
              encodeURIComponent(key) + "=" + encodeURIComponent(val.toString())
          )
          .join("&");
      }
      return (
        encodeURIComponent(key) +
        "=" +
        encodeURIComponent(params[key].toString())
      );
    })
    .join("&");
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
    const hasPropName = keyValue.length > 1;

    let targetFilter = this._filters.find(
      s =>
        s.display.toLowerCase() ===
        (!hasPropName ? "" : keyValue[0].toLowerCase())
    );

    if (targetFilter) {
      targetFilter.values.push((keyValue[1] || term).trim());
    } else {
      targetFilter = {
        display: hasPropName ? keyValue[0] : "",
        fields: hasPropName ? [keyValue[0]] : [],
        values: [hasPropName ? keyValue[1].trim() : term.trim()],
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

    const otherTags = []
      .concat(...this._filters.map(f => f.tags))
      .filter(t => t.tagIndex > index);

    for (const tag of otherTags) {
      tag.tagIndex--;
    }

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
          filter: this._filters.map<Filter>(f => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { tags, ...filter } = f;

            return filter;
          }),
          filteredItems: this._filterLike(),
          queryString: _objToQueryStr(
            this._filters.reduce(
              (accu, f) => ({
                ...accu,
                [f.fields.join(".")]: f.values.join()
              }),
              {}
            )
          )
        }
      })
    );

    return false;
  }

  _filterLike(): SearchableItem[] {
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

    if (!this.items || !this.items.length) {
      return this.items;
    }

    if (this.method) return this.method(this.items);

    return this.items.filter(i => {
      let evaluations = [];

      for (const term of this._filters) {
        if (!term.fields.length) {
          evaluations = evaluations.concat(
            term.values.map(val => this._searchAnyField(i, val))
          );
        } else {
          const itemVal = getIn(i, term.fields);

          evaluations = evaluations.concat(
            term.values.map(
              val =>
                itemVal !== null &&
                // if there is custom fields we do not know about, we have to assume
                // it was filtered on the server so let every value through
                (typeof itemVal === "undefined" ||
                  val.toString().toLowerCase() ===
                    itemVal
                      .toString()
                      .trim()
                      .toLowerCase())
            )
          );
        }
      }

      return !evaluations.length || evaluations.some(e => e === true);
    });
  }

  _isFilterArray<T>(value: any): value is Filter[] {
    return value && value.length && typeof value[0].display !== "undefined";
  }

  _searchAnyField<T>(item: T, term: string): boolean {
    return Object.values(item).some(
      v =>
        typeof v !== "undefined" &&
        v !== null &&
        v
          .toString()
          .toLowerCase()
          .indexOf(term.toLowerCase()) !== -1
    );
  }
}
