export interface ThemeInfo {
  id: string;
  label: string;
  /** Three swatch colors shown in the picker. */
  swatches: [string, string, string];
}

export const THEMES: ThemeInfo[] = [
  { id: 'dreamy-lavender', label: 'Lavender dream', swatches: ['#7c6cf0', '#ffc8e1', '#b9e3ff'] },
  { id: 'dreamy-sunset', label: 'Sunset peach', swatches: ['#ff6f5e', '#ffb0c4', '#ffe08a'] },
  { id: 'dreamy-ocean', label: 'Ocean mint', swatches: ['#14a3a8', '#9ff0dc', '#b5d2ff'] },
  { id: 'brutal-banana', label: 'Banana & bubblegum', swatches: ['#ffe14d', '#ff5c8a', '#ff8a00'] },
  { id: 'brutal-mint', label: 'Mint & tomato', swatches: ['#7cf0c0', '#ff4d2e', '#1fbb7e'] },
  { id: 'brutal-blue', label: 'Electric blue & lime', swatches: ['#2b4cff', '#c6ff3d', '#9bb1ff'] },
  { id: 'classic', label: 'Classic green', swatches: ['#16a34a', '#dcfce7', '#17201a'] },
];

export const DEFAULT_THEME = 'dreamy-lavender';
const KEY = 'overlap:theme';

export function isTheme(id: string | null | undefined): id is string {
  return THEMES.some((t) => t.id === id);
}

export function getTheme(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (isTheme(saved)) return saved;
  } catch {
    // storage unavailable
  }
  return DEFAULT_THEME;
}

export function applyTheme(id: string, persist = true): void {
  document.documentElement.dataset.theme = id;
  if (!persist) return;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // storage unavailable
  }
}
