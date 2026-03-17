import { useState, useEffect } from 'preact/hooks';

interface Slide {
  icon: string;
  stat: string;
  label: string;
  detail: string;
  link?: string;
}

interface Props {
  slides: Slide[];
}

export default function DataSlider({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(i => (i + 1) % slides.length);
        setFade(true);
      }, 200);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[current];

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: '#18181b',
          borderRadius: '10px',
          border: '1px solid #27272a',
          opacity: fade ? 1 : 0,
          transform: fade ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          minHeight: '72px',
        }}
      >
        <span style={{ fontSize: '28px', flexShrink: 0 }}>{slide.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'white', fontVariantNumeric: 'tabular-nums' }}>{slide.stat}</span>
            <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{slide.label}</span>
          </div>
          <p style={{ fontSize: '11px', color: '#52525b', marginTop: '2px' }}>{slide.detail}</p>
        </div>
        {slide.link && (
          <a
            href={slide.link}
            style={{ fontSize: '11px', color: '#71717a', textDecoration: 'none', flexShrink: 0, padding: '4px 8px', borderRadius: '6px', border: '1px solid #27272a' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#52525b'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#27272a'; }}
          >
            Veure &rarr;
          </a>
        )}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 200); }}
            style={{
              width: i === current ? '16px' : '6px',
              height: '6px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: i === current ? '#71717a' : '#27272a',
              cursor: 'pointer',
              transition: 'all 0.2s',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
