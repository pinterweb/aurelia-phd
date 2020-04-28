import { DOM } from "aurelia-pal";
import { bindable } from "aurelia-framework";

export class PhdPageSizeSelectCustomElement {
  static inject = [Element];

  @bindable sizes: number[] = [];
  @bindable selectedSize: number[] = [];

  constructor(private _$element: Element) {}

  _pageNumberChanged(): void {
    this._$element.dispatchEvent(
      DOM.createCustomEvent("page-size-changed", {
        bubbles: true,
        detail: {
          pageSize: this.selectedSize
        }
      })
    );
  }
}
