'use client';

import BarCard from '@/components/BarCard';

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

interface TimelineProps {
  bars: Bar[];
  startTime: string;
  onSelectBar: (barId: string) => void;
}

export default function Timeline({ bars, startTime, onSelectBar }: TimelineProps) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Planning de la soirée</h2>
        <p className="text-gray-400">
          Ton barathon commence à {startTime} • 45min par bar
        </p>
      </div>

      <div className="space-y-4">
        {bars.map((bar, index) => (
          <div key={bar.id} className="relative">
            {/* Timeline connector */}
            {index < bars.length - 1 && (
              <div className="absolute left-8 top-16 w-0.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500" />
            )}
            
            <BarCard 
              bar={bar} 
              index={index}
              isFirst={index === 0}
              isLast={index === bars.length - 1}
              onSelect={() => onSelectBar(bar.id)}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg border border-purple-500/30">
        <h3 className="text-white font-bold mb-2">🍻 Conseils pour un barathon réussi</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Bois de l'eau entre chaque bar</li>
          <li>• Mange quelque chose avant de commencer</li>
          <li>• Garde un œil sur tes amis</li>
          <li>• Prévois ton transport de retour</li>
        </ul>
      </div>
    </div>
  );
}