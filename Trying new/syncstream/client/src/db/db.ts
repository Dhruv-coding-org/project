/**
 * db.ts — Client-side Zero-Latency IndexedDB Store & Starred Library Manager
 *
 * Stores user profiles, starred videos, theme preferences, and watch party history
 * persistently in the browser's native IndexedDB store.
 */

export interface UserProfileDB {
  id: string; // 'default'
  username: string;
  avatar: string;
  bio?: string;
  statusMessage?: string;
  theme?: 'dark-void' | 'cyber-neon' | 'midnight-minimal';
  updatedAt: number;
}

export interface StarredVideoDB {
  id: string; // unique ID or hash
  title: string;
  url: string;
  sourceType: 'url' | 'file';
  thumbnail?: string;
  dateStarred: number;
}

export interface WatchHistoryDB {
  id: string;
  roomCode: string;
  videoTitle: string;
  duration: number;
  dateWatched: number;
}

const DB_NAME = 'SyncStreamDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('[SyncStreamDB] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('starredVideos')) {
        db.createObjectStore('starredVideos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('watchHistory')) {
        db.createObjectStore('watchHistory', { keyPath: 'id' });
      }
    };
  });
}

/* ── Profile Operations ───────────────────────────────────────── */
export async function getProfileDB(): Promise<UserProfileDB | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const request = store.get('default');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveProfileDB(profile: Partial<UserProfileDB>): Promise<void> {
  try {
    const db = await openDB();
    const existing = await getProfileDB();
    const updated: UserProfileDB = {
      id: 'default',
      username: profile.username || existing?.username || 'Watcher',
      avatar: profile.avatar || existing?.avatar || '🍿',
      bio: profile.bio || existing?.bio || 'Lover of movies & watch parties!',
      statusMessage: profile.statusMessage || existing?.statusMessage || 'Ready to stream',
      theme: profile.theme || existing?.theme || 'dark-void',
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('profiles', 'readwrite');
      const store = tx.objectStore('profiles');
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[SyncStreamDB] Could not save profile to IndexedDB:', err);
  }
}

/* ── Starred Videos Operations ────────────────────────────────── */
export async function getStarredVideosDB(): Promise<StarredVideoDB[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('starredVideos', 'readonly');
      const store = tx.objectStore('starredVideos');
      const request = store.getAll();
      request.onsuccess = () => {
        const results: StarredVideoDB[] = request.result || [];
        resolve(results.sort((a, b) => b.dateStarred - a.dateStarred));
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function starVideoDB(video: { title: string; url: string; sourceType: 'url' | 'file'; thumbnail?: string }): Promise<StarredVideoDB> {
  const db = await openDB();
  const id = `star-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item: StarredVideoDB = {
    id,
    title: video.title || video.url,
    url: video.url,
    sourceType: video.sourceType,
    thumbnail: video.thumbnail,
    dateStarred: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('starredVideos', 'readwrite');
    const store = tx.objectStore('starredVideos');
    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function unstarVideoDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('starredVideos', 'readwrite');
      const store = tx.objectStore('starredVideos');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[SyncStreamDB] Error unstarring video:', err);
  }
}
