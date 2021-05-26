import { getLogger } from "aurelia-logging";
import { DOM } from "aurelia-pal";

interface FrameworkStyle {
  [id: string]: string;
}

export class FrameworkEngine {
  static _id = "aurelia-phd-framework";
  _logger = getLogger("aurelia-phd");
  _globalStyle: FrameworkStyle;
  _styleTag: HTMLStyleElement;

  constructor(private _frameworks: FrameworkStyle) {
    this._styleTag = DOM.getElementById(
      FrameworkEngine._id
    ) as HTMLStyleElement;

    if (this._styleTag == null) {
      this._styleTag = DOM.createElement("style") as HTMLStyleElement;

      this._styleTag.type = "text/css";
      this._styleTag.id = FrameworkEngine._id;

      DOM.appendNode(this._styleTag, document.head);
    }
  }

  replaceCss(id: string): void {
    const innerHtml = `/*** ${id} styles ***/\r\n{${this._frameworks[id]}\r\n}`;
    this._styleTag.innerHTML = innerHtml;
  }
}
