'use client';

/**
 * PicknbuildBrand component renders the branded "picknbuild" text
 * with the "n" displayed in red color
 */
export default function PicknbuildBrand({ 
  fontSize = '14px', 
  fontWeight = '600',
  className = '',
  style = {}
}: { 
  fontSize?: string; 
  fontWeight?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      pick
      <span style={{ color: '#dc2626' }}>n</span>
      build
    </span>
  );
}
