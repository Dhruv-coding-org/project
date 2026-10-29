import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DB_PATH, 'posts.json');
const SETTINGS_FILE = path.join(DB_PATH, 'settings.json');
const ACCOUNTS_FILE = path.join(DB_PATH, 'accounts.json');

function ensureDataDir() {
  if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });
}

function readJSON(filePath: string, defaultValue: any = []) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath: string, data: any) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export interface Post {
  id: string; title: string; description: string; hashtags: string;
  filePath: string; fileName: string; fileSize: number;
  platforms: string[]; status: 'scheduled' | 'uploading' | 'posted' | 'failed';
  scheduledAt: string; createdAt: string; postedAt?: string;
  youtubeUrl?: string; instagramUrl?: string; error?: string;
}

export interface AccountSettings {
  youtube: { connected: boolean; clientId: string; clientSecret: string; refreshToken: string; accessToken?: string; channelName?: string; };
  instagram: { connected: boolean; accessToken: string; userId: string; username?: string; appId?: string; appSecret?: string; };
}

export interface AppSettings {
  defaultTitle: string; defaultDescription: string; defaultHashtags: string;
  defaultPlatforms: string[]; uploadDir: string;
}

const DEFAULT_ACCOUNTS: AccountSettings = {
  youtube: { connected: false, clientId: '', clientSecret: '', refreshToken: '' },
  instagram: { connected: false, accessToken: '', userId: '' },
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultTitle: '', defaultDescription: '',
  defaultHashtags: '#shorts #reels #viral #trending',
  defaultPlatforms: ['youtube', 'instagram'],
  uploadDir: path.join(process.cwd(), 'uploads'),
};

export function getPosts(): Post[] { return readJSON(POSTS_FILE, []); }
export function getPost(id: string): Post | undefined { return getPosts().find(p => p.id === id); }
export function addPost(post: Post): Post { const posts = getPosts(); posts.push(post); writeJSON(POSTS_FILE, posts); return post; }
export function updatePost(id: string, updates: Partial<Post>): Post | null {
  const posts = getPosts(); const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return null; posts[idx] = { ...posts[idx], ...updates };
  writeJSON(POSTS_FILE, posts); return posts[idx];
}
export function deletePost(id: string): boolean {
  const posts = getPosts(); const filtered = posts.filter(p => p.id !== id);
  if (filtered.length === posts.length) return false;
  writeJSON(POSTS_FILE, filtered); return true;
}
export function getAccounts(): AccountSettings { return readJSON(ACCOUNTS_FILE, DEFAULT_ACCOUNTS); }
export function updateAccounts(updates: Partial<AccountSettings>): AccountSettings {
  const accounts = getAccounts(); const updated = { ...accounts, ...updates };
  writeJSON(ACCOUNTS_FILE, updated); return updated;
}
export function getSettings(): AppSettings { return readJSON(SETTINGS_FILE, DEFAULT_SETTINGS); }
export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const settings = getSettings(); const updated = { ...settings, ...updates };
  writeJSON(SETTINGS_FILE, updated); return updated;
}
