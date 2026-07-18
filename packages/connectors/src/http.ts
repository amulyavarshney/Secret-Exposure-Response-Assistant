export type FetchFn = typeof fetch;

let fetchImpl: FetchFn = globalThis.fetch.bind(globalThis);

export function getFetch(): FetchFn {
  return fetchImpl;
}

/** Test hook — restore with `resetFetch()` after each test. */
export function setFetch(fn: FetchFn): void {
  fetchImpl = fn;
}

export function resetFetch(): void {
  fetchImpl = globalThis.fetch.bind(globalThis);
}
