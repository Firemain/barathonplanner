// Données de démonstration améliorées pour Lille
export const lilleCrawlData = {
  routePolyline: "u`miHmqr@OAOCKCICGCECEECEEAEGAEGAGGAGIAGIAIIAIKAIKAKKAKMAKMAMOAMOAOOAOQAQQAQSAQSASSASSAUUAUUAUWAWWAWYAYYAYYA[YA[[A[[A][A]_@A]_@A_@_@A_@a@A_@a@Aa@a@Aa@c@Aa@c@Ac@c@Ac@e@Ac@e@Ae@e@Ae@g@Ae@g@Ag@g@Ag@i@Ag@i@Ai@i@Ai@k@Ai@k@Ak@k@Ak@m@Ak@m@Am@m@Am@o@Am@o@Ao@o@Ao@q@Ao@q@Aq@q@Aq@s@Aq@s@As@s@As@u@As@u@Au@u@Au@w@Au@w@Aw@w@Aw@y@Aw@y@Ay@y@Ay@{@Ay@{@A{@{@A{@}@A{@}@A}@}@A}@",
  bars: [
    {
      id: "bar-1",
      name: "Le Comptoir Lillois",
      address: "12 rue de la Monnaie, Lille",
      rating: 4.2,
      userRatingsTotal: 156,
      openingHours: "Ouvert",
      googleMapsLink: "https://maps.google.com/?q=50.6292,3.0573",
      position: { lat: 50.6292, lng: 3.0573 },
      estimatedArrivalTime: "20:00"
    },
    {
      id: "bar-2", 
      name: "Bar de la Braderie",
      address: "25 rue Esquermoise, Lille",
      rating: 4.0,
      userRatingsTotal: 89,
      openingHours: "Ouvert",
      googleMapsLink: "https://maps.google.com/?q=50.6302,3.0583",
      position: { lat: 50.6302, lng: 3.0583 },
      estimatedArrivalTime: "21:15"
    },
    {
      id: "bar-3",
      name: "L'Estaminet du Vieux-Lille", 
      address: "8 rue de Béthune, Lille",
      rating: 4.5,
      userRatingsTotal: 203,
      openingHours: "Ouvert",
      googleMapsLink: "https://maps.google.com/?q=50.6312,3.0593",
      position: { lat: 50.6312, lng: 3.0593 },
      estimatedArrivalTime: "22:30"
    },
    {
      id: "bar-4",
      name: "Le Zinc des Flandres",
      address: "47 rue Nationale, Lille", 
      rating: 3.8,
      userRatingsTotal: 124,
      openingHours: "Ferme bientôt",
      googleMapsLink: "https://maps.google.com/?q=50.6322,3.0603",
      position: { lat: 50.6322, lng: 3.0603 },
      estimatedArrivalTime: "23:45"
    }
  ],
  totalDuration: "195 minutes",
  totalDistance: "1.8 km"
};

// Fonction pour générer des données réalistes selon la ville
export function getCityMockData(searchText: string, barsCount: number, startTime: string) {
  const cityData = {
    lille: {
      coords: { lat: 50.6292, lng: 3.0573 },
      bars: [
        "Le Comptoir Lillois", "Bar de la Braderie", "L'Estaminet du Vieux-Lille",
        "Le Zinc des Flandres", "Bar à Bières du Nord", "L'Apéro Ch'ti"
      ],
      streets: ["rue de la Monnaie", "rue Esquermoise", "rue de Béthune", "rue Nationale"]
    },
    paris: {
      coords: { lat: 48.8566, lng: 2.3522 },
      bars: [
        "Le Comptoir Parisien", "Bar du Marais", "L'Apéro Montmartre", 
        "Le Zinc de Belleville", "Bar à Vins Saint-Germain", "L'Échappée Belle"
      ],
      streets: ["rue de Rivoli", "boulevard Saint-Germain", "rue de la République", "avenue des Champs-Élysées"]
    }
  };

  // Détecter la ville
  const city = searchText.toLowerCase().includes('lille') ? 'lille' : 'paris';
  const data = cityData[city];

  // Générer les bars
  const bars = [];
  for (let i = 0; i < barsCount; i++) {
    const progress = i / Math.max(1, barsCount - 1);
    bars.push({
      id: `bar-${i + 1}`,
      name: data.bars[i % data.bars.length],
      address: `${Math.floor(Math.random() * 50) + 1} ${data.streets[i % data.streets.length]}, ${city.charAt(0).toUpperCase() + city.slice(1)}`,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      userRatingsTotal: Math.floor(Math.random() * 300) + 50,
      openingHours: Math.random() > 0.2 ? 'Ouvert' : 'Ferme bientôt',
      googleMapsLink: `https://maps.google.com/?q=${data.coords.lat + progress * 0.01},${data.coords.lng + progress * 0.01}`,
      position: {
        lat: data.coords.lat + progress * 0.01 + (Math.random() - 0.5) * 0.005,
        lng: data.coords.lng + progress * 0.01 + (Math.random() - 0.5) * 0.005
      },
      estimatedArrivalTime: calculateArrivalTime(startTime, i)
    });
  }

  return {
    routePolyline: generateSimplePolyline(data.coords, barsCount),
    bars,
    totalDuration: `${Math.floor(barsCount * 45 + Math.random() * 30)} minutes`,
    totalDistance: `${(barsCount * 0.4 + Math.random() * 0.8).toFixed(1)} km`
  };
}

function generateSimplePolyline(baseCoords: { lat: number; lng: number }, barsCount: number): string {
  // Générer une polyline simple mais réaliste
  const points = [];
  for (let i = 0; i <= barsCount + 1; i++) {
    const progress = i / (barsCount + 1);
    points.push({
      lat: baseCoords.lat + progress * 0.01 + (Math.random() - 0.5) * 0.002,
      lng: baseCoords.lng + progress * 0.01 + (Math.random() - 0.5) * 0.002
    });
  }
  
  // Encoder en polyline simplifié
  return encodeSimplePolyline(points);
}

function encodeSimplePolyline(points: Array<{ lat: number; lng: number }>): string {
  // Version simplifiée de l'encodage polyline
  let result = '';
  let prevLat = 0;
  let prevLng = 0;
  
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    
    const deltaLat = lat - prevLat;
    const deltaLng = lng - prevLng;
    
    result += encodeValue(deltaLat);
    result += encodeValue(deltaLng);
    
    prevLat = lat;
    prevLng = lng;
  }
  
  return result;
}

function encodeValue(value: number): string {
  let encoded = value < 0 ? ~(value << 1) : (value << 1);
  let result = '';
  
  while (encoded >= 0x20) {
    result += String.fromCharCode((0x20 | (encoded & 0x1f)) + 63);
    encoded >>= 5;
  }
  result += String.fromCharCode(encoded + 63);
  
  return result;
}

function calculateArrivalTime(startTime: string, barIndex: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  
  // 15 minutes de marche + 45 minutes par bar
  const arrivalMinutes = startMinutes + barIndex * 60 + barIndex * 15;
  
  const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
  const arrivalMins = arrivalMinutes % 60;
  
  return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`;
}