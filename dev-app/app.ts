import { inject, PLATFORM } from "aurelia-framework";
import { Filter, Column, Header } from "resources";

type SearchFilters = import("resources").SearchFilters;
type FilterEventDetail = import("resources").FilterEventDetail;

const authors = ["John", "Ben", "Sam", "Tom", "Luke", "Ike", "Hayes", "Lee"];

@inject("defaultOptions")
export class App {
  allItems = [];
  rows = [];
  _filteredItems = [];
  _authors = authors;
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
        navbarModifiers: ["navbar-default"],
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

  _searchFilter: Filter[] = [
    {
      display: "Duration",
      values: ["65", "45"],
      fields: ["duration"]
    }
  ];
  _newSearchFilter: SearchFilters = {
    Id: {
      values: [],
      fields: ["id"]
    },
    Title: {
      values: [],
      fields: ["title"]
    },
    Duration: {
      values: ["65", "45"],
      fields: ["duration"]
    },
    ["% Complete"]: {
      values: [],
      fields: ["percentComplete"]
    },
    ["Effort Driven"]: {
      values: [],
      fields: ["effortDriven"]
    },
    Author: {
      values: [],
      fields: ["author", "firstName"]
    }
  };

  _itemColumns: Column[] = [
    {
      selection: true,
      renderer: ({ row }) => (row.selected ? "&#x2714;" : "")
    },
    {
      field: "id",
      header: "Id"
    },
    {
      field: "title",
      header: "Title"
    },
    {
      field: "duration",
      header: "Duration"
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
      field: "finish",
      header: "Finish"
    },
    {
      field: "effortDriven",
      header: "Effort Driven"
    },
    {
      field: ["author", "firstName"],
      header: "Author"
    }
  ];

  _tableOptions = {
    selection: {
      highlightOnSelect: true
    }
  };

  constructor(private _options) {
    this._resetFilter();
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

  _resetFilter(): void {
    this._searchFilter = this._itemColumns
      .filter(i => !i.selection)
      .map<Filter>(i => {
        const fields = Array.isArray(i.field) ? i.field : [i.field];
        const header: string =
          i.header && ((i.header as Header).name || (i.header as string));
        const display =
          header || (!Array.isArray(i.field) ? i.field : i.field[0]);

        return {
          fields,
          display,
          values: (
            (this._searchFilter.find(f => f.display === display) || {})
              .values || []
          ).filter(v => v)
        } as Filter;
      });

    this._newSearchFilter = {
      ...this._newSearchFilter
    };
  }

  _filterRows(detail: FilterEventDetail): void {
    this.rows = detail.filteredItems.map((item, idx) => ({
      item,
      selectable: idx % 3 === 0 ? true : false
    }));

    this._filteredItems = detail.filteredItems;

    this._searchFilter = detail.filter;
  }
}

export class NumberValueConverter {
  toView(value: number): string {
    return value === null || typeof value === "undefined"
      ? null
      : value.toString();
  }

  fromView(value: string): number {
    return value === "" ? null : Number(value);
  }
}

export class CsvValueConverter {
  toView(value): string {
    return !Array.isArray(value) ? "" : value.join(",");
  }

  fromView(value): string[] {
    return !value ? [] : value.split(",");
  }
}
