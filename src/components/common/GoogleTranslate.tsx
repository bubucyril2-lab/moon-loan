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

    // Polling technique to regularly inject styling into the dynamically generated translation Iframe
    const injectIframeStyles = () => {
      try {
        const iframe = document.querySelector('iframe.goog-te-menu-frame') as HTMLIFrameElement;
        if (!iframe) return;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        const styleId = 'custom-google-translate-iframe-styles-v2';
        if (!iframeDoc.getElementById(styleId)) {
          const style = iframeDoc.createElement('style');
          style.id = styleId;
          style.innerHTML = `
            html, body {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              height: 100% !important;
              box-sizing: border-box !important;
              -webkit-overflow-scrolling: touch !important;
              background-color: #ffffff !important;
            }
            .goog-te-menu2 {
              width: 100% !important;
              max-width: 100% !important;
              height: 100% !important;
              box-sizing: border-box !important;
              border: none !important;
              padding: 16px !important;
              background-color: #ffffff !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              display: block !important;
            }
            .goog-te-menu2 table, 
            .goog-te-menu2 tbody {
              display: block !important;
              width: 100% !important;
            }
            .goog-te-menu2 tr {
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
              width: 100% !important;
              box-sizing: border-box !important;
              justify-content: flex-start !important;
            }
            .goog-te-menu2 td {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 100% !important;
              box-sizing: border-box !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .goog-te-menu2-item {
              display: block !important;
              width: 100% !important;
            }
            .goog-te-menu2-item div {
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              width: 100% !important;
            }
            .goog-te-menu2-item .text {
              font-family: inherit !important;
              font-size: 14px !important;
              font-weight: 500 !important;
              color: #334155 !important;
              padding: 12px 16px !important;
              border-radius: 8px !important;
              background-color: #f8fafc !important;
              display: block !important;
              width: 100% !important;
              box-sizing: border-box !important;
              transition: all 0.2s ease !important;
              border: 1px solid #e2e8f0 !important;
              text-align: left !important;
            }
            .goog-te-menu2-item:hover .text {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
              border-color: #cbd5e1 !important;
            }
            .goog-te-menu2-item-selected {
              background-color: transparent !important;
            }
            .goog-te-menu2-item-selected .text {
              background-color: #10b981 !important;
              color: #ffffff !important;
              border-color: #10b981 !important;
            }
            .goog-te-menu2-header {
              display: block !important;
              width: 100% !important;
              padding-bottom: 12px !important;
              margin-bottom: 12px !important;
              border-bottom: 1px solid #e2e8f0 !important;
            }
            .goog-te-menu2-header table, 
            .goog-te-menu2-header tbody, 
            .goog-te-menu2-header tr {
              display: block !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .goog-te-menu2-header td {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .goog-te-menu2-header td h1 {
              font-family: inherit !important;
              font-size: 16px !important;
              font-weight: 600 !important;
              color: #0f172a !important;
              text-align: center !important;
              margin: 0 !important;
              padding: 4px 0 !important;
            }
            .goog-te-menu2-header td.goog-te-menu2-title-link {
              display: none !important;
            }
            ::-webkit-scrollbar {
              width: 6px !important;
            }
            ::-webkit-scrollbar-track {
              background: #f1f5f9 !important;
            }
            ::-webkit-scrollbar-thumb {
              background: #cbd5e1 !important;
              border-radius: 4px !important;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #94a3b8 !important;
            }
          `;
          iframeDoc.head.appendChild(style);
        }
      } catch (err) {
        // Safe to ignore if iframe handles different domains initially
      }
    };

    const interval = setInterval(injectIframeStyles, 1000);
    return () => clearInterval(interval);
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

        /* Ambient custom dropdown button style on page */
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
          border-color: #10b981 !important;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15) !important;
        }

        /* Beautiful centring styling for the actual dropdown iframe panel itself */
        iframe.goog-te-menu-frame, .goog-te-menu-frame {
          z-index: 999999999 !important;
          background: transparent !important;
        }

        @media (max-width: 768px) {
          iframe.goog-te-menu-frame, .goog-te-menu-frame {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
            width: 88% !important;
            max-width: 360px !important;
            height: 65vh !important;
            max-height: 480px !important;
            box-sizing: border-box !important;
            border-radius: 16px !important;
            box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.3) !important;
            border: 1px solid #cbd5e1 !important;
            background-color: #ffffff !important;
            overflow: hidden !important;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslate;
