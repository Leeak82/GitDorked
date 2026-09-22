import { describe, expect, it } from 'vitest';
import { BrowserLocalStore, defaultPersistedState, MemoryStore } from './storage';

function createStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key: string) => items.get(key) ?? null,
    key: (index: number) => Array.from(items.keys())[index] ?? null,
    removeItem: (key: string) => {
      items.delete(key);
    },
    setItem: (key: string, value: string) => {
      items.set(key, value);
    }
  };
}

describe('storage', () => {
  it('keeps memory store snapshots isolated and clearable', async () => {
    const store = new MemoryStore(defaultPersistedState);
    const loaded = await store.load();
    loaded.favoriteToolIds.push('changed-outside-store');

    expect(await store.load()).toEqual(defaultPersistedState);

    await store.save({ favoriteToolIds: ['tool-a'], recentInterpolations: [], recentRepos: [] });
    expect(await store.load()).toEqual({ favoriteToolIds: ['tool-a'], recentInterpolations: [], recentRepos: [] });

    await store.clear();
    expect(await store.load()).toEqual(defaultPersistedState);
  });

  it('round-trips favorites, output history, and repository history', async () => {
    const storage = createStorage();
    const store = new BrowserLocalStore('history-store', defaultPersistedState, storage);
    const state = {
      favoriteToolIds: ['tool-public-docs-domain'],
      recentInterpolations: [
        { toolEntryId: 'tool-public-docs-domain', values: { domain: 'example.com' }, output: 'site:example.com', createdAt: '2026-09-22T00:00:00.000Z' }
      ],
      recentRepos: [
        { owner: 'example', repo: 'repo', url: 'https://github.com/example/repo', createdAt: '2026-09-22T00:00:00.000Z' }
      ]
    };

    await store.save(state);
    expect(await store.load()).toEqual(state);
  });

  it('loads fallback state when browser storage is empty or malformed', async () => {
    const storage = createStorage();

    const store = new BrowserLocalStore('test-store', defaultPersistedState, storage);
    expect(await store.load()).toEqual(defaultPersistedState);

    storage.setItem('test-store', '{');
    expect(await store.load()).toEqual(defaultPersistedState);
  });
});
