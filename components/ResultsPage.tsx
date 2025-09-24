'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import GoogleMap from '@/components/GoogleMap';
import Timeline from '@/components/Timeline';
import { RefreshCw, Share2, ArrowLeft } from 'lucide-react';

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
}

interface CrawlData {
  routePolyline: string;
  bars: Bar[];
  totalDuration: string;
  totalDistance: string;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);

  // Paramètres par défaut pour pouvoir tester sans formulaire
  const start = searchParams.get('start') || 'République, Lille';
  const end = searchParams.get('end') || 'Gare Lille Flandres, Lille';
  const barsCount = searchParams.get('barsCount') || '4';
  const startTime = searchParams.get('startTime') || '20:00';
  const mode = searchParams.get('mode') || 'rating';

  useEffect(() => {
    generateCrawl();
  }, [start, end, barsCount, startTime]);

  const generateCrawl = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start,
          end,
          barsCount: parseInt(barsCount!),
          startTime, 
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du parcours');
      }

      const data = await response.json();
      setCrawlData(data);

      // Save to localStorage
      localStorage.setItem('lastCrawl', JSON.stringify({
        params: { start, end, barsCount, startTime },
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setIsLoading(true);
    setError(null);
    generateCrawl();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: 'Mon Barathon Planner',
        text: 'Regarde ce super parcours de bars que j\'ai créé !',
        url: url,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      alert('Lien copié dans le presse-papiers !');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Génération de ton barathon...</h2>
          <p className="text-gray-400">On trouve les meilleurs bars sur ta route !</p>
        </div>
      </div>
    );
  }

  if (error || !crawlData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center bg-black/40 border-red-500/30">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Oops ! 😅</h2>
          <p className="text-gray-300 mb-6">
            {error || 'Impossible de générer ton barathon. Essaie avec d\'autres adresses !'}
          </p>
          <Button onClick={() => router.push('/')} className="bg-purple-500 hover:bg-purple-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-sm p-4 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ton Barathon est prêt ! 🎉
            </h1>
            <p className="text-gray-400 text-sm">
              {crawlData.bars.length} bars • {crawlData.totalDistance} • {crawlData.totalDuration}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regénérer
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-pink-500/50 text-pink-300 hover:bg-pink-500/20"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Map Section */}
        <div className="lg:w-1/2 h-[400px] lg:h-[calc(100vh-80px)]">     
          <GoogleMap
            bars={crawlData.bars}
            routePolyline={crawlData.routePolyline}
            start={start!}
            end={end!}
            selectedBarId={selectedBarId}
          />
        </div>

        {/* Timeline Section */}
        <div className="lg:w-1/2 p-4 lg:p-6 bg-black/20 overflow-y-auto">
          <Timeline 
              bars={crawlData.bars} 
              startTime={startTime!} 
              onSelectBar={(barId) => setSelectedBarId(barId)} 
            />
        </div>
      </div>
    </div>
  );
}