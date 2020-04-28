import {
  FrameworkConfiguration,
  LogManager,
  ViewLocator,
  PLATFORM
} from "aurelia-framework";
import "./styles.css";
import * as framework from "./elements/index";

export * from "./model";
export { FilterEventDetail, Filter } from "./elements/phd-search-bar";

interface PluginOptions {
  framework: string;
}

export function configure(
  aurelia: FrameworkConfiguration,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  options: any | Partial<PluginOptions>
  /* eslint-enable @typescript-eslint/no-explicit-any */
): void {
  aurelia.globalResources([
    PLATFORM.moduleName("./elements/phd-table"),
    PLATFORM.moduleName("./elements/phd-search-bar"),
    PLATFORM.moduleName("./elements/phd-pager"),
    PLATFORM.moduleName("./elements/phd-page-size-select"),
    PLATFORM.moduleName("./elements/phd-tags-input"),
    PLATFORM.moduleName("./value-converters/phd-page-value-converter"),
    PLATFORM.moduleName("./value-converters/phd-sort-value-converter"),
    PLATFORM.moduleName("./attributes/enhance-html")
  ]);

  if (!options || !options.framework) {
    // TODO log
    LogManager.getLogger("aurelia-phd").error(
      "aurelia-phd: You must specify a framework to use: available frameworks are: " +
        `${Object.keys(framework)}`
    );
  } else {
    const original = ViewLocator.prototype.convertOriginToViewUrl;

    framework[options.framework]();

    ViewLocator.prototype.convertOriginToViewUrl = function(origin): string {
      const moduleId = origin.moduleId;
      LogManager.getLogger("aurelia-phd").info("Loading " + origin.moduleId);
      const namespace = /\/elements\/phd\-[a-z]+(\.(ts|js))?/;

      if (!origin.moduleId.match(namespace)) return original(origin);

      const id =
        moduleId.endsWith(".js") || moduleId.endsWith(".ts")
          ? moduleId.substring(0, moduleId.length - 3)
          : moduleId;

      const frameworkPath =
        id.substring(0, id.lastIndexOf("/")) +
        "/" +
        options.framework +
        id.substring(id.lastIndexOf("/"));

      return frameworkPath + ".html";
    };
  }
}
