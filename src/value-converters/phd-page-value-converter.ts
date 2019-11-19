export class PhdPageValueConverter {
  toView<T>(value: T[], size: number, pageNumber: number): T[] {
    if (!value || !value.length) return value;

    const startPage = pageNumber * size;
    const endPage = startPage + size;

    return value.slice(
      isNaN(startPage) ? undefined : startPage,
      isNaN(endPage) ? undefined : endPage
    );
  }
}
