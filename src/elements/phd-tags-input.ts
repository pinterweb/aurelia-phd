import { DOM, children } from "aurelia-framework";
import { bindable } from "aurelia-templating";

export interface TagChangeEventDetail {
  index: number;
  text: string;
  value: string;
  key: string;
  relatedTags: string[];
  relatedValues: string[];
}

export class PhdTagsInputCustomElement {
  @bindable placeholder = "New tag";
  @bindable tags = [];
  @bindable separator = "=";
  @children(".tags-input__tag") _$controls: HTMLElement[] = [];

  _inputStyle: { [key: string]: string };
  _newTagValue: string;
  _$field: HTMLElement;
  _fieldWidth: number;

  static inject = [Element];
  constructor(private _$element: Element) {}

  attached(): void {
    this._fieldWidth = this._$field.offsetWidth;

    this._inputStyle = {
      width: `100%`,
      maxWidth: `100%`
    };
  }

  bind(): void {
    this.tags = this.tags || [];
  }

  _handleRemoveClick(index: number): boolean {
    const removedTag = this.tags.splice(index, 1)[0];

    const removedCancelled = this._emitEvent("tag-removed", index, removedTag);
    const deleteCancelled = this._emitEvent("tagdelete", index, removedTag);

    return removedCancelled && deleteCancelled;
  }

  _handleInputChange(): boolean {
    if (this._newTagValue) {
      this.tags.push(this._newTagValue);

      this._emitEvent("tagpush", this.tags.length - 1, this._newTagValue);

      this._newTagValue = null;
    }

    return false;
  }

  _$controlsChanged(): void {
    const $last = this._$controls[this._$controls.length - 1] || {
      offsetWidth: 0,
      offsetLeft: 0
    };

    this._inputStyle = {
      width: `${Math.round(
        ((this._fieldWidth - ($last.offsetWidth + $last.offsetLeft)) /
          this._fieldWidth) *
          100
      ) - 5}%`,
      maxWidth: `${Math.round(
        ((this._fieldWidth - ($last.offsetWidth + $last.offsetLeft)) /
          this._fieldWidth) *
          100
      ) - 5}%`
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

  _emitEvent(type: string, index: number, tag: string): boolean {
    const getKey = (term: string): string => {
      return !term.split(this.separator)[1]
        ? ""
        : term.split(this.separator)[0];
    };
    const getValue = (term: string): string =>
      term.split(this.separator)[1] || term.split(this.separator)[0];
    const tagKey = getKey(tag);
    const relatedTags = this.tags.filter(t => getKey(t) === tagKey);
    const eventDetail: TagChangeEventDetail = {
      index,
      text: tag,
      value: getValue(tag).trim(),
      key: tagKey,
      relatedTags,
      relatedValues: relatedTags.map(t => getValue(t))
    };

    return this._$element.dispatchEvent(
      DOM.createCustomEvent(type, {
        bubbles: true,
        detail: eventDetail
      })
    );
  }
}
