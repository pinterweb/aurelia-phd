import { autoinject, bindable } from "aurelia-framework";
import { Router } from "aurelia-router";

export interface Brand {
  url: string;
  image: string;
  title: string;
}

export interface Navigation {
  isActive: boolean;
  href: string;
  title: string;
}

export interface Model {
  navbarModifiers: string[];
  brand: Partial<Brand>;
  navigation: Partial<Navigation>[];
}

@autoinject
export class PhdNavbarCustomElement implements Model {
  $navbarMain: Element;
  @bindable brand: Partial<Brand>;
  @bindable navigation: Partial<Navigation>[];
  @bindable navbarModifiers: string[];
  _navbarModifiers: string;

  constructor(private router: Router) {}

  navbarModifiersChanged(): void {
    this._navbarModifiers = this.navbarModifiers.join(" ");
  }

  collapse(): boolean {
    this.$navbarMain.classList.toggle("is-active");

    return true;
  }
}
