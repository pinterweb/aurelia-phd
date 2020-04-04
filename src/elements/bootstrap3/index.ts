import { PLATFORM } from "aurelia-framework";

export function configure(): void {
  PLATFORM.moduleName("./phd-table.html");
  PLATFORM.moduleName("./phd-search-bar.html");
  PLATFORM.moduleName("./phd-pager.html");
  PLATFORM.moduleName("./phd-tags-input.html");
}
