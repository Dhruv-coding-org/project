export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  unlockedLevelId: number;
  completedLevelIds: number[];
  title: string;
  createdAt: string;
  theme?: 'default' | 'cyberpunk' | 'github' | 'retro' | 'pastel';
  unlockedThemes?: string[];
  xp?: number;
  level?: number;
  badges?: string[];
}

export interface BadgeInfo {
  id: string;
  title: string;
  icon: string;
  description: string;
  xpReward: number;
}

export const BADGE_REGISTRY: BadgeInfo[] = [
  { id: 'time_traveler', title: 'Time Traveler', icon: '⏳', description: 'Used git reflog / HEAD@{n} to restore state', xpReward: 100 },
  { id: 'rebase_surgeon', title: 'Rebase Surgeon', icon: '🎛️', description: 'Executed an interactive rebase (git rebase -i)', xpReward: 150 },
  { id: 'bug_hunter', title: 'Bug Hunter', icon: '🐛', description: 'Isolated a culprit commit using git bisect', xpReward: 150 },
  { id: 'clean_coder', title: 'Clean Coder', icon: '⚡', description: 'Completed a level cleanly without errors', xpReward: 100 },
  { id: 'boss_slayer', title: 'Boss Slayer', icon: '🐉', description: 'Conquered a high-stakes Boss Battle arena', xpReward: 300 },
  { id: 'level_creator', title: 'Architect', icon: '🏗️', description: 'Created and shared a Custom Challenge', xpReward: 200 },
  { id: 'grandmaster', title: 'Git Grandmaster', icon: '👑', description: 'Completed all 15 master campaign levels', xpReward: 500 },
  { id: 'pr_reviewer', title: 'PR Reviewer', icon: '🔄', description: 'Created and merged a Pull Request', xpReward: 150 },
  { id: 'squash_master', title: 'Squash Master', icon: '🍱', description: 'Executed a Squash and Merge on a feature branch', xpReward: 150 },
  { id: 'cicd_engineer', title: 'CI/CD Engineer', icon: '⚙️', description: 'Diagnosed and fixed a broken CI/CD automated test pipeline', xpReward: 250 },
  { id: 'ai_collaborator', title: 'Team Collaborator', icon: '🤖', description: 'Received an approved AI team code review', xpReward: 150 },
  { id: 'audio_audiophile', title: 'Sound Sculptor', icon: '🎵', description: 'Customized synthesizer audio settings & SFX themes', xpReward: 100 },
  { id: 'team_collaborator_live', title: 'Sync Master', icon: '🌐', description: 'Reconciled diverged remote team branch commits using pull --rebase', xpReward: 200 },
  { id: 'encyclopedia_scholar', title: 'Git Scholar', icon: '📖', description: 'Explored and tested interactive cheat-sheet commands', xpReward: 100 },
];

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
    theme: 'default',
    unlockedThemes: ['default', 'cyberpunk', 'github', 'retro', 'pastel'],
    xp: 0,
    level: 1,
    badges: [],
  },
  {
    id: 'default-ninja',
    name: 'Alex Ninja',
    avatar: '🦊',
    unlockedLevelId: 4,
    completedLevelIds: [1, 2, 3],
    title: 'Branch Adventurer 🌿',
    createdAt: new Date().toLocaleDateString(),
    theme: 'cyberpunk',
    unlockedThemes: ['default', 'cyberpunk', 'github', 'retro', 'pastel'],
    xp: 300,
    level: 2,
    badges: ['clean_coder'],
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
    xp: 0,
    level: 1,
    badges: [],
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
  const isNew = !current.completedLevelIds.includes(levelId);
  const newCompleted = Array.from(new Set([...current.completedLevelIds, levelId])).sort((a, b) => a - b);
  const nextUnlock = Math.min(totalLevels, Math.max(current.unlockedLevelId, levelId + 1));
  const newTitle = getRankTitle(newCompleted.length);

  const currentXp = current.xp || 0;
  const newXp = isNew ? currentXp + 100 : currentXp;
  const newLevel = Math.floor(newXp / 200) + 1;

  const currentBadges = current.badges || [];
  const newBadges = [...currentBadges];
  if (newCompleted.length >= 15 && !newBadges.includes('grandmaster')) {
    newBadges.push('grandmaster');
  }

  const updatedProfile: UserProfile = {
    ...current,
    completedLevelIds: newCompleted,
    unlockedLevelId: nextUnlock,
    title: newTitle,
    xp: newXp,
    level: newLevel,
    badges: newBadges,
  };

  profiles[index] = updatedProfile;
  saveProfiles(profiles);
  return updatedProfile;
}

export function updateProfileTheme(theme: 'default' | 'cyberpunk' | 'github' | 'retro' | 'pastel'): UserProfile {
  const profiles = getProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY) || profiles[0]?.id;
  const index = profiles.findIndex((p) => p.id === activeId);
  if (index === -1) return profiles[0];

  const current = profiles[index];
  const updatedProfile: UserProfile = {
    ...current,
    theme,
  };

  profiles[index] = updatedProfile;
  saveProfiles(profiles);
  return updatedProfile;
}

export function awardXpForActiveProfile(amount: number): { profile: UserProfile; leveledUp: boolean } {
  const profiles = getProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY) || profiles[0]?.id;
  const index = profiles.findIndex((p) => p.id === activeId);
  if (index === -1) return { profile: profiles[0], leveledUp: false };

  const current = profiles[index];
  const oldLevel = current.level || 1;
  const newXp = (current.xp || 0) + amount;
  const newLevel = Math.floor(newXp / 200) + 1;
  const leveledUp = newLevel > oldLevel;

  const updatedProfile: UserProfile = {
    ...current,
    xp: newXp,
    level: newLevel,
  };

  profiles[index] = updatedProfile;
  saveProfiles(profiles);
  return { profile: updatedProfile, leveledUp };
}

export function unlockBadgeForActiveProfile(badgeId: string): { profile: UserProfile; newlyUnlocked: boolean; badge?: BadgeInfo } {
  const badge = BADGE_REGISTRY.find((b) => b.id === badgeId);
  if (!badge) return { profile: getActiveProfile(), newlyUnlocked: false };

  const profiles = getProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY) || profiles[0]?.id;
  const index = profiles.findIndex((p) => p.id === activeId);
  if (index === -1) return { profile: profiles[0], newlyUnlocked: false };

  const current = profiles[index];
  const currentBadges = current.badges || [];
  if (currentBadges.includes(badgeId)) {
    return { profile: current, newlyUnlocked: false, badge };
  }

  const newBadges = [...currentBadges, badgeId];
  const newXp = (current.xp || 0) + badge.xpReward;
  const newLevel = Math.floor(newXp / 200) + 1;

  const updatedProfile: UserProfile = {
    ...current,
    badges: newBadges,
    xp: newXp,
    level: newLevel,
  };

  profiles[index] = updatedProfile;
  saveProfiles(profiles);
  return { profile: updatedProfile, newlyUnlocked: true, badge };
}
