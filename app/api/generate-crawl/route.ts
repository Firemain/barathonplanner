import { NextRequest, NextResponse } from 'next/server';
import { GoogleMapsService } from '@/lib/googleMaps';

interface Bar {
  id: string;
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  openingHours: string;
  googleMapsLink: string;
  position: { lat: number; lng: number };
  estimatedArrivalTime: string;
  price_level?: number;
}

interface CrawlData {
  routePolyline: string;
  bars: Bar[];
  totalDuration: string;
  totalDistance: string;
}

export async function POST(request: NextRequest) {
  try {
    const { start, end, barsCount, startTime, mode } = await request.json();

    if (!start || !end || !barsCount || !startTime) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key manquante' }, { status: 500 });
    }

    const crawlData = await generateRealCrawlData(
      start,
      end,
      barsCount,
      startTime,
      apiKey,
      (mode as string) || 'rating'
    );
    return NextResponse.json(crawlData);
  } catch (error) {
    console.error('Error generating crawl:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du parcours' }, { status: 500 });
  }
}

// 🔥 Score pondéré (note + nb d’avis)
function weightedRating(rating: number, votes: number, m = 50) {
  if (!rating) return 0;
  return (votes / (votes + m)) * rating + (m / (votes + m)) * 3.5;
}

// 🔥 Fonction principale de scoring
function scoreBar(details: any, mode: string = 'rating'): number {
  const rating = details.rating ?? 0;
  const votes = details.user_ratings_total ?? 0;
  const price = details.price_level ?? 2; // 0=gratuit, 4=cher

  const weighted = weightedRating(rating, votes, 50);

  switch (mode) {
    case 'price':
      return -price;
    case 'mixed':
      return weighted - 0.3 * price;
    case 'rating':
    default:
      return weighted;
  }
}

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function isDuplicateBar(bars: Bar[], candidate: { id: string; position: { lat: number; lng: number } }) {
  if (bars.some(b => b.id === candidate.id)) return true;
  return bars.some(b => haversine(b.position, candidate.position) < 60);
}

async function generateRealCrawlData(
  start: string,
  end: string,
  barsCount: number,
  startTime: string,
  apiKey: string,
  mode: string
): Promise<CrawlData> {
  const mapsService = new GoogleMapsService(apiKey);

  const startCoords = await mapsService.geocodeAddress(start);
  const endCoords = await mapsService.geocodeAddress(end);
  if (!startCoords || !endCoords) throw new Error('Impossible de géocoder les adresses');

  let bars: Bar[] = [];
  let polyline = '';
  let route: any;

  // 🚀 Mode "shortest" → bars le long du trajet le plus court
  if (mode === 'shortest') {
    console.log('Mode shortest activé');
    const directRoute = await mapsService.getDirections(start, end, []);
    if (!directRoute) throw new Error("Impossible de calculer l'itinéraire direct");
    
    route = directRoute.routes[0];
    polyline = route.overview_polyline.points;
    console.log('Polyline récupérée, longueur:', polyline.length);

    // Décoder la polyline avec notre fonction
    const { decodePolyline } = await import('@/lib/googleMaps');
    const decodedPath = decodePolyline(polyline);
    console.log('Points décodés:', decodedPath.length);
    
    if (decodedPath.length === 0) {
      console.log('Aucun point décodé, fallback vers mode rating');
      // Fallback vers le mode rating si le décodage échoue
      return generateRealCrawlData(start, end, barsCount, startTime, apiKey, 'rating');
    }
    
    // Échantillonnage intelligent des points
    const step = Math.max(1, Math.floor(decodedPath.length / (barsCount * 3)));
    const samplePoints = decodedPath.filter((_, i) => i % step === 0);
    console.log('Points échantillonnés:', samplePoints.length);

    for (const point of samplePoints) {
      if (bars.length >= barsCount) break;
      
      console.log(`Recherche bars près de ${point.lat}, ${point.lng}`);
      const nearby = await mapsService.findNearbyBars(point.lat, point.lng, 300);
      if (!nearby?.length) continue;
      
      console.log(`Trouvé ${nearby.length} bars à proximité`);

      const sorted = nearby
        .map(n => ({ n, score: scoreBar(n, 'rating') }))
        .sort((a, b) => b.score - a.score);

      for (const s of sorted.slice(0, 3)) { // Limite à 3 meilleurs pour éviter trop d'appels API
        const d = await mapsService.getPlaceDetails(s.n.place_id);
        if (!d) continue;
        
        const candidate: Bar = {
          id: s.n.place_id,
          name: d.name,
          address: d.formatted_address,
          rating: d.rating || 0,
          userRatingsTotal: d.user_ratings_total || 0,
          openingHours: d.opening_hours?.open_now === true 
            ? 'Ouvert' 
            : d.opening_hours?.open_now === false 
            ? 'Fermé' 
            : 'Horaires inconnus',
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${d.name} ${d.formatted_address}`
          )}&query_place_id=${s.n.place_id}`,
          position: { lat: d.geometry.location.lat, lng: d.geometry.location.lng },
          estimatedArrivalTime: '',
          price_level: d.price_level,
        };
        
        if (!isDuplicateBar(bars, candidate)) {
          bars.push(candidate);
          console.log(`Bar ajouté: ${candidate.name}`);
          break;
        }
      }
    }
    
    console.log(`Mode shortest: ${bars.length} bars trouvés`);
    
    // 🔥 IMPORTANT: Recalculer l'itinéraire avec les bars trouvés
    if (bars.length > 0) {
      console.log('Recalcul de l\'itinéraire avec les bars trouvés...');
      const waypointsForDirections = bars.map(bar => ({
        location: `${bar.position.lat},${bar.position.lng}`,
        stopover: true,
      }));
      
      const finalDirections = await mapsService.getDirections(start, end, waypointsForDirections);
      if (finalDirections) {
        route = finalDirections.routes[0];
        polyline = route.overview_polyline.points;
        console.log('✅ Itinéraire final recalculé, nouvelle polyline longueur:', polyline.length);
        
        // Réorganiser les bars selon l'ordre optimisé par Google
        const order: number[] = (route as any).waypoint_order || bars.map((_, i) => i);
        bars = order.map(i => bars[i]);
        console.log('✅ Bars réorganisés selon l\'ordre optimal');
      } else {
        console.log('⚠️ Impossible de recalculer l\'itinéraire final, garde la polyline directe');
      }
    }
  } else {
    // 🚀 Modes classiques : rating, price, mixed (ton algo original)
    const target = Math.max(1, barsCount);
    const seeds = calculateWaypoints(startCoords, endCoords, target);
    for (let i = 0; i < seeds.length && bars.length < target; i++) {
      const wp = seeds[i];
      for (const r of [300, 500, 700]) {
        const nearby = await mapsService.findNearbyBars(wp.lat, wp.lng, r);
        if (!nearby?.length) continue;

        const scored = nearby
          .map(n => ({ n, score: scoreBar(n, mode) }))
          .sort((a, b) => {
            const aOpen = a.n.opening_hours?.open_now ? 1 : 0;
            const bOpen = b.n.opening_hours?.open_now ? 1 : 0;
            if (aOpen !== bOpen) return bOpen - aOpen;
            return b.score - a.score;
          });

        for (const s of scored) {
          const details = await mapsService.getPlaceDetails(s.n.place_id);
          if (!details) continue;

          const candidate: Bar = {
            id: s.n.place_id,
            name: details.name,
            address: details.formatted_address,
            rating: details.rating || 0,
            userRatingsTotal: details.user_ratings_total || 0,
            openingHours:
              details.opening_hours?.open_now === true
                ? 'Ouvert'
                : details.opening_hours?.open_now === false
                ? 'Fermé'
                : 'Horaires inconnus',
            googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${details.name} ${details.formatted_address}`
            )}&query_place_id=${s.n.place_id}`,
            position: { lat: details.geometry.location.lat, lng: details.geometry.location.lng },
            estimatedArrivalTime: '',
            price_level: details.price_level,
          };

          if (!isDuplicateBar(bars, candidate)) {
            bars.push(candidate);
            break;
          }
        }

        if (bars.length >= target) break;
      }
    }

    // Itinéraire avec optimisation
    const waypointsForDirections = bars.map(bar => ({
      location: `${bar.position.lat},${bar.position.lng}`,
      stopover: true,
    }));
    const directions = await mapsService.getDirections(start, end, waypointsForDirections);
    if (!directions) throw new Error("Impossible de calculer l'itinéraire avec les bars");

    route = directions.routes[0];
    const order: number[] = (route as any).waypoint_order || bars.map((_, i) => i);
    bars = order.map(i => bars[i]);
    polyline = route.overview_polyline.points;
  }

  // ⏱️ Recalcule ETA
  const minutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const startMin = minutes(startTime);
  bars.forEach((b, i) => {
    const arr = startMin + i * 60 + i * 15;
    const h = Math.floor(arr / 60) % 24;
    const m = arr % 60;
    b.estimatedArrivalTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  });

  const totalDuration = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);
  const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);

  return {
    routePolyline: polyline,
    bars,
    totalDuration: `${Math.round(totalDuration / 60)} minutes`,
    totalDistance: `${(totalDistance / 1000).toFixed(1)} km`,
  };
}

function calculateWaypoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  count: number
): Array<{ lat: number; lng: number }> {
  const waypoints: Array<{ lat: number; lng: number }> = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  return waypoints;
}
