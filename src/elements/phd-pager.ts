import { DOM } from "aurelia-pal";
import { bindable, computedFrom } from "aurelia-framework";

/* eslint-disable @typescript-eslint/no-explicit-any */
type PageItem = any;
/* eslint-enable @typescript-eslint/no-explicit-any */
type Page = import("../model").Page;

export class PhdPagerCustomElement implements Page {
  static inject = [Element];

  @bindable items: PageItem[] = [];
  @bindable size = 3;
  @bindable pageNumber = 0;

  constructor(private _$element: Element) {}

  pageBuffer: number[];

  @computedFrom("items", "size")
  get totalPages(): number {
    return !this.items || !this.items.length || !this.size
      ? 0
      : Math.ceil(this.items.length / this.size);
  }

  @computedFrom("totalPages")
  get shortened(): boolean {
    return this.totalPages > 10 ? true : false;
  }

  attached(): void {
    this.itemsChanged();
    this.pageNumberChanged();
  }

  itemsChanged(): void {
    this.pageNumber = 0;
    this.pageNumberChanged();
  }

  pageNumberChanged(): void {
    if (!this.items) return;

    if (this.shortened === true) {
      if (this.pageNumber > 4 && this.pageNumber < this.totalPages - 5) {
        this.pageBuffer = this.range(this.pageNumber - 4, this.pageNumber + 5);
      } else if (
        this.pageNumber > 4 &&
        this.pageNumber >= this.totalPages - 5
      ) {
        this.pageBuffer = this.range(this.totalPages - 10, this.totalPages);
      } else {
        this.pageBuffer = this.range(0, 10);
      }
    } else {
      this.pageBuffer = this.range(0, this.totalPages);
    }

    const startPage = this.pageNumber * this.size;

    this._$element.dispatchEvent(
      DOM.createCustomEvent("page-changed", {
        bubbles: true,
        detail: {
          pageItems: this.items.slice(startPage, startPage + this.size),
          pageNumber: this.pageNumber
        }
      })
    );
  }

  range(start: number, end: number): number[] {
    return Array.from(new Array(end - start), (_, i) => i + start);
  }
}
