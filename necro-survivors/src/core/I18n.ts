export type Lang = 'ko' | 'en';

const STORAGE_KEY = 'necro_survivors_lang';

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    // storage blocked
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language || '' : '').toLowerCase();
  return nav.startsWith('ko') ? 'ko' : 'en';
}

// Language is resolved once at load. Changing it reloads the page so that
// module-level data tables (skills, relics, ...) are rebuilt in the new language.
const currentLang: Lang = detectInitialLang();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

/** Switches language and reloads the page. */
export function toggleLang(): void {
  setLang(currentLang === 'ko' ? 'en' : 'ko');
  window.location.reload();
}

/** Returns the Korean or English text for the active language. */
export function t(ko: string, en: string): string {
  return currentLang === 'ko' ? ko : en;
}
