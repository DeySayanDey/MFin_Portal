/**
 * Short-lived GET dedupe for client BFF calls.
 * Stops React Strict Mode double-mount from aborting/reissuing the same request.
 */

type StoreEntry<T> = {
  inflight: Promise<T> | null;
  cache: { at: number; value: T } | null;
};

const stores = new Map<string, StoreEntry<unknown>>();

export function dedupeRequest<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs = 5_000,
): Promise<T> {
  let entry = stores.get(key) as StoreEntry<T> | undefined;
  if (!entry) {
    entry = { inflight: null, cache: null };
    stores.set(key, entry as StoreEntry<unknown>);
  }

  if (entry.cache && Date.now() - entry.cache.at < ttlMs) {
    return Promise.resolve(entry.cache.value);
  }

  if (!entry.inflight) {
    entry.inflight = factory()
      .then((value) => {
        entry!.cache = { at: Date.now(), value };
        return value;
      })
      .finally(() => {
        entry!.inflight = null;
      });
  }

  return entry.inflight;
}

export function clearDedupe(key?: string): void {
  if (key) {
    stores.delete(key);
    return;
  }
  stores.clear();
}
