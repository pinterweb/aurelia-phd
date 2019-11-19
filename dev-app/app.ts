import { inject } from "aurelia-framework";

@inject("defaultOptions")
export class App {
  allItems = [];

  itemPage = {
    size: 10,
    pageNumber: 0
  };

  _itemColumns = [
    {
      field: "id"
    },
    {
      field: "title"
    },
    {
      field: "duration"
    },
    {
      field: "percentComplete"
    },
    {
      field: "start"
    },
    {
      field: "finish"
    },
    {
      field: "effortDriven"
    }
  ];

  constructor(private _options) {}

  activate(): void {
    for (let i = 0; i < 500; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      this.allItems[i] = {
        id: i,
        title: "Task " + i,
        duration: Math.round(Math.random() * 100) + "",
        percentComplete: randomPercent,
        start: `${randomYear}-${randomMonth}-${randomDay}`,
        finish: `${randomYear}-${randomMonth}-${randomDay}`,
        effortDriven: i % 5 === 0
      };
    }
  }

  changeFramework(framework: string): void {
    this._options.framework = framework;
    window.location.replace(
      window.location.origin + "?framework=" + encodeURIComponent(framework)
    );
  }

  getViewStrategy(): string {
    return "./" + this._options.framework + ".html";
  }
}
