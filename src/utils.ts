export function toCamelCase(str: string): string {
  if (!str) return "";

  return str.replace(/(?:^\w|[A-Z]|\b\w|[\s+\-_\/])/g, function(match, index) {
    //remove white space or hypens or underscores
    if (/[\s+\-_\/]/.test(match)) return "";
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function toTitleCase(str: string): string {
  if (!str) return "";

  const camelSpace = toCamelCase(str).replace(/([A-Z])/g, " $1");

  return camelSpace.charAt(0).toUpperCase() + camelSpace.slice(1);
}

export function getIn<TReturn>(
  /* eslint-disable @typescript-eslint/no-explicit-any */
  v: { [key: string]: any } | undefined,
  /* eslint-enable @typescript-eslint/no-explicit-any */
  fields: (string | number)[]
): TReturn | undefined {
  if (!v) {
    return undefined;
  }
  const [firstElem, ...restElems] = fields;
  if (undefined === v[firstElem]) {
    return undefined;
  }
  if (restElems.length === 0) {
    return v[firstElem];
  }
  return getIn(v[firstElem], restElems);
}
