// ── Level & XP ────────────────────────────────────────────────
export function calculateLevel(xp) {
  let level = 1;
  while (level < 100 && xp >= 100 * level * level) {
    level++;
  }
  return level;
}

export function getXPForLevel(level) {
  return 100 * level * level;
}

export function getXPProgress(xp) {
  const level = calculateLevel(xp);
  const currentLevelXP = getXPForLevel(level - 1);
  const nextLevelXP = getXPForLevel(level);
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return { level, progress: Math.min(100, Math.max(0, progress)), currentLevelXP, nextLevelXP };
}

// ── Ranks ─────────────────────────────────────────────────────
export function getRank(level) {
  if (level <= 20) return 'Bronze';
  if (level <= 40) return 'Silver';
  if (level <= 60) return 'Gold';
  if (level <= 80) return 'Platinum';
  return 'Diamond';
}

export function getRankColor(rank) {
  const colors = {
    Bronze: { text: '#CD7F32', bg: 'rgba(205,127,50,0.15)', border: 'rgba(205,127,50,0.3)' },
    Silver: { text: '#A8A9AD', bg: 'rgba(168,169,173,0.15)', border: 'rgba(168,169,173,0.3)' },
    Gold: { text: '#D4AF37', bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.3)' },
    Platinum: { text: '#8EADBF', bg: 'rgba(142,173,191,0.15)', border: 'rgba(142,173,191,0.3)' },
    Diamond: { text: '#6DB3CC', bg: 'rgba(109,179,204,0.15)', border: 'rgba(109,179,204,0.3)' },
  };
  return colors[rank] || colors.Bronze;
}

export function getRankEmoji(rank) {
  const emojis = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎',
    Diamond: '👑',
  };
  return emojis[rank] || '🥉';
}

// ── Date & Time ───────────────────────────────────────────────
export function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Score Colors ──────────────────────────────────────────────
export function getScoreColor(score) {
  if (score >= 85) return { text: '#3A7A56', bg: 'rgba(168,216,185,0.3)', label: 'Excellent' };
  if (score >= 70) return { text: '#6B8FAF', bg: 'rgba(168,197,218,0.3)', label: 'Good' };
  if (score >= 50) return { text: '#8B5E1A', bg: 'rgba(245,201,160,0.3)', label: 'Average' };
  return { text: '#8B2A4A', bg: 'rgba(240,184,200,0.3)', label: 'Needs Improvement' };
}

export function getPerformanceLabel(score) {
  if (score >= 85) return { label: 'Excellent!', emoji: '🌟', color: '#3A7A56' };
  if (score >= 70) return { label: 'Good Job!', emoji: '👍', color: '#6B8FAF' };
  if (score >= 50) return { label: 'Average', emoji: '📈', color: '#8B5E1A' };
  return { label: 'Keep Practicing', emoji: '💪', color: '#8B2A4A' };
}

// ── Utilities ─────────────────────────────────────────────────
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ── Avatar colors by name ──────────────────────────────────────
export function getAvatarColor(name) {
  const colors = [
    { bg: '#8FAF8F', text: 'white' },
    { bg: '#A8C5DA', text: 'white' },
    { bg: '#F0B8C8', text: 'white' },
    { bg: '#F5C9A0', text: '#3D3530' },
    { bg: '#C4B5D4', text: 'white' },
    { bg: '#A8D8B9', text: '#3D3530' },
  ];
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
}

// ── Category colors ───────────────────────────────────────────
export const CATEGORY_COLORS = {
  Quantitative: { bg: 'rgba(245,201,160,0.3)', border: '#F5C9A0', text: '#8B5E1A', icon: '🔢' },
  Logical: { bg: 'rgba(168,197,218,0.3)', border: '#A8C5DA', text: '#3A5A7A', icon: '🧩' },
  Verbal: { bg: 'rgba(168,216,185,0.3)', border: '#A8D8B9', text: '#3A7A56', icon: '📝' },
  DSA: { bg: 'rgba(196,181,212,0.3)', border: '#C4B5D4', text: '#5A3A7A', icon: '🌳' },
  'Web Development': { bg: 'rgba(168,197,218,0.3)', border: '#A8C5DA', text: '#3A5A7A', icon: '🌐' },
  Database: { bg: 'rgba(240,184,200,0.3)', border: '#F0B8C8', text: '#7A3A5A', icon: '🗄️' },
  OOP: { bg: 'rgba(143,175,143,0.3)', border: '#8FAF8F', text: '#3A5A3A', icon: '🏗️' },
  'Operating System': { bg: 'rgba(245,201,160,0.3)', border: '#F5C9A0', text: '#8B5E1A', icon: '💻' },
  Networks: { bg: 'rgba(168,216,185,0.3)', border: '#A8D8B9', text: '#3A7A56', icon: '🔗' },
};
