'use client';

import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useLoadGoogleMaps } from '@/hooks/useLoadGoogleMaps';

interface LocationInputProps {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function LocationInput({ id, placeholder, value, onChange, className }: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const loaded = useLoadGoogleMaps();

  useEffect(() => {
    if (!loaded || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'fr' },
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) onChange(place.formatted_address);
      else if (place.name) onChange(place.name);
    });
  }, [loaded]);

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      autoComplete="off"
    />
  );
}
