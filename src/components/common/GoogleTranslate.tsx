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
    const injectStyles = () => {
      try {
        const iframe = document.querySelector('iframe.goog-te-menu-frame') as HTMLIFrameElement;
        if (iframe) {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const existingStyle = iframeDoc.getElementById('custom-mobile-translate-style');
            if (!existingStyle) {
              const style = iframeDoc.createElement('style');
              style.id = 'custom-mobile-translate-style';
              style.innerHTML = `
                html, body {
                  width: 100% !important;
                  max-width: 100vw !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow-x: hidden !important;
                  overflow-y: auto !important;
                  height: 100% !important;
                  -webkit-overflow-scrolling: touch !important;
                  background-color: #ffffff !important;
                }
                .goog-te-menu2 {
                  width: 100% !important;
                  max-width: 100vw !important;
                  height: auto !important;
                  min-height: 100% !important;
                  box-sizing: border-box !important;
                  overflow-x: hidden !important;
                  overflow-y: auto !important;
                  -webkit-overflow-scrolling: touch !important;
                  padding: 16px !important;
                  background-color: #ffffff !important;
                  border: none !important;
                }
                .goog-te-menu2 table, .goog-te-menu2 tbody {
                  display: block !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  box-sizing: border-box !important;
                }
                .goog-te-menu2 tr {
                  display: flex !important;
                  flex-wrap: wrap !important;
                  width: 100% !important;
                  gap: 8px !important;
                  box-sizing: border-box !important;
                }
                .goog-te-menu2 td {
                  display: block !important;
                  flex: 1 1 calc(50% - 8px) !important;
                  width: calc(50% - 8px) !important;
                  min-width: calc(50% - 8px) !important;
                  max-width: calc(50% - 8px) !important;
                  box-sizing: border-box !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .goog-te-menu2-item div {
                  padding: 0 !important;
                  margin: 0 !important;
                }
                .goog-te-menu2-item {
                  padding: 0 !important;
                  margin: 0 !important;
                  display: block !important;
                  width: 100% !important;
                }
                .goog-te-menu2-item div, .goog-te-menu2-item span {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: transparent !important;
                  border: none !important;
                }
                .goog-te-menu2 a, .goog-te-menu2 a:link, .goog-te-menu2 a:visited {
                  color: #334155 !important;
                  font-family: inherit !important;
                  font-size: 14px !important;
                  font-weight: 500 !important;
                  text-decoration: none !important;
                  padding: 12px 8px !important;
                  border-radius: 8px !important;
                  background-color: #f8fafc !important;
                  display: block !important;
                  transition: all 0.2s ease !important;
                  margin: 0 !important;
                  border: 1px solid #e2e8f0 !important;
                  text-align: center !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                  box-sizing: border-box !important;
                }
                .goog-te-menu2 a:hover, .goog-te-menu2 a:active {
                  background-color: #2563eb !important;
                  color: #ffffff !important;
                  border-color: #1d4ed8 !important;
                }
                ::-webkit-scrollbar {
                  height: 6px !important;
                  width: 6px !important;
                }
                ::-webkit-scrollbar-thumb {
                  background-color: #cbd5e1 !important;
                  border-radius: 9999px !important;
                }
                ::-webkit-scrollbar-track {
                  background-color: #f8fafc !important;
                }
              `;
              iframeDoc.head.appendChild(style);
            }
          }
        }
      } catch (e) {
        console.debug('Failed same-origin iframe style injection context', e);
      }
    };

    injectStyles();
    const intervalId = setInterval(injectStyles, 400);
    document.addEventListener('click', injectStyles);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('click', injectStyles);
    };
  }, []);

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
    <div className="flex items-center min-w-[120px]">
      <div id="google_translate_element" className="google-translate-container min-w-0"></div>
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
        iframe.goog-te-menu-frame, .goog-te-menu-frame {
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
        }
        @media (max-width: 768px) {
          iframe.goog-te-menu-frame, .goog-te-menu-frame {
            width: 100% !important;
            max-width: 100vw !important;
            left: 0px !important;
            right: 0px !important;
            top: auto !important;
            bottom: 0px !important;
            height: 400px !important;
            max-height: 60vh !important;
            position: fixed !important;
            box-sizing: border-box !important;
            border-radius: 20px 20px 0 0 !important;
            box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.15) !important;
            border: none !important;
            border-top: 1px solid #cbd5e1 !important;
            overflow: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            z-index: 999999999 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslate;
