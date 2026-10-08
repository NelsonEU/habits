/** Moves `id` one place up (-1) or down (+1) in `ids`. Unchanged at either end, or if `id` isn't there. */
export function moveInOrder(ids: readonly number[], id: number, step: -1 | 1): number[] {
  const from = ids.indexOf(id);
  const to = from + step;
  if (from === -1 || to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
