import { useState, useEffect, useCallback } from 'preact/hooks';

interface Trip {
  nom_i_cognoms: string;
  c_rrec: string;
  departament: string;
  destinaci: string;
  motiu: string;
  agenda: string;
  inici_viatge: string;
  fi_viatge: string;
  dietes_i_manutenci: string;
  allotjament: string;
  transport: string;
  altres_despeses: string;
  total_despeses: string;
  comitiva: string;
}

interface TripProfileProps {
  domain: string;
  dataset: string;
}

function safeNum(v: string | undefined | null): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function fmtCurrency(n: number): string {
  if (n === 0) return '0 €';
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function fmtDate(d: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

export default function TripProfile({ domain, dataset }: TripProfileProps) {
  const [personName, setPersonName] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrips = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const url = `https://${domain}/resource/${dataset}.json?$where=nom_i_cognoms='${name.replace(/'/g, "''")}'&$order=inici_viatge DESC&$limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data: Trip[] = await res.json();
        setTrips(data);
      }
    } catch {
      // silenced
    } finally {
      setLoading(false);
    }
  }, [domain, dataset]);

  useEffect(() => {
    if (personName) fetchTrips(personName);
  }, [personName, fetchTrips]);

  // Listen for custom events from the page
  useEffect(() => {
    function handleOpen(e: Event) {
      const name = (e as CustomEvent).detail;
      if (name) {
        setPersonName(name);
      }
    }
    window.addEventListener('trip-profile-open', handleOpen);
    return () => window.removeEventListener('trip-profile-open', handleOpen);
  }, []);

  if (!personName) return null;

  // Aggregate data
  const totalSpent = trips.reduce((s, t) => s + safeNum(t.total_despeses), 0);
  const totalDietes = trips.reduce((s, t) => s + safeNum(t.dietes_i_manutenci), 0);
  const totalHotel = trips.reduce((s, t) => s + safeNum(t.allotjament), 0);
  const totalTransport = trips.reduce((s, t) => s + safeNum(t.transport), 0);
  const totalAltres = trips.reduce((s, t) => s + safeNum(t.altres_despeses), 0);

  const maxCat = Math.max(totalDietes, totalHotel, totalTransport, totalAltres, 1);

  const categories = [
    { label: 'Transport', value: totalTransport, color: '#18181b' },
    { label: 'Allotjament', value: totalHotel, color: '#3f3f46' },
    { label: 'Dietes', value: totalDietes, color: '#71717a' },
    { label: 'Altres', value: totalAltres, color: '#a1a1aa' },
  ].filter(c => c.value > 0);

  // Destinations
  const destMap = new Map<string, number>();
  for (const t of trips) {
    if (t.destinaci) destMap.set(t.destinaci, (destMap.get(t.destinaci) || 0) + 1);
  }
  const topDest = [...destMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cargo = trips[0]?.c_rrec || '';
  const dept = trips[0]?.departament || '';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) setPersonName(null); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'white',
          height: '100%',
          overflowY: 'auto',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>{personName}</p>
            <p style={{ fontSize: '12px', color: '#71717a' }}>{cargo}</p>
            <p style={{ fontSize: '11px', color: '#a1a1aa' }}>{dept}</p>
          </div>
          <button
            onClick={() => setPersonName(null)}
            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', flexShrink: 0 }}
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: 20, height: 20, border: '2px solid #e4e4e7', borderTopColor: '#18181b', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto' }} />
            <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '8px' }}>Carregant viatges...</p>
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#fafafa', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#18181b' }}>{trips.length}</p>
                <p style={{ fontSize: '11px', color: '#71717a' }}>viatges</p>
              </div>
              <div style={{ background: '#fafafa', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#18181b' }}>{fmtCurrency(totalSpent)}</p>
                <p style={{ fontSize: '11px', color: '#71717a' }}>despesa total</p>
              </div>
            </div>

            {/* Spending breakdown */}
            {categories.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '12px' }}>Desglos de despeses</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.map(cat => (
                    <div key={cat.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', color: '#71717a' }}>{cat.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#18181b' }}>{fmtCurrency(cat.value)}</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#f4f4f5', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: cat.color, borderRadius: '3px', width: `${(cat.value / maxCat) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top destinations */}
            {topDest.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>Destinacions</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {topDest.map(([dest, count]) => (
                    <span key={dest} style={{ fontSize: '11px', backgroundColor: '#f4f4f5', color: '#3f3f46', padding: '4px 8px', borderRadius: '4px' }}>
                      {dest} <span style={{ color: '#a1a1aa' }}>({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trip list */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>Tots els viatges</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trips.map((trip, i) => (
                  <div key={i} style={{ borderRadius: '8px', border: '1px solid #e4e4e7', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#18181b' }}>{trip.destinaci || 'Sense destinació'}</p>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', flexShrink: 0 }}>{fmtCurrency(safeNum(trip.total_despeses))}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {trip.motiu}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#a1a1aa' }}>
                      <span>{fmtDate(trip.inici_viatge)}</span>
                      {safeNum(trip.allotjament) > 0 && <span>Hotel: {fmtCurrency(safeNum(trip.allotjament))}</span>}
                      {safeNum(trip.transport) > 0 && <span>Transport: {fmtCurrency(safeNum(trip.transport))}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
