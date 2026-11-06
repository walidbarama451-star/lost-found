/**
 * Escapes user-provided strings before they are embedded in a regular
 * expression, preventing regex injection / catastrophic patterns.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
