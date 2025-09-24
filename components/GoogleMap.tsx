'use client';

import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface Bar {
  id: string;
  name: string;
  address: string;
  rating: number;
  position: { lat: number; lng: number };
}

interface GoogleMapProps {
  bars: Bar[];
  routePolyline: string;
  start: string; // adresse de départ
  end: string;   // adresse d’arrivée
  selectedBarId?: string | null;
}

// ⚡ Créer un seul loader global, avec geometry dès le départ
const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places', 'geometry'], 
  id: '__googleMapsScriptId__', // stable
});

export default function GoogleMap({ bars, routePolyline, start, end, selectedBarId }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!mapRef.current || !bars?.length) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key manquante dans .env.local');
      return;
    }

    loader.load().then(async () => {
      console.log('geometry lib dispo ?', !!google.maps.geometry);
      console.log('encoding dispo ?', !!google.maps.geometry?.encoding);
    
      const map = new google.maps.Map(mapRef.current as HTMLDivElement, {
        zoom: 15,
        center: bars[0].position,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        ],
      });

      mapInstanceRef.current = map;
      markersRef.current = {};
      infoWindowRef.current = new google.maps.InfoWindow();

      // 🎯 Markers pour les bars
      bars.forEach((bar, index) => {
        const marker = new google.maps.Marker({
          position: bar.position,
          map,
          title: bar.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 18,
            fillColor: '#8B5CF6',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 4,
          },
          label: {
            text: (index + 1).toString(),
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
          },
        });

        markersRef.current[bar.id] = marker;

        const content = `
          <div style="color: black; padding: 12px; min-width: 220px; font-family: system-ui;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 15px;">${bar.name}</h3>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">${bar.address}</p>
            ${bar.rating ? `<div style="color: #f59e0b;">⭐ ${bar.rating}/5</div>` : ''}
          </div>
        `;

        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(map, marker);
          }
        });
      });

      // 🎯 Marker START 🚀
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: start }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          new google.maps.Marker({
            position: results[0].geometry.location,
            map,
            title: 'Point de départ',
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            },
            label: {
              text: '🚀',
              fontSize: '16px',
            },
          });
        }
      });

      // 🎯 Marker END 🏁
      geocoder.geocode({ address: end }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          new google.maps.Marker({
            position: results[0].geometry.location,
            map,
            title: 'Point d’arrivée',
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            },
            label: {
              text: '🏁',
              fontSize: '16px',
            },
          });
        }
      });

      // 🎯 Polyline
      console.log('=== DEBUG POLYLINE ===');
      console.log('routePolyline reçu:', routePolyline);
      console.log('routePolyline length:', routePolyline?.length);
      console.log('google.maps.geometry disponible:', !!google.maps.geometry);
      console.log('google.maps.geometry.encoding disponible:', !!google.maps.geometry?.encoding);
      
      if (routePolyline && google.maps.geometry?.encoding) {
        console.log('✅ Conditions OK - Tentative décodage polyline');
        try {
          const decodedPath = google.maps.geometry.encoding.decodePath(routePolyline);
          console.log('✅ Polyline décodée avec succès, points:', decodedPath.length);
          console.log('Premier point:', decodedPath[0]);
          console.log('Dernier point:', decodedPath[decodedPath.length - 1]);
          
          const polylineObj = new google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: '#EC4899',
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
          });
          
          console.log('✅ Objet Polyline créé:', polylineObj);
          console.log('✅ Polyline ajoutée à la carte');
        } catch (e) {
          console.error('❌ Erreur lors du décodage polyline:', e);
          console.error('Polyline brute:', routePolyline.substring(0, 50) + '...');
        }
      } else {
        console.log('❌ Conditions non remplies pour afficher polyline:');
        console.log('  - routePolyline présent:', !!routePolyline);
        console.log('  - geometry.encoding disponible:', !!google.maps.geometry?.encoding);
        if (!routePolyline) {
          console.log('  - routePolyline est:', routePolyline);
        }
      }
    });
  }, [bars, routePolyline, start, end]);

  // 🎯 Sélection depuis une card
  useEffect(() => {
    if (!selectedBarId) return;
    const map = mapInstanceRef.current;
    const marker = markersRef.current[selectedBarId];

    if (map && marker) {
      map.panTo(marker.getPosition()!);
      map.setZoom(16);

      const content = `<strong>${marker.getTitle()}</strong>`;
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, marker);
      }
    }
  }, [selectedBarId]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
    />
  );
}
