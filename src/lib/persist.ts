/**
 * Tiny, safe localStorage helpers for persisting user settings.
 * All access is guarded so SSR / disabled-storage / quota errors never throw.
 */

const PREFIX = 'airdeck:';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/**
 * Merge a stored partial object over defaults, keeping only keys that exist in
 * `defaults` (so removing a setting later can't inject stale/unknown keys).
 */
export function mergeStored<T extends object>(
  defaults: T,
  stored: Partial<T> | null | undefined,
): T {
  if (!stored || typeof stored !== 'object') return { ...defaults };
  const out = { ...defaults };
  for (const k of Object.keys(defaults) as (keyof T)[]) {
    const v = (stored as Partial<T>)[k];
    if (v !== undefined) {
      out[k] = v as T[keyof T];
    }
  }
  return out;
}
