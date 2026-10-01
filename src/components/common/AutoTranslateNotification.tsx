import React, { useState, useEffect } from 'react';
import { Globe, X, Check, RotateCcw } from 'lucide-react';
import {
  detectUserLanguageAndRegion,
  applyLanguage,
  hasBeenAutoNotified,
  markAutoNotified,
  DetectedRegionInfo
} from '../../services/translationService';

interface AutoTranslateNotificationProps {
  onOpenSelector?: () => void;
}

const AutoTranslateNotification: React.FC<AutoTranslateNotificationProps> = ({ onOpenSelector }) => {
  const [detection, setDetection] = useState<DetectedRegionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if user has not already been notified and auto-translation was activated
    if (hasBeenAutoNotified()) return;

    const info = detectUserLanguageAndRegion();
    if (info.isAutoDetected && info.langCode !== 'en') {
      setDetection(info);
      // Brief delay before showing notification so user sees the page comfortably
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      // Auto dismiss after 9 seconds if untouched
      const autoDismissTimer = setTimeout(() => {
        setIsVisible(false);
        markAutoNotified();
      }, 9500);

      return () => {
        clearTimeout(timer);
        clearTimeout(autoDismissTimer);
      };
    }
  }, []);

  if (!isVisible || !detection) return null;

  const handleKeep = () => {
    markAutoNotified();
    setIsVisible(false);
  };

  const handleRevertEnglish = () => {
    applyLanguage('en', true);
    markAutoNotified();
    setIsVisible(false);
  };

  const handleChange = () => {
    markAutoNotified();
    setIsVisible(false);
    if (onOpenSelector) {
      onOpenSelector();
    } else {
      window.dispatchEvent(new CustomEvent('econest_open_language_selector'));
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700/80 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none" role="img" aria-label={detection.langName}>
              {detection.flag}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Auto Translated
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {detection.regionDescription}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100 mt-0.5">
                Page translated to <strong className="text-emerald-300 font-semibold">{detection.nativeName} ({detection.langName})</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleKeep}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-xs">
          <button
            onClick={handleKeep}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" /> Keep ({detection.langCode.toUpperCase()})
          </button>
          <button
            onClick={handleRevertEnglish}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> English
          </button>
          <button
            onClick={handleChange}
            className="text-slate-400 hover:text-emerald-400 py-1.5 px-2 underline transition-colors"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoTranslateNotification;
