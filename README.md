# `aurelia-phd`

> A plugin that allows you to choose a supported CSS framework for your aurelia app.

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

**This project is an experiment, in its infancy and is not ready for production yet...**

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli).
For a full length tutorial, visit [Aurelia plugin guide](https://aurelia.io/docs/plugins/write-new-plugin).

Inspired by [aurelia-forms](https://github.com/SpoonX/aurelia-form), which seems dead,
trying to refactor applications off bootstrap 3 and a general interest to reduce application setup time

- [Installation](#installation)
- [Supported Frameworks](#supported-frameworks)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [Building the Plugin](#building-the-plugin)
- [Running the tests](#running-the-tests)
- [Running the examples](#running-the-examples)

## Installation

**Not available via NPM. If you are interested, install it with the github link**

```
$ npm i -S pinterweb/aurelia-phd
```

## Supported Frameworks

1. Bulma
2. Bootstrap3

..More to come

## Usage

Set the framework in your `main.ts` then use one of the custom elements in your view models. For a full list
of elements see the src/elements folder.

```javascript
import { PLATFORM } from "aurelia-framework";

export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .plugin(PLATFORM.moduleName("aurelia-phd"), { framework: "bulma" });

  // other code ...

  return aurelia
    .start()
    .then(() => aurelia.setRoot(PLATFORM.moduleName("app")));
}
```

**Table Example**

_For the full table api see src/models.ts. Note: nested tables are supported_

_app.ts_

```typescript
type Column = import("aurelia-phd").Column;
type Page = import("aurelia-phd").Page;

export class App {
  _page: Page = {
    size: 10,
    pageNumber: 0
  };

  _columns: Column[] = [];
  _data = []; // fill your data

  constructor() {
    this._columns = [
      {
        // custom elements supported
        renderer: () =>
          '<a style="color:#000000" route-href="route: project; params.bind: { projectId: row.item.projectId }"><i class="fa fa-edit pointer"></i></a>'
      },
      {
        field: "projectId",
        header: "#"
      },
      {
        field: "task"
      }
    ];
  }
}
```

_app.html_

```html
<template>
  <phd-search-bar
    items.bind="_data"
    filtered.delegate="_filteredItems=$event.detail.filteredItems"
  ></phd-search-bar
  ><br />
  <phd-table
    items.bind="_filteredItems"
    page.bind="_page"
    columns.bind="_columns"
  >
  </phd-table>
  <phd-pager
    items.bind="_filteredItems"
    size.bind="_page.size"
    page-number.bind="_page.pageNumber"
    page-changed.delegate="_page.pageNumber=$event.detail.pageNumber"
  ></phd-pager>
</template>
```

## Dependencies

- [aurelia-framework](https://github.com/aurelia/framework)

## Building the Plugin

To build the plugin, follow these steps.

1. From the project folder, execute the following command:

```shell
npm install && npm run build
```

This will transpile all files from `src/` folder to `dist/native-modules/` and `dist/commonjs/`.

Note all other files in `dev-app/` folder are for the dev app, they would not appear in the published npm package.

## Running the examples

Run `au run`, then open `http://localhost:9000`

To open browser automatically, do `au run --open` or `npm start -- --open`.

To change dev server port, do `au run --port 8888`.

To change dev server host, do `au run --host 127.0.0.1`

## Running the tests

Run `au test`, `au karma` or `npm t`

To run in watch mode, `au test --watch` or `au karma --watch`.
