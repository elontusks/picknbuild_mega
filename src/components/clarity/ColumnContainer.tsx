'use client';

import { ReactNode } from 'react';

interface ColumnContainerProps {
  title: string | ReactNode;
  subtitle: string;
  description: string;
  children: ReactNode;
  highlighted?: boolean;
}

export default function ColumnContainer({
  title,
  subtitle,
  description,
  children,
  highlighted = false,
}: ColumnContainerProps) {
  return (
    <div
      className={`flex flex-col gap-4 p-4 rounded-lg border ${highlighted ? 'highlight-card' : ''}`}
      style={highlighted ? { borderColor: '#00cc99', backgroundColor: 'rgba(240, 255, 250, 1)' } : { borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
    >
      {/* Header */}
      <div className="border-b pb-3" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
          {title}
        </h2>
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          {subtitle}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
