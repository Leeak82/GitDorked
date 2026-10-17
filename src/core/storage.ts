import type { PersistedState } from './domain';

export interface LocalStore<T> {
  load(): Promise<T>;
  save(value: T): Promise<void>;
  clear(): Promise<void>;
}

export const defaultPersistedState: PersistedState = {
  favoriteToolIds: [],
  recentInterpolations: [],
  recentRepos: []
};

export class MemoryStore<T> implements LocalStore<T> {
  private readonly initialValue: T;
  private value: T;

  constructor(initialValue: T) {
    this.initialValue = clone(initialValue);
    this.value = clone(initialValue);
  }

  async load(): Promise<T> {
    return clone(this.value);
  }

  async save(value: T): Promise<void> {
    this.value = clone(value);
  }

  async clear(): Promise<void> {
    this.value = clone(this.initialValue);
  }
}

export class BrowserLocalStore<T> implements LocalStore<T> {
  constructor(
    private readonly storageKey: string,
    private readonly fallback: T,
    private readonly storage: Storage | undefined = getDefaultStorage()
  ) {}

  async load(): Promise<T> {
    if (!this.storage) {
      return clone(this.fallback);
    }

    const storedValue = this.storage.getItem(this.storageKey);
    if (!storedValue) {
      return clone(this.fallback);
    }

    try {
      return { ...clone(this.fallback), ...JSON.parse(storedValue) };
    } catch {
      return clone(this.fallback);
    }
  }

  async save(value: T): Promise<void> {
    if (!this.storage) {
      return;
    }

    this.storage.setItem(this.storageKey, JSON.stringify(value));
  }

  async clear(): Promise<void> {
    this.storage?.removeItem(this.storageKey);
  }
}

function getDefaultStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
