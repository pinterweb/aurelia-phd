const path = require("path");
const project = require("./aurelia_project/aurelia.json");
const tsconfig = require("./tsconfig.json");
const karmaConfig = project.unitTestRunner;

let testSrc = [
  { pattern: karmaConfig.source, included: false },
  "test/aurelia-karma.js"
];

let output = project.platform.output;
let appSrc = project.build.bundles.map(x => path.join(output, x.name));
let entryIndex = appSrc.indexOf(
  path.join(output, project.build.loader.configTarget)
);
let entryBundle = appSrc.splice(entryIndex, 1)[0];
let sourceMaps = [{ pattern: "scripts/**/*.js.map", included: false }];
let files = [entryBundle]
  .concat(testSrc)
  .concat(appSrc)
  .concat(sourceMaps);

let compilerOptions = tsconfig.compilerOptions;
compilerOptions.inlineSourceMap = true;
compilerOptions.inlineSources = true;

module.exports = function(config) {
  config.set({
    basePath: "",
    frameworks: [project.testFramework.id],
    files: files,
    exclude: [],
    preprocessors: {
      [karmaConfig.source]: [project.transpiler.id],
      [appSrc]: ["sourcemap"]
    },
    typescriptPreprocessor: {
      typescript: require("typescript"),
      options: compilerOptions
    },
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    /*
     * start these browsers
     * available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
     */
    // browsers: [
    //   'Chrome',
    // ],
    /*
     * To run in non-headless mode:
     * 1. Comment the following lines
     * 2. Uncomment the above "browsers" setting
     */
    browsers: ["ChromeHeadless", "FirefoxHeadless"],
    customLaunchers: {
      ChromeHeadless: {
        base: "Chrome",
        flags: [
          "--no-sandbox",
          "--headless",
          "--disable-gpu",
          "--remote-debugging-port=9222"
        ]
      },
      FirefoxHeadless: {
        base: "Firefox",
        flags: ["-headless"]
      }
    },
    /** **************************************************************************** */

    /*
     * Continuous Integration mode
     * if true, Karma captures browsers, runs the tests and exits
     */
    singleRun: true,
    // client.args must be a array of string.
    // Leave 'aurelia-root', project.paths.root in this order so we can find
    // the root of the aurelia project.
    client: {
      args: ["aurelia-root", project.paths.root]
    }
  });
};
