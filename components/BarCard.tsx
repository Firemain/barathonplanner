'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, Star, Users } from 'lucide-react';

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

interface BarCardProps {
  bar: Bar;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
  onSelect?: () => void;
}

export default function BarCard({ bar, index, isFirst, isLast, onSelect }: BarCardProps) {
  const getBarTypeIcon = (index: number, isFirst: boolean, isLast: boolean) => {
    if (isFirst) return '🟢';
    if (isLast) return '🏁';
    return '🍺';
  };

  const getBarTypeLabel = (index: number, isFirst: boolean, isLast: boolean) => {
    if (isFirst) return 'Début';
    if (isLast) return 'Fin';
    return `Bar ${index + 1}`;
  };

  return (
    <Card 
  onClick={onSelect}
  className="cursor-pointer backdrop-blur-sm bg-black/40 border-purple-500/30 hover:border-pink-500/50 transition-all duration-300"
>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Time and Icon */}
          <div className="flex flex-col items-center min-w-[60px]">
            <div className="text-2xl mb-1">
              {getBarTypeIcon(index, isFirst!, isLast!)}
            </div>
            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">
              {getBarTypeLabel(index, isFirst!, isLast!)}
            </Badge>
            <div className="text-sm font-bold text-yellow-400 mt-1">
              {bar.estimatedArrivalTime}
            </div>
          </div>

          {/* Bar Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-white">{bar.name}</h3>
              <Button
                size="sm"
                variant="outline"
                className="border-pink-500/50 text-pink-300 hover:bg-pink-500/20"
                onClick={() => window.open(bar.googleMapsLink, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Maps
              </Button>
            </div>

            <p className="text-gray-400 text-sm mb-3">{bar.address}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {bar.rating > 0 && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{bar.rating}</span>
                  <span className="text-xs text-gray-400">
                    ({bar.userRatingsTotal} avis)
                  </span>
                </div>
              )}

              {bar.openingHours && (
                <div className="flex items-center gap-1 text-green-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">{bar.openingHours}</span>
                </div>
              )}
            </div>

            {isFirst && (
              <div className="text-xs text-gray-500 bg-green-900/30 p-2 rounded">
                🚀 C'est parti ! Commence ton barathon ici
              </div>
            )}

            {isLast && (
              <div className="text-xs text-gray-500 bg-red-900/30 p-2 rounded">
                🏁 Dernière étape de ton parcours épique !
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}