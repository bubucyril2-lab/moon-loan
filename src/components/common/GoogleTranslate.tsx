import React, { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

const initGoogleTranslate = () => {
  const container = document.getElementById('google_translate_element');
  if (!container || container.innerHTML !== '') return;

  try {
    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          autoDisplay: false,
        },
        'google_translate_element'
      );
    }
  } catch (error) {
    console.error('Error initializing Google Translate:', error);
  }
};

window.googleTranslateElementInit = initGoogleTranslate;

const GoogleTranslate: React.FC = () => {
  useEffect(() => {
    const addScript = () => {
      if (document.querySelector('script[src*="translate.google.com"]')) {
        if (window.google && window.google.translate) {
          initGoogleTranslate();
        }
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => {
        console.error('Google Translate script failed to load');
        setTimeout(() => {
          if (!document.querySelector('script[src*="translate.google.com"]')) {
            const retryScript = document.createElement('script');
            retryScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            retryScript.async = true;
            document.body.appendChild(retryScript);
          }
        }, 2000);
      };
      document.body.appendChild(script);
    };

    if (window.google && window.google.translate) {
      initGoogleTranslate();
    } else {
      addScript();
    }
  }, []);

  return (
    <div className="flex items-center min-w-[140px]">
      <div id="google_translate_element" className="google-translate-container min-w-0 w-full"></div>
      <style>{`
        /* Hide google translate branding and text */
        .goog-te-gadget {
          font-size: 0 !important;
          color: transparent !important;
          font-family: inherit !important;
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
        }
        .goog-te-gadget > span,
        .goog-te-gadget .goog-logo-link,
        .goog-te-banner-frame {
          display: none !important;
        }
        
        body {
          top: 0 !important;
        }

        /* Beautiful native dropdown styling */
        select.goog-te-combo {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          padding: 6px 36px 6px 12px !important;
          border-radius: 8px !important;
          font-family: inherit !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #334155 !important;
          outline: none !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 10px center !important;
          background-size: 14px !important;
          min-width: 140px !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 34px !important;
          box-sizing: border-box !important;
          line-height: normal !important;
        }

        select.goog-te-combo:hover {
          border-color: #94a3b8 !important;
          background-color: #f8fafc !important;
        }

        select.goog-te-combo:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslate;
