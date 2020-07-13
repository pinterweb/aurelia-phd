import { ViewSlot, ViewCompiler, ViewResources, View } from "aurelia-framework";

export class EnhanceHtmlCustomAttribute {
  static inject = [Element, ViewSlot, ViewCompiler, ViewResources];

  value: string;
  _view: View;

  constructor(
    private _$element,
    private _slot: ViewSlot,
    private _compiler: ViewCompiler,
    private _resources: ViewResources
  ) {}

  created(owningView: View): void {
    this._view = owningView;
  }

  valueChanged(): void {
    this._slot.removeAll();

    if (this.value) {
      const factory = this._compiler.compile(
        `<template>${this.value}</template>`,
        this._resources
      );
      const view = factory.create(
        this._view.container,
        this._view.bindingContext
      );

      this._slot.add(view);
    }
  }
}
