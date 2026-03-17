import { useState, useRef, useCallback, useEffect } from 'preact/hooks';

interface ContractRow {
  descripcio_expedient: string;
  import_adjudicacio: string;
  data_adjudicacio: string;
  organisme_contractant: string;
  tipus_contracte: string;
}

interface SubsidyRow {
  objecte_de_la_convocat_ria: string;
  import_subvenci_pr_stec_ajut: string;
  data_concessi: string;
  entitat_oo_aa_o_departament_1: string;
  finalitat_p_blica: string;
}

interface EntityData {
  name: string;
  contracts: ContractRow[];
  contractTotal: number;
  contractCount: number;
  subsidies: SubsidyRow[];
  subsidyTotal: number;
  subsidyCount: number;
}

interface Suggestion {
  name: string;
  source: 'contract' | 'subsidy';
}

const EQUIVALENCES = [
  { label: 'T-jove de transport', amount: 176, icon: '🚇' },
  { label: 'lots de llibres escolars', amount: 300, icon: '📚' },
  { label: 'beques universitàries', amount: 6000, icon: '🎓' },
  { label: 'sous de mestre', amount: 42000, icon: '👩‍🏫' },
  { label: 'sous de Mosso d\'Esquadra', amount: 45000, icon: '👮' },
  { label: 'habitatges socials', amount: 180000, icon: '🏠' },
  { label: 'km de carril bici', amount: 200000, icon: '🚲' },
  { label: 'escoles noves', amount: 5500000, icon: '🏫' },
];

function getEquivalences(total: number) {
  if (total <= 0) return [];
  const valid = EQUIVALENCES
    .map(eq => ({ ...eq, qty: Math.floor(total / eq.amount) }))
    .filter(eq => eq.qty >= 1 && eq.qty <= 10_000_000)
    .sort((a, b) => a.amount - b.amount);
  if (valid.length < 3) return valid.map(e => ({ icon: e.icon, text: `${fmtNum(e.qty)} ${e.label}` }));
  return [valid[0], valid[Math.floor(valid.length / 2)], valid[valid.length - 1]]
    .map(e => ({ icon: e.icon, text: `${fmtNum(e.qty)} ${e.label}` }));
}

function fmtNum(n: number): string { return n.toLocaleString('ca-ES'); }
function fmtCompact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + ' B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + ' K';
  return n.toFixed(0);
}
function fmtCurrency(n: number): string {
  if (isNaN(n)) return '---';
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(n);
}
function fmtDate(d: string): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('ca-ES', { month: 'short', year: 'numeric' }); } catch { return d; }
}
function safeNum(v: string | undefined | null): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

interface Props {
  contractDataset: string;
  subsidyDataset: string;
  domain: string;
}

// Cache for suggestions and entity data
const suggestCache = new Map<string, Suggestion[]>();
const entityCache = new Map<string, EntityData>();

export default function EntitySearch({ contractDataset, subsidyDataset, domain }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fast autocomplete — only fetch distinct names
  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 2) { setSuggestions([]); return; }

    const cacheKey = text.toLowerCase();
    if (suggestCache.has(cacheKey)) {
      setSuggestions(suggestCache.get(cacheKey)!);
      setShowSuggestions(true);
      return;
    }

    setSuggestLoading(true);
    const base = `https://${domain}/resource/`;
    const escaped = text.replace(/'/g, "''");

    try {
      // Fast queries: only distinct names + count, limited to 6 results each
      const [contractNames, subsidyNames] = await Promise.all([
        fetch(`${base}${contractDataset}.json?${new URLSearchParams({
          '$select': 'adjudicatari, count(*) as total',
          '$where': `upper(adjudicatari) like upper('%${escaped}%')`,
          '$group': 'adjudicatari',
          '$order': 'total DESC',
          '$limit': '6',
        })}`).then(r => r.ok ? r.json() : []),
        fetch(`${base}${subsidyDataset}.json?${new URLSearchParams({
          '$select': 'ra_social_del_beneficiari, count(*) as total',
          '$where': `upper(ra_social_del_beneficiari) like upper('%${escaped}%') AND ra_social_del_beneficiari != 'Benef. no publicable' AND ra_social_del_beneficiari != 'Persona física'`,
          '$group': 'ra_social_del_beneficiari',
          '$order': 'total DESC',
          '$limit': '6',
        })}`).then(r => r.ok ? r.json() : []),
      ]);

      // Merge and deduplicate
      const seen = new Set<string>();
      const results: Suggestion[] = [];

      for (const r of contractNames) {
        const name = r.adjudicatari;
        if (name && !seen.has(name.toUpperCase())) {
          seen.add(name.toUpperCase());
          results.push({ name, source: 'contract' });
        }
      }
      for (const r of subsidyNames) {
        const name = r.ra_social_del_beneficiari;
        if (name && !seen.has(name.toUpperCase())) {
          seen.add(name.toUpperCase());
          results.push({ name, source: 'subsidy' });
        }
      }

      const final = results.slice(0, 8);
      suggestCache.set(cacheKey, final);
      setSuggestions(final);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, [domain, contractDataset, subsidyDataset]);

  // Full entity data load — only when user selects
  const loadEntity = useCallback(async (name: string) => {
    setShowSuggestions(false);
    setQuery(name);

    if (entityCache.has(name)) {
      setEntity(entityCache.get(name)!);
      return;
    }

    setLoading(true);
    const base = `https://${domain}/resource/`;
    const escaped = name.replace(/'/g, "''");

    try {
      const [contractsRes, contractStatsRes, subsidiesRes, subsidyStatsRes] = await Promise.all([
        fetch(`${base}${contractDataset}.json?${new URLSearchParams({
          '$where': `adjudicatari='${escaped}'`,
          '$order': 'data_adjudicacio DESC',
          '$limit': '20',
        })}`),
        fetch(`${base}${contractDataset}.json?${new URLSearchParams({
          '$select': 'count(*) as total, sum(import_adjudicacio) as import_total',
          '$where': `adjudicatari='${escaped}'`,
        })}`),
        fetch(`${base}${subsidyDataset}.json?${new URLSearchParams({
          '$where': `ra_social_del_beneficiari='${escaped}'`,
          '$order': 'data_concessi DESC',
          '$limit': '20',
        })}`),
        fetch(`${base}${subsidyDataset}.json?${new URLSearchParams({
          '$select': 'count(*) as total, sum(import_subvenci_pr_stec_ajut) as import_total',
          '$where': `ra_social_del_beneficiari='${escaped}'`,
        })}`),
      ]);

      const [contracts, contractStats, subsidies, subsidyStats] = await Promise.all([
        contractsRes.ok ? contractsRes.json() : [],
        contractStatsRes.ok ? contractStatsRes.json() : [{}],
        subsidiesRes.ok ? subsidiesRes.json() : [],
        subsidyStatsRes.ok ? subsidyStatsRes.json() : [{}],
      ]);

      const data: EntityData = {
        name,
        contracts,
        contractTotal: safeNum(contractStats[0]?.import_total),
        contractCount: parseInt(contractStats[0]?.total || '0', 10),
        subsidies,
        subsidyTotal: safeNum(subsidyStats[0]?.import_total),
        subsidyCount: parseInt(subsidyStats[0]?.total || '0', 10),
      };

      entityCache.set(name, data);
      setEntity(data);
    } catch {
      setEntity(null);
    } finally {
      setLoading(false);
    }
  }, [domain, contractDataset, subsidyDataset]);

  function handleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    setQuery(val);
    if (timeout.current) clearTimeout(timeout.current);
    if (val.length >= 2) {
      timeout.current = setTimeout(() => fetchSuggestions(val), 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (suggestions.length > 0) {
      loadEntity(suggestions[0].name);
    } else if (query.length >= 2) {
      fetchSuggestions(query);
    }
  }

  const grandTotal = entity ? entity.contractTotal + entity.subsidyTotal : 0;
  const equivalences = entity ? getEquivalences(grandTotal) : [];

  return (
    <div>
      {/* Search with autocomplete */}
      <div ref={wrapperRef} style={{ position: 'relative', maxWidth: '500px', marginBottom: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#a1a1aa' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onInput={handleInput}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Cerca una empresa, entitat o ajuntament..."
              style={{
                width: '100%', padding: '14px 16px 14px 44px', fontSize: '15px',
                border: '1px solid #e4e4e7', borderRadius: '10px', outline: 'none',
                color: '#18181b', backgroundColor: 'white',
              }}
            />
            {(suggestLoading || loading) && (
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <div style={{ width: 18, height: 18, border: '2px solid #e4e4e7', borderTopColor: '#18181b', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              </div>
            )}
          </div>
        </form>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
            backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)', zIndex: 50, overflow: 'hidden',
          }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => loadEntity(s.name)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                  border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px',
                  color: '#18181b', borderBottom: i < suggestions.length - 1 ? '1px solid #f4f4f5' : 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#fafafa'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: '#a1a1aa', flexShrink: 0 }}>
                  {s.source === 'contract' ? 'contractes' : 'subvencions'}
                </span>
              </button>
            ))}
          </div>
        )}

        <p style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '6px' }}>
          Escriu mínim 2 caràcters. Selecciona del desplegable per veure el detall.
        </p>
      </div>

      {/* Loading full entity */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 20, height: 20, border: '2px solid #e4e4e7', borderTopColor: '#18181b', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto' }} />
          <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '8px' }}>Carregant dades de l'entitat...</p>
        </div>
      )}

      {/* Entity results */}
      {!loading && entity && (entity.contractCount > 0 || entity.subsidyCount > 0) && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>{entity.name}</h2>
            <p style={{ fontSize: '12px', color: '#a1a1aa' }}>
              Dades acumulades · Font: Transparència Catalunya (Socrata)
            </p>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px' }}>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#18181b' }}>{fmtCompact(grandTotal)} €</p>
              <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>total rebut</p>
            </div>
            {entity.contractCount > 0 && (
              <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#18181b' }}>{fmtCompact(entity.contractTotal)} €</p>
                <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>{fmtNum(entity.contractCount)} contractes</p>
              </div>
            )}
            {entity.subsidyCount > 0 && (
              <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, color: '#18181b' }}>{fmtCompact(entity.subsidyTotal)} €</p>
                <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>{fmtNum(entity.subsidyCount)} subvencions</p>
              </div>
            )}
          </div>

          {/* Equivalences */}
          {equivalences.length > 0 && (
            <div style={{ marginBottom: '28px', padding: '16px', backgroundColor: '#f4f4f5', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '10px' }}>Això equival a...</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {equivalences.map((eq, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'white', borderRadius: '8px', padding: '6px 10px', border: '1px solid #e4e4e7', fontSize: '13px', color: '#18181b', fontWeight: 500 }}>
                    {eq.icon} {eq.text}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '8px' }}>
                Equivalències orientatives basades en costos mitjans públics de Catalunya
              </p>
            </div>
          )}

          {/* Contracts */}
          {entity.contracts.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Contractes</h3>
              <p style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '12px' }}>Últims 20 contractes · D'on vénen els diners</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {entity.contracts.map((c, i) => (
                  <div key={i} style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '13px', color: '#18181b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                        {c.descripcio_expedient || 'Sense descripció'}
                      </p>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtCurrency(safeNum(c.import_adjudicacio))}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#a1a1aa', flexWrap: 'wrap' }}>
                      <span>{c.organisme_contractant}</span>
                      {c.data_adjudicacio && <span>· {fmtDate(c.data_adjudicacio)}</span>}
                      {c.tipus_contracte && <span>· {c.tipus_contracte.replace(/^\d+\.\s*/, '')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subsidies */}
          {entity.subsidies.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Subvencions</h3>
              <p style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '12px' }}>Últimes 20 subvencions · Qui les atorga</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {entity.subsidies.map((s, i) => (
                  <div key={i} style={{ border: '1px solid #e4e4e7', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontSize: '13px', color: '#18181b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                        {s.objecte_de_la_convocat_ria || 'Sense descripció'}
                      </p>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtCurrency(safeNum(s.import_subvenci_pr_stec_ajut))}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#a1a1aa', flexWrap: 'wrap' }}>
                      <span>{s.entitat_oo_aa_o_departament_1}</span>
                      {s.data_concessi && <span>· {fmtDate(s.data_concessi)}</span>}
                      {s.finalitat_p_blica && <span>· {s.finalitat_p_blica}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '20px' }}>
            Font: RAISC i Registre públic de contractes · Transparència Catalunya (Socrata) · Dades en temps real
          </p>
        </div>
      )}

      {/* No results */}
      {!loading && entity && entity.contractCount === 0 && entity.subsidyCount === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '14px', color: '#3f3f46' }}>No s'han trobat resultats per "{entity.name}"</p>
          <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '4px' }}>Prova amb el nom complet de l'empresa o entitat</p>
        </div>
      )}
    </div>
  );
}
