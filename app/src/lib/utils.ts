export function cn(...values: unknown[]) {
  return values.filter((value) => typeof value === 'string' && value.length > 0).join(' ');
}
