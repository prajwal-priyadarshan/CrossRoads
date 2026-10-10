const MAX_ENTRIES = 500;
const store = new Map<string, { at: number; value: unknown }>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
  return fn().then((value) => {
    if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value!);
    store.set(key, { at: Date.now(), value });
    return value;
  });
}
