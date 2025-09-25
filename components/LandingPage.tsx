'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import LocationInput from '@/components/LocationInput';
import TimeInput from '@/components/TimeInput';
import { MapPin, Clock, Users } from 'lucide-react';
import TimePicker from 'react-time-picker';

export default function LandingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    start: '',
    end: '',
    barsCount: 4,
    startTime: '20:00',
    mode: 'shortest' // défaut
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const params = new URLSearchParams({
        start: formData.start,
        end: formData.end,
        barsCount: formData.barsCount.toString(),
        startTime: formData.startTime,
        mode: formData.mode
      });
      
      router.push(`/results?${params.toString()}`);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = formData.start && formData.end && formData.start !== formData.end;
  // const times = Array.from({ length: 12 }, (_, i) => `${(20 + i) % 24}:00`)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            Ton Barathon Parfait 🍻
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Crée ton parcours de bars parfait entre deux adresses
          </p>
          <p className="text-gray-400">
            On s'occupe de trouver les meilleurs bars sur ta route !
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-black/40 border-purple-500/30 shadow-2xl shadow-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Planifie ton parcours</CardTitle>
            <CardDescription className="text-gray-300">
              Remplis les infos ci-dessous pour générer ton barathon personnalisé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="start" className="text-white flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    Point de départ
                  </Label>
                  <LocationInput
                    id="start"
                    placeholder="D'où pars-tu ? (ex: République, Lille)"
                    value={formData.start}
                    onChange={(value) => setFormData(prev => ({ ...prev, start: value }))}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="end" className="text-white flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    Point d'arrivée
                  </Label>
                  <LocationInput
                    id="end"
                    placeholder="Où veux-tu finir ? (ex: Gare Lille Flandres)"
                    value={formData.end}
                    onChange={(value) => setFormData(prev => ({ ...prev, end: value }))}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label className="text-white flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-purple-400" />
                    Nombre de bars: {formData.barsCount}
                  </Label>
                  <Slider
                    value={[formData.barsCount]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, barsCount: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>1 bar</span>
                    <span>10 bars</span>
                  </div>
                </div>
                {/* <div>
                  <Label className="text-white flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    Heure de départ
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-gray-800 border-gray-600 text-white"
                      >
                        {formData.startTime || "Choisis une heure"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-black/90 text-white border-gray-700">
                      <div className="max-h-60 overflow-y-auto">
                        {times.map((time) => (
                          <button
                            key={time}
                            className={`w-full px-4 py-2 text-left hover:bg-purple-600/30 ${
                              formData.startTime === time ? "bg-purple-600/50" : ""
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, startTime: time }))}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div> */}
                <div>
                  <Label className="text-white flex items-center gap-2 mb-2">
                    Mode de sélection des bars
                  </Label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                    className="w-full bg-gray-800 border-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="shortest">Le plus optimisé</option>
                    <option value="rating">Meilleure note ⭐</option>
                    <option value="price">Le moins cher 💸</option>
                  </select>
                </div>

              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="animate-pulse">Recherche des meilleurs bars...</span>
                  </div>
                ) : (
                  "J'ai soif !"
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 animate-pulse"></div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}