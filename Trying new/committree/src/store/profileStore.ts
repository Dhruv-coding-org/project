export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  unlockedLevelId: number;
  completedLevelIds: number[];
  title: string;
  createdAt: string;
}

const PROFILES_KEY = 'committree_profiles_v1';
const ACTIVE_PROFILE_ID_KEY = 'committree_active_profile_id_v1';

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'default-student',
    name: 'Git Explorer',
    avatar: '👨‍💻',
    unlockedLevelId: 1,
    completedLevelIds: [],
    title: 'Novice Committer 🌱',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'default-ninja',
    name: 'Alex Ninja',
    avatar: '🦊',
    unlockedLevelId: 4,
    completedLevelIds: [1, 2, 3],
    title: 'Branch Adventurer 🌿',
    createdAt: new Date().toLocaleDateString(),
  },
];

export function getRankTitle(completedCount: number): string {
  if (completedCount >= 15) return 'Git Grandmaster 👑';
  if (completedCount >= 12) return 'Rebase Architect 🏛️';
  if (completedCount >= 9) return 'Merge Maestro 🔀';
  if (completedCount >= 6) return 'History Manipulator ⚡';
  if (completedCount >= 3) return 'Branch Adventurer 🌿';
  if (completedCount >= 1) return 'Snapshot creator 📸';
  return 'Novice Committer 🌱';
}

export function getProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PROFILES;
  } catch (e) {
    console.error('Failed to load profiles from localStorage', e);
    return DEFAULT_PROFILES;
  }
}

export function saveProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage', e);
  }
}

export function getActiveProfile(): UserProfile {
  const profiles = getProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  if (activeId) {
    const found = profiles.find((p) => p.id === activeId);
    if (found) return found;
  }
  // Default to first profile
  localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profiles[0].id);
  return profiles[0];
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
}

export function createProfile(name: string, avatar: string): UserProfile {
  const profiles = getProfiles();
  const newProfile: UserProfile = {
    id: `user-${Date.now()}`,
    name: name.trim() || 'New Coder',
    avatar: avatar || '🚀',
    unlockedLevelId: 1,
    completedLevelIds: [],
    title: getRankTitle(0),
    createdAt: new Date().toLocaleDateString(),
  };
  const updated = [...profiles, newProfile];
  saveProfiles(updated);
  setActiveProfileId(newProfile.id);
  return newProfile;
}

export function deleteProfile(id: string): UserProfile[] {
  const profiles = getProfiles();
  if (profiles.length <= 1) {
    // Keep at least one profile
    return profiles;
  }
  const updated = profiles.filter((p) => p.id !== id);
  saveProfiles(updated);
  const currentActive = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  if (currentActive === id) {
    setActiveProfileId(updated[0].id);
  }
  return updated;
}

export function completeLevelForActiveProfile(levelId: number, totalLevels: number): UserProfile {
  const profiles = getProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY) || profiles[0]?.id;
  const index = profiles.findIndex((p) => p.id === activeId);
  if (index === -1) return profiles[0];

  const current = profiles[index];
  const newCompleted = Array.from(new Set([...current.completedLevelIds, levelId])).sort((a, b) => a - b);
  const nextUnlock = Math.min(totalLevels, Math.max(current.unlockedLevelId, levelId + 1));
  const newTitle = getRankTitle(newCompleted.length);

  const updatedProfile: UserProfile = {
    ...current,
    completedLevelIds: newCompleted,
    unlockedLevelId: nextUnlock,
    title: newTitle,
  };

  profiles[index] = updatedProfile;
  saveProfiles(profiles);
  return updatedProfile;
}
