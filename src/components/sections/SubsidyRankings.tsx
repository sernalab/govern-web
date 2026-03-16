import { useState, useEffect } from 'preact/hooks';

interface RankingRow {
  name: string;
  amount: number;
}

interface Props {
  domain: string;
  dataset: string;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + ' K';
  return n.toFixed(0);
}

const YEARS = ['2025', '2024', '2023', '2022', 'Tot'];

export default function SubsidyRankings({ domain, dataset }: Props) {
  const [year, setYear] = useState('2025');
  const [beneficiaris, setBeneficiaris] = useState<RankingRow[]>([]);
  const [organismes, setOrganismes] = useState<RankingRow[]>([]);
  const [finalitats, setFinalitats] = useState<RankingRow[]>([]);
  const [totalImport, setTotalImport] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(year);
  }, [year]);

  async function fetchData(selectedYear: string) {
    setLoading(true);
    const base = `https://${domain}/resource/${dataset}.json`;
    const yf = selectedYear === 'Tot' ? '' : `any_de_la_convocat_ria='${selectedYear}' AND `;

    function buildUrl(select: string, group: string, where: string, limit = 8): string {
      const params = new URLSearchParams({
        '$select': select,
        '$group': group,
        '$order': 'total DESC',
        '$limit': String(limit),
        '$where': `${yf}${where}`,
      });
      return `${base}?${params.toString()}`;
    }

    function buildSimpleUrl(select: string): string {
      const params = new URLSearchParams({ '$select': select });
      if (selectedYear !== 'Tot') params.set('$where', `any_de_la_convocat_ria='${selectedYear}'`);
      return `${base}?${params.toString()}`;
    }

    try {
      const [benRes, orgRes, finRes, totalRes, countRes] = await Promise.all([
        fetch(buildUrl(
          'ra_social_del_beneficiari,sum(import_subvenci_pr_stec_ajut) as total',
          'ra_social_del_beneficiari',
          "ra_social_del_beneficiari IS NOT NULL AND ra_social_del_beneficiari != 'Benef. no publicable' AND ra_social_del_beneficiari != 'Persona física'"
        )),
        fetch(buildUrl(
          'entitat_oo_aa_o_departament_1,sum(import_subvenci_pr_stec_ajut) as total',
          'entitat_oo_aa_o_departament_1',
          'entitat_oo_aa_o_departament_1 IS NOT NULL'
        )),
        fetch(buildUrl(
          'finalitat_p_blica,sum(import_subvenci_pr_stec_ajut) as total',
          'finalitat_p_blica',
          'finalitat_p_blica IS NOT NULL'
        )),
        fetch(buildSimpleUrl('sum(import_subvenci_pr_stec_ajut) as total')),
        fetch(buildSimpleUrl('count(*) as total')),
      ]);

      const [benData, orgData, finData, totalData, countData] = await Promise.all([
        benRes.ok ? benRes.json() : [],
        orgRes.ok ? orgRes.json() : [],
        finRes.ok ? finRes.json() : [],
        totalRes.ok ? totalRes.json() : [{ total: '0' }],
        countRes.ok ? countRes.json() : [{ total: '0' }],
      ]);

      setBeneficiaris(benData.map((r: Record<string, string>) => ({
        name: r.ra_social_del_beneficiari,
        amount: parseFloat(r.total) || 0,
      })));
      setOrganismes(orgData.map((r: Record<string, string>) => ({
        name: r.entitat_oo_aa_o_departament_1,
        amount: parseFloat(r.total) || 0,
      })));
      setFinalitats(finData.map((r: Record<string, string>) => ({
        name: r.finalitat_p_blica,
        amount: parseFloat(r.total) || 0,
      })));
      setTotalImport(parseFloat(totalData[0]?.total) || 0);
      setTotalCount(parseInt(countData[0]?.total) || 0);
    } catch {
      // silenced
    } finally {
      setLoading(false);
    }
  }

  const yearLabel = year === 'Tot' ? 'Total acumulat (2016–2026)' : `Any ${year}`;

  return (
    <div>
      {/* Year selector + summary */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Subvencions</h2>
          <p style={{ fontSize: '12px', color: '#71717a' }}>{yearLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '3px' }}>
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: year === y ? 600 : 400,
                color: year === y ? '#18181b' : '#71717a',
                backgroundColor: year === y ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: year === y ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {y === 'Tot' ? 'Tot' : y}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '14px', border: '1px solid #e4e4e7' }}>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#18181b' }}>
            {loading ? '...' : fmtCompact(totalImport) + ' €'}
          </p>
          <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>import concedit</p>
        </div>
        <div style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '14px', border: '1px solid #e4e4e7' }}>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#18181b' }}>
            {loading ? '...' : fmtCompact(totalCount)}
          </p>
          <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>concessions</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 20, height: 20, border: '2px solid #e4e4e7', borderTopColor: '#18181b', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto' }} />
          <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '8px' }}>Carregant dades de {yearLabel}...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Finalitats */}
          {finalitats.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>On van les subvencions?</h3>
              <p style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '12px' }}>Distribució per finalitat pública</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                {finalitats.map(f => {
                  const pct = finalitats[0].amount > 0 ? (f.amount / finalitats[0].amount) * 100 : 0;
                  return (
                    <div key={f.name} style={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#18181b', fontWeight: 500 }}>{f.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(f.amount)} €</span>
                      </div>
                      <div style={{ height: '4px', backgroundColor: '#f4f4f5', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#a1a1aa', borderRadius: '2px', width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rankings side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {beneficiaris.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Qui rep més?</h3>
                <p style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '12px' }}>Top beneficiaris per import</p>
                {beneficiaris.map((b, i) => (
                  <div key={b.name} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: '#a1a1aa', width: '16px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                      <span style={{ fontSize: '13px', color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(b.amount)} €</span>
                  </div>
                ))}
              </div>
            )}

            {organismes.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Qui concedeix més?</h3>
                <p style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '12px' }}>Top organismes per volum atorgat</p>
                {organismes.map((o, i) => (
                  <div key={o.name} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f4f4f5' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: '#a1a1aa', width: '16px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                      <span style={{ fontSize: '13px', color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(o.amount)} €</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <p style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '20px' }}>
        Font: RAISC (Registre de subvencions i ajuts de Catalunya) · {yearLabel} · Dades en temps real des de l'API
      </p>
    </div>
  );
}
