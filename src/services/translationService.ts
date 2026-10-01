// Translation and Regional Language Auto-Detection Service for ECONEST BANK

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  popular?: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', popular: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', popular: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', popular: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', popular: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', popular: true },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', popular: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', popular: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', popular: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', popular: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', popular: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'iw', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
];

export interface DetectedRegionInfo {
  langCode: string;
  langName: string;
  nativeName: string;
  flag: string;
  regionDescription: string;
  isAutoDetected: boolean;
  confidence: 'high' | 'medium' | 'default';
}

const STORAGE_KEY = 'econest_user_lang_pref';
const NOTIFICATION_SHOWN_KEY = 'econest_autotranslate_notified';

// Timezone to primary regional language map
const TIMEZONE_LANG_MAP: Record<string, string> = {
  // Spanish speaking regions
  'europe/madrid': 'es',
  'america/mexico_city': 'es',
  'america/cancun': 'es',
  'america/merida': 'es',
  'america/monterrey': 'es',
  'america/tijuana': 'es',
  'america/bogota': 'es',
  'america/buenos_aires': 'es',
  'america/cordoba': 'es',
  'america/santiago': 'es',
  'america/lima': 'es',
  'america/caracas': 'es',
  'america/guayaquil': 'es',
  'america/asuncion': 'es',
  'america/montevideo': 'es',
  'america/la_paz': 'es',
  'america/costa_rica': 'es',
  'america/guatemala': 'es',
  'america/panama': 'es',
  'america/el_salvador': 'es',
  'america/tegucigalpa': 'es',
  'america/managua': 'es',
  'america/santo_domingo': 'es',
  'america/havana': 'es',

  // French speaking regions
  'europe/paris': 'fr',
  'europe/brussels': 'fr',
  'america/montreal': 'fr',
  'africa/casablanca': 'fr',
  'africa/algiers': 'fr',
  'africa/tunis': 'fr',
  'africa/dakar': 'fr',
  'africa/abidjan': 'fr',

  // German speaking regions
  'europe/berlin': 'de',
  'europe/vienna': 'de',
  'europe/zurich': 'de',

  // Portuguese speaking regions
  'america/sao_paulo': 'pt',
  'america/recife': 'pt',
  'america/fortaleza': 'pt',
  'america/belem': 'pt',
  'america/manaus': 'pt',
  'europe/lisbon': 'pt',

  // Italian
  'europe/rome': 'it',

  // Asian languages
  'asia/tokyo': 'ja',
  'asia/seoul': 'ko',
  'asia/shanghai': 'zh-CN',
  'asia/chongqing': 'zh-CN',
  'asia/urumqi': 'zh-CN',
  'asia/taipei': 'zh-TW',
  'asia/hong_kong': 'zh-TW',
  'asia/kolkata': 'hi',
  'asia/calcutta': 'hi',
  'asia/jakarta': 'id',
  'asia/makassar': 'id',
  'asia/bangkok': 'th',
  'asia/ho_chi_minh': 'vi',
  'asia/manila': 'tl',
  'asia/kuala_lumpur': 'ms',

  // Middle East / Arabic
  'asia/riyadh': 'ar',
  'asia/dubai': 'ar',
  'africa/cairo': 'ar',
  'asia/kuwait': 'ar',
  'asia/qatar': 'ar',
  'asia/baghdad': 'ar',
  'asia/amman': 'ar',
  'asia/beirut': 'ar',
  'asia/muscat': 'ar',
  'asia/bahrain': 'ar',

  // Eastern & Northern Europe
  'europe/moscow': 'ru',
  'europe/istanbul': 'tr',
  'europe/amsterdam': 'nl',
  'europe/warsaw': 'pl',
  'europe/kyiv': 'uk',
  'europe/athens': 'el',
  'europe/stockholm': 'sv',
  'europe/oslo': 'no',
  'europe/copenhagen': 'da',
  'europe/helsinki': 'fi',
  'europe/prague': 'cs',
  'europe/budapest': 'hu',
  'europe/bucharest': 'ro',
  'asia/jerusalem': 'iw',
};

// Normalize language code to supported set
export const normalizeLangCode = (rawCode: string): string => {
  if (!rawCode) return 'en';
  const clean = rawCode.trim().toLowerCase();

  // Exact matching for Chinese variants
  if (clean.startsWith('zh-tw') || clean.startsWith('zh-hant') || clean.startsWith('zh-hk')) {
    return 'zh-TW';
  }
  if (clean.startsWith('zh-cn') || clean.startsWith('zh-hans') || clean === 'zh') {
    return 'zh-CN';
  }

  // Tagalog / Filipino
  if (clean.startsWith('fil') || clean.startsWith('tl')) {
    return 'tl';
  }

  // Hebrew
  if (clean.startsWith('he') || clean.startsWith('iw')) {
    return 'iw';
  }

  // Extract 2-letter base
  const base = clean.split('-')[0];
  const matched = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === base);
  return matched ? matched.code : (clean === 'en' ? 'en' : base);
};

// Detect visitor's language based on browser, device locale and country/timezone
export const detectUserLanguageAndRegion = (): DetectedRegionInfo => {
  // 1. Check if user already manually selected a preference
  const savedPref = localStorage.getItem(STORAGE_KEY);
  if (savedPref) {
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === savedPref) || {
      code: savedPref,
      name: savedPref.toUpperCase(),
      nativeName: savedPref.toUpperCase(),
      flag: '🌐'
    };
    return {
      langCode: langObj.code,
      langName: langObj.name,
      nativeName: langObj.nativeName,
      flag: langObj.flag,
      regionDescription: 'Saved preference',
      isAutoDetected: false,
      confidence: 'high'
    };
  }

  // 2. Check browser navigator languages array (in order of user preference)
  let detectedCode = 'en';
  let regionDesc = 'Standard';
  let confidence: 'high' | 'medium' | 'default' = 'default';

  const browserLangs = typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : (typeof navigator !== 'undefined' && navigator.language ? [navigator.language] : []);

  if (browserLangs.length > 0) {
    const primary = browserLangs[0];
    const normalized = normalizeLangCode(primary);
    if (normalized && normalized !== 'en') {
      detectedCode = normalized;
      regionDesc = `Browser (${primary})`;
      confidence = 'high';
    }
  }

  // 3. Fallback or cross-reference with Timezone if browser language was generic or default
  if (detectedCode === 'en') {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() || '';
      if (tz && TIMEZONE_LANG_MAP[tz]) {
        detectedCode = TIMEZONE_LANG_MAP[tz];
        regionDesc = `Region (${tz.split('/')[1] || tz})`;
        confidence = 'medium';
      }
    } catch (e) {
      // Ignore Intl errors
    }
  }

  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === detectedCode) || {
    code: detectedCode,
    name: detectedCode.toUpperCase(),
    nativeName: detectedCode.toUpperCase(),
    flag: '🌐'
  };

  return {
    langCode: langObj.code,
    langName: langObj.name,
    nativeName: langObj.nativeName,
    flag: langObj.flag,
    regionDescription: regionDesc,
    isAutoDetected: detectedCode !== 'en',
    confidence
  };
};

// Set googtrans cookie across root and host domains so Google Translate activates immediately
export const setGoogleTranslateCookie = (langCode: string): void => {
  if (!langCode || langCode === 'en') {
    // Clear cookies
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      const parts = window.location.hostname.split('.');
      if (parts.length > 2) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${parts.slice(-2).join('.')};`;
      }
    }
    return;
  }

  const val = `/auto/${langCode}`;
  document.cookie = `googtrans=${val}; path=/;`;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    document.cookie = `googtrans=${val}; path=/; domain=${window.location.hostname};`;
    const parts = window.location.hostname.split('.');
    if (parts.length > 2) {
      document.cookie = `googtrans=${val}; path=/; domain=.${parts.slice(-2).join('.')};`;
    }
  }
};

// Read currently active googtrans cookie if any
export const getGoogleTranslateCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return null;
  const parts = decodeURIComponent(match[1]).split('/');
  return parts[parts.length - 1] || null;
};

// Trigger the internal Google Translate combo element if already loaded in the DOM
export const triggerGoogleTranslateCombo = (langCode: string): boolean => {
  if (typeof document === 'undefined') return false;
  const select = document.querySelector('select.goog-te-combo') as HTMLSelectElement | null;
  if (!select) return false;

  const targetVal = langCode === 'en' ? '' : langCode;
  if (select.value !== targetVal) {
    select.value = targetVal;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return true;
};

// Apply language change across the system
export const applyLanguage = (langCode: string, isUserAction = false): void => {
  if (isUserAction) {
    localStorage.setItem(STORAGE_KEY, langCode);
  }

  setGoogleTranslateCookie(langCode);

  const appliedImmediately = triggerGoogleTranslateCombo(langCode);

  // Dispatch custom event for UI components to synchronize state instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('econest_language_changed', {
        detail: { langCode, isUserAction }
      })
    );
  }

  // If reverting to English from a translated page, reload might be needed to restore original text nodes
  if (langCode === 'en' && isUserAction && !appliedImmediately) {
    setTimeout(() => {
      window.location.reload();
    }, 150);
  }
};

// Check if user has already been notified about auto-translation
export const hasBeenAutoNotified = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(NOTIFICATION_SHOWN_KEY) === 'true';
};

export const markAutoNotified = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NOTIFICATION_SHOWN_KEY, 'true');
};
