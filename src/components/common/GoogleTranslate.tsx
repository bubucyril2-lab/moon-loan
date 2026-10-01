import React, { useState, useEffect, useRef } from 'react';
import { Globe, Check, Search, X, ChevronDown, RotateCcw } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  Language,
  detectUserLanguageAndRegion,
  applyLanguage,
  getGoogleTranslateCookie,
  setGoogleTranslateCookie,
  triggerGoogleTranslateCombo,
  DetectedRegionInfo
} from '../../services/translationService';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
    __googleTranslateInitialized?: boolean;
  }
}

// Ensure the Google Translate script is loaded once
const loadGoogleTranslateScript = () => {
  if (typeof window === 'undefined') return;

  // Ensure single hidden container exists in DOM
  let container = document.getElementById('google_translate_element');
  if (!container) {
    container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.display = 'none';
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);
  }

  window.googleTranslateElementInit = () => {
    try {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false,
          },
          'google_translate_element'
        );
        window.__googleTranslateInitialized = true;

        // Apply initial language if cookie or detection exists
        const cookieLang = getGoogleTranslateCookie();
        const initialLang = cookieLang || detectUserLanguageAndRegion().langCode;
        if (initialLang && initialLang !== 'en') {
          setTimeout(() => {
            triggerGoogleTranslateCombo(initialLang);
          }, 300);
        }
      }
    } catch (e) {
      console.warn('Google Translate initialization notice:', e);
    }
  };

  if (!document.querySelector('script[src*="translate.google.com"]')) {
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => {
      // Retry once after 2 seconds
      setTimeout(() => {
        if (!document.querySelector('script[src*="translate.google.com"]')) {
          const retry = document.createElement('script');
          retry.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          retry.async = true;
          document.body.appendChild(retry);
        }
      }, 2000);
    };
    document.body.appendChild(script);
  } else if (window.google && window.google.translate && !window.__googleTranslateInitialized) {
    window.googleTranslateElementInit();
  }
};

const GoogleTranslate: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLangCode, setCurrentLangCode] = useState<string>('en');
  const [detectedInfo, setDetectedInfo] = useState<DetectedRegionInfo | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial detection & setup on mount
  useEffect(() => {
    loadGoogleTranslateScript();

    const info = detectUserLanguageAndRegion();
    setDetectedInfo(info);

    // Read initial active language
    const cookieLang = getGoogleTranslateCookie();
    const effectiveLang = cookieLang || info.langCode;
    setCurrentLangCode(effectiveLang);

    // If auto-detected non-English language on first visit, ensure cookie is set
    if (info.isAutoDetected && !cookieLang && info.langCode !== 'en') {
      setGoogleTranslateCookie(info.langCode);
      // Wait for script to be ready to trigger
      const checkInterval = setInterval(() => {
        if (triggerGoogleTranslateCombo(info.langCode)) {
          clearInterval(checkInterval);
        }
      }, 400);
      setTimeout(() => clearInterval(checkInterval), 6000);
    }

    // Listen for language changes from other components
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ langCode: string }>;
      if (customEvent.detail?.langCode) {
        setCurrentLangCode(customEvent.detail.langCode);
      }
    };

    const handleOpenSelector = () => {
      setIsOpen(true);
    };

    window.addEventListener('econest_language_changed', handleLangChange);
    window.addEventListener('econest_open_language_selector', handleOpenSelector);

    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('econest_language_changed', handleLangChange);
      window.removeEventListener('econest_open_language_selector', handleOpenSelector);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    setCurrentLangCode(lang.code);
    applyLanguage(lang.code, true);
    setIsOpen(false);
  };

  const handleResetToEnglish = () => {
    setCurrentLangCode('en');
    applyLanguage('en', true);
    setIsOpen(false);
  };

  const activeLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode) || {
    code: currentLangCode,
    name: currentLangCode.toUpperCase(),
    nativeName: currentLangCode.toUpperCase(),
    flag: '🌐'
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const popularLanguages = SUPPORTED_LANGUAGES.filter(l => l.popular);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all text-xs sm:text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.98]"
        title="Translate Website"
        aria-label="Change Language"
      >
        <span className="text-base sm:text-lg leading-none" role="img" aria-label={activeLang.name}>
          {activeLang.flag}
        </span>
        <span className="hidden sm:inline font-semibold text-slate-800">
          {activeLang.nativeName || activeLang.name}
        </span>
        <span className="sm:hidden font-semibold text-slate-800 uppercase">
          {activeLang.code.split('-')[0]}
        </span>
        {detectedInfo?.isAutoDetected && activeLang.code !== 'en' && (
          <span className="hidden md:inline-block text-[10px] bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-bold">
            Auto
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-20 sm:top-full sm:right-0 mt-2 sm:w-80 max-h-[85vh] sm:max-h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[9999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Select Language & Region
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder-slate-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100">
            {/* Auto-detected shortcut (if applicable and query is empty) */}
            {!searchQuery && detectedInfo && detectedInfo.isAutoDetected && (
              <div className="pb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                  <span>Detected for your region</span>
                  <span className="text-emerald-600 font-semibold">{detectedInfo.regionDescription}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const l = SUPPORTED_LANGUAGES.find(x => x.code === detectedInfo.langCode);
                    if (l) handleSelectLanguage(l);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                    activeLang.code === detectedInfo.langCode
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">{detectedInfo.flag}</span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                        {detectedInfo.nativeName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {detectedInfo.langName} (Region: {detectedInfo.regionDescription})
                      </p>
                    </div>
                  </div>
                  {activeLang.code === detectedInfo.langCode ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Use
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Popular Languages (if query is empty) */}
            {!searchQuery && (
              <div className="py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Popular Languages
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {popularLanguages.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang)}
                      className={`text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                        activeLang.code === lang.code
                          ? 'bg-emerald-600 text-white font-medium shadow-xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span className="text-xs truncate">{lang.nativeName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All / Filtered Languages List */}
            <div className="py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                {searchQuery ? `Matching Languages (${filteredLanguages.length})` : 'All Languages'}
              </div>
              <div className="space-y-0.5 pt-1">
                {filteredLanguages.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No matching languages found.
                  </div>
                ) : (
                  filteredLanguages.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        activeLang.code === lang.code
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <div className="truncate">
                          <span className="text-xs text-slate-800 font-medium">
                            {lang.nativeName}
                          </span>
                          {lang.nativeName !== lang.name && (
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({lang.name})
                            </span>
                          )}
                        </div>
                      </div>
                      {activeLang.code === lang.code && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer: Reset to original English */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToEnglish}
              className="text-xs font-medium text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Original (English)</span>
            </button>
            <span className="text-[10px] text-slate-400">
              Powered by Google Translate
            </span>
          </div>
        </div>
      )}

      {/* Global CSS to prevent Google Translate banner layout shifts & style cleanups */}
      <style>{`
        /* Hide google translate banner frame and branding elements */
        .goog-te-banner-frame,
        .goog-te-banner,
        #goog-gt-tt,
        .goog-te-balloon-frame {
          display: none !important;
          visibility: hidden !important;
        }

        body {
          top: 0px !important;
          position: static !important;
        }

        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }

        /* Suppress font resize caused by Google Translate */
        font {
          background-color: transparent !important;
          box-shadow: none !important;
        }

        /* Hide the native gadget if somehow rendered */
        .goog-te-gadget {
          font-size: 0 !important;
          color: transparent !important;
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslate;
