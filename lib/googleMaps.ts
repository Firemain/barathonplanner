// Google Maps API utilities
export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  price_level?: number;
}

export interface DirectionsResult {
  routes: Array<{
    overview_polyline: {
      points: string;
    };
    legs: Array<{
      duration: {
        text: string;
        value: number;
      };
      distance: {
        text: string;
        value: number;
      };
    }>;
  }>;
}

export class GoogleMapsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      console.log('Geocoding address:', address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=fr&key=${this.apiKey}`
      );
      const data = await response.json();
      
      console.log('Geocoding response status:', data.status);
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('Geocoded location:', location);
        return { lat: location.lat, lng: location.lng };
      }
      
      console.log('No geocoding results found');
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async getDirections(
  origin: string,
  destination: string,
  waypoints?: { location: string; stopover?: boolean }[]
): Promise<DirectionsResult | null> {
  try {
    console.log('Getting directions from', origin, 'to', destination);

    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('mode', 'walking');
    url.searchParams.set('region', 'fr');
    url.searchParams.set('key', this.apiKey);

    // 🔥 Ajout des waypoints si fournis
    if (waypoints && waypoints.length > 0) {
      const wpString = 'optimize:true|' + waypoints.map(wp => wp.location).join('|');
      url.searchParams.set('waypoints', wpString);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    console.log('Directions response status:', data.status);

    if (data.routes && data.routes.length > 0) {
      console.log(
        'Directions found, polyline length:',
        data.routes[0].overview_polyline.points.length
      );
      return data;
    }

    return null;
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
}


  async findNearbyBars(lat: number, lng: number, radius: number = 500): Promise<PlaceResult[]> {
    try {
      console.log('Finding nearby bars at', lat, lng, 'radius:', radius);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=bar&keyword=bar|pub|brasserie&key=${this.apiKey}`
      );
      const data = await response.json();
      
      console.log('Places search response status:', data.status);
      console.log('Found', data.results?.length || 0, 'bars');
      
      return data.results || [];
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,opening_hours,geometry,photos,price_level&key=${this.apiKey}`
      );
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error('Place details error:', data.status, data.error_message);
        return null;
      }
      
      return data.result || null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }
}

// Utility functions to encode/decode polyline
export function encodePolyline(points: Array<{ lat: number; lng: number }>): string {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;
  
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    
    const deltaLat = lat - prevLat;
    const deltaLng = lng - prevLng;
    
    result += encodeSignedNumber(deltaLat);
    result += encodeSignedNumber(deltaLng);
    
    prevLat = lat;
    prevLng = lng;
  }
  
  return result;
}

function encodeSignedNumber(num: number): string {
  let sgn_num = num << 1;
  if (num < 0) {
    sgn_num = ~sgn_num;
  }
  return encodeNumber(sgn_num);
}

function encodeNumber(num: number): string {
  let result = '';
  while (num >= 0x20) {
    result += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  result += String.fromCharCode(num + 63);
  return result;
}

export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return poly;
}