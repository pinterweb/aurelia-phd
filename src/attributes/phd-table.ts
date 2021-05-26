import { Framework, FRAMEWORK } from "../index";

export class PhdTableCustomAttribute {
  value: string;

  static inject = [Element, FRAMEWORK];
  constructor(private _$element: Element, private _framework: Framework) {}

  attached(): void {
    for (const c of this._framework.table.table.classes) {
      this._$element.classList.add(c);
    }
  }
}
