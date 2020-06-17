import { inject } from "aurelia-framework";
import { Filter, Column, Header } from "resources";
import { PLATFORM } from "aurelia-framework";

interface ExtendedColumn extends Column {
  [x: string]: any;
}

const authors = ["John", "Ben", "Sam", "Tom", "Luke", "Ike", "Hayes", "Lee"];

@inject("defaultOptions")
export class App {
  allItems = [];

  _currentFramework;
  _frameworks = {
    bulma: {
      navbar: {
        navbarModifiers: ["is-light"],
        brand: {
          url: "https://bulma.io",
          title: "Bulma PHD"
        },
        navigation: [
          {
            href: "?framework=bootstrap3",
            title: "Bootstrap3"
          }
        ]
      }
    },
    bootstrap3: {
      navbar: {
        navbarModifiers: ["navbar-default", "navbar-fixed-top"],
        brand: {
          url: "https://getbootstrap.com/docs/3.4/",
          title: "Bootstrap3 PHD"
        },
        navigation: [
          {
            href: "?framework=bulma",
            title: "Bulma"
          }
        ]
      }
    }
  };

  itemPage = {
    size: 10,
    pageNumber: 0
  };

  _searchFilter: Filter[];

  _itemColumns: ExtendedColumn[] = [
    {
      field: "id"
    },
    {
      field: "title"
    },
    {
      field: "duration",
      filter: [65]
    },
    {
      field: "percentComplete",
      header: "% Complete"
    },
    {
      field: "start",
      hidden: true,
      sort: {
        direction: "asc"
      }
    },
    {
      field: "finish"
    },
    {
      field: "effortDriven"
    },
    {
      field: ["author", "firstName"],
      header: "Author"
    }
  ];

  constructor(private _options) {
    this._searchFilter = this._itemColumns.map<Filter>(i => {
      const fields = Array.isArray(i.field) ? i.field : [i.field];
      const header = i.header && ((i.header as Header).name || i.header);

      return {
        fields,
        display: header || (!Array.isArray(i.field) ? i.field : i.field[0]),
        values: i.filter || []
      } as Filter;
    });
  }

  activate(): void {
    for (let i = 0; i < 500; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);
      const randomAuthor = Math.round(Math.random() * 6);

      this.allItems[i] = {
        id: i,
        title: "Task " + i,
        duration: Math.round(Math.random() * 100) + "",
        percentComplete: randomPercent,
        start: `${randomYear}-${randomMonth}-${randomDay}`,
        finish: `${randomYear}-${randomMonth}-${randomDay}`,
        effortDriven: i % 5 === 0,
        author: { firstName: authors[randomAuthor] }
      };
    }

    const params = new URL(PLATFORM.location.href).searchParams;
    const framework = params.get("framework");

    this._currentFramework = this._frameworks[
      framework || this._options.framework
    ];
  }

  getViewStrategy(): string {
    return "./" + this._options.framework + ".html";
  }
}
