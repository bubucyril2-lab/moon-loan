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
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
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
        // If script exists but google is not ready, it will call the global init when ready
        // If google IS ready, we call it manually
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
    <div className="flex items-center">
      <div id="google_translate_element" className="google-translate-container"></div>
      <style>{`
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: 1px solid #e2e8f0 !important;
          padding: 4px 8px !important;
          border-radius: 8px !important;
          font-family: inherit !important;
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }
        .goog-te-gadget-simple:hover {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        .goog-te-gadget-icon {
          display: none !important;
        }
        .goog-te-menu-value {
          margin: 0 !important;
          color: #475569 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
        }
        .goog-te-menu-value span {
          color: #475569 !important;
        }
        .goog-te-menu-value img {
          display: none !important;
        }
        .goog-te-banner-frame {
          display: none !important;
        }
        body {
          top: 0 !important;
        }
        .goog-te-menu-frame {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslate;
