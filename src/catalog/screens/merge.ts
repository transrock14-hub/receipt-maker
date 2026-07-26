import type { GenerateValues } from '../../types/receipt'

/** Merge screen defaults with live generate values (values win). */
export function vals(
  defaults: Partial<GenerateValues>,
  live: Partial<GenerateValues>,
): Partial<GenerateValues> {
  return { ...defaults, ...live }
}
