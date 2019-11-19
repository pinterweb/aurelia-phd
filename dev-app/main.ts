import { Aurelia } from "aurelia-framework";
import environment from "./environment";

export function configure(aurelia: Aurelia): void {
  const options = {
    framework:
      new URL(document.location.href).searchParams.get("framework") ?? "bulma"
  };

  aurelia.container.registerInstance("defaultOptions", options);

  aurelia.use
    .standardConfiguration()
    // load the plugin ../src
    // The "resources" is mapped to "../src" in aurelia.json "paths"
    .feature("resources", options);

  aurelia.use.developmentLogging(environment.debug ? "debug" : "warn");

  if (environment.testing) {
    aurelia.use.plugin("aurelia-testing");
  }

  aurelia.start().then(() => aurelia.setRoot());
}
