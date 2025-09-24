'use client';
import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

let loader: Loader | null = null;

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded) return;

    if (!loader) {
      loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['places', 'geometry'],
      });
    }

    loader.load().then(() => {
      setIsLoaded(true);
    }).catch(err => {
      console.error('Google Maps failed to load:', err);
    });
  }, [isLoaded]);

  return { isLoaded };
}
