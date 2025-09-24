'use client';

import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function TimeInput({ value, onChange, className }: TimeInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
}