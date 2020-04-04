import { DOM, children } from "aurelia-framework";
import { bindable } from "aurelia-templating";

export class PhdTagsInputCustomElement {
  @bindable tags = [];
  @children(".field__tag") _$controls: HTMLElement[] = [];

  _inputStyle: { [key: string]: string };
  _newTagValue: string;
  _$field: HTMLElement;
  _fieldWidth: number;

  static inject = [Element];
  constructor(private _$element: Element) {}

  attached(): void {
    this._fieldWidth = this._$field.offsetWidth;

    this._inputStyle = {
      width: `${this._fieldWidth}px`
    };
  }

  bind(): void {
    this.tags = this.tags || [];
  }

  _removeButtonClicked(index): boolean {
    const removedTag = this.tags.splice(index, 1);

    this._$element.dispatchEvent(
      DOM.createCustomEvent("tag-removed", {
        bubbles: true,
        detail: {
          index,
          text: removedTag[0]
        }
      })
    );

    return true;
  }

  _inputChanged(): boolean {
    if (this._newTagValue) {
      this.tags.push(this._newTagValue);

      this._newTagValue = null;
      return true;
    }

    return false;
  }

  _$controlsChanged(): void {
    const $last = this._$controls[this._$controls.length - 1] || {
      offsetWidth: 0,
      offsetLeft: 0
    };

    this._inputStyle = {
      width: `${this._fieldWidth -
        ($last.offsetWidth + $last.offsetLeft) -
        60}px`
    };
  }

  _handleKeydown(event: KeyboardEvent): boolean {
    if (event.key === "Tab") {
      // does not work nicely with the search bar
      return false;
    } else if (event.key === "Escape") {
      this._newTagValue = null;
    }

    return true;
  }
}
