import { useState, useEffect } from 'preact/hooks';

interface Slide {
  topLabel: string;
  headline: string;
  stat: string;
  statLabel: string;
  description: string;
  cta: string;
  ctaLink: string;
}

interface Props {
  slides: Slide[];
}

export default function HeroSlider({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(i => (i + 1) % slides.length);
        setFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  function goTo(i: number) {
    if (i === current) return;
    setFade(false);
    setTimeout(() => {
      setCurrent(i);
      setFade(true);
    }, 300);
  }

  const slide = slides[current];

  return (
    <section style={{ backgroundColor: '#09090b', color: 'white', minHeight: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '64px 24px', width: '100%' }}>
        <div style={{
          opacity: fade ? 1 : 0,
          transform: fade ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
          <p style={{ color: '#71717a', fontSize: '11px', fontWeight: 500, marginBottom: '20px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {slide.topLabel}
          </p>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '20px', maxWidth: '600px' }}>
            {slide.headline}
          </h1>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 700, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
              {slide.stat}
            </span>
            <span style={{ fontSize: '16px', color: '#a1a1aa', marginLeft: '10px' }}>
              {slide.statLabel}
            </span>
          </div>

          <p style={{ fontSize: '14px', color: '#52525b', maxWidth: '480px', lineHeight: 1.6, marginBottom: '28px' }}>
            {slide.description}
          </p>

          <a
            href={slide.ctaLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#18181b',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f4f4f5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; }}
          >
            {slide.cta}
          </a>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '40px' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: i === current ? 'white' : '#27272a',
                cursor: 'pointer',
                transition: 'all 0.3s',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
