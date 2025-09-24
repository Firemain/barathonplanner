// hooks/useLoadGoogleMaps.ts
'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    initGoogleMaps?: () => void;
  }
}

export function useLoadGoogleMaps() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }

    // éviter de réinjecter plusieurs fois
    if (document.querySelector('script[data-google-maps]')) {
      const check = setInterval(() => {
        if (window.google && window.google.maps) {
          setLoaded(true);
          clearInterval(check);
        }
      }, 200);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');
    document.head.appendChild(script);

    window.initGoogleMaps = () => {
      setLoaded(true);
    };

    return () => {
      delete window.initGoogleMaps;
    };
  }, []);

  return loaded;
}
