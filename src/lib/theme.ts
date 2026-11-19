import type { Theme } from './storage';

/** Apply a theme preference. 'system' removes the override so the media query decides. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}
