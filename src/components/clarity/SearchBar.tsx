'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
        <input
          type="text"
          placeholder="Search for a car (e.g. Toyota Camry 2018)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <p className="text-sm text-secondary text-center">
        See every way to get this car — and what each one actually costs
      </p>
    </div>
  );
}
