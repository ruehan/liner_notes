export function matchesText(
  fields: Array<string | undefined>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(
    (f) => typeof f === "string" && f.toLowerCase().includes(q),
  );
}

export function filterByQuery<T>(
  items: T[],
  query: string,
  fieldsOf: (item: T) => Array<string | undefined>,
): T[] {
  return items.filter((item) => matchesText(fieldsOf(item), query));
}
