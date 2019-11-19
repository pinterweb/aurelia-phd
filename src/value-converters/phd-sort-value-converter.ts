import { Sort, RowData } from "../model";
import { getIn } from "../utils";

export class PhdSortValueConverter {
  toView<T>(value: RowData<T>[], sorts: Sort[]): RowData<T>[] {
    if (!value || !value.length || !sorts || !sorts.length) return value;

    let sorted = value.slice(0);

    sorts
      .filter(s => s.direction)
      .sort((a, b) => a.order - b.order)
      .forEach(s => {
        const field: string[] = Array.isArray(s.field) ? s.field : [s.field];

        sorted = sorted.sort((a, b) => {
          const isDesc = s.direction.toLowerCase() === "desc";
          const factor = isDesc ? -1 : 1;
          const itemA = a.item;
          const itemB = b.item;

          if (s.compare) {
            return factor * s.compare({ a: itemA, b: itemB });
          }

          const aValue = getIn(itemA, field);
          const bValue = getIn(itemB, field);

          if (aValue === null) return factor * -1;
          if (bValue === null) return factor * 1;

          if (aValue > bValue) {
            return factor * 1;
          } else if (aValue < bValue) {
            return factor * -1;
          } else {
            return 0;
          }
        });
      });

    return sorted;
  }
}
