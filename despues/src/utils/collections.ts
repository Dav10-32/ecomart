export function groupBy<T>(items: readonly T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const item of items) (out[key(item)] ??= []).push(item)
  return out
}
