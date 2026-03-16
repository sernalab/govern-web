import { useState, useEffect, useCallback } from 'preact/hooks';

interface RankingRow {
  name: string;
  amount: number;
}

interface DetailData {
  finalitat: string;
  year: string;
  totalImport: number;
  totalCount: number;
  subfinalitats: RankingRow[];
  beneficiaris: RankingRow[];
  organismes: RankingRow[];
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

function DetailPanel({ detail, onClose, domain, dataset }: { detail: DetailData; onClose: () => void; domain: string; dataset: string }) {
  const maxSub = detail.subfinalitats.length > 0 ? detail.subfinalitats[0].amount : 1;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 30px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>{detail.finalitat}</p>
            <p style={{ fontSize: '12px', color: '#71717a' }}>{detail.year === 'Tot' ? 'Total acumulat (2016–2026)' : `Any ${detail.year}`}</p>
          </div>
          <button onClick={onClose} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', flexShrink: 0 }}>
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '12px', border: '1px solid #e4e4e7' }}>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#18181b' }}>{fmtCompact(detail.totalImport)} €</p>
              <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>import concedit</p>
            </div>
            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '12px', border: '1px solid #e4e4e7' }}>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#18181b' }}>{fmtCompact(detail.totalCount)}</p>
              <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>concessions</p>
            </div>
          </div>

          {/* Subfinalitats */}
          {detail.subfinalitats.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Desglos per subfinalitat</p>
              <p style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '10px' }}>On es destina dins d'aquesta categoria</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {detail.subfinalitats.map(s => {
                  const pct = maxSub > 0 ? (s.amount / maxSub) * 100 : 0;
                  return (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', color: '#3f3f46' }}>{s.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#18181b', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(s.amount)} €</span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: '#f4f4f5', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#71717a', borderRadius: '3px', width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top beneficiaris */}
          {detail.beneficiaris.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Qui rep més en aquesta categoria?</p>
              <p style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '10px' }}>Top beneficiaris</p>
              {detail.beneficiaris.map((b, i) => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid #f4f4f5' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', width: '16px', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '12px', color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(b.amount)} €</span>
                </div>
              ))}
            </div>
          )}

          {/* Top organismes */}
          {detail.organismes.length > 0 && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>Organismes concedents</p>
              <p style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '10px' }}>Qui atorga dins d'aquesta finalitat</p>
              {detail.organismes.map((o, i) => (
                <div key={o.name} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid #f4f4f5' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', width: '16px', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '12px', color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(o.amount)} €</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubsidyRankings({ domain, dataset }: Props) {
  const [year, setYear] = useState('2025');
  const [beneficiaris, setBeneficiaris] = useState<RankingRow[]>([]);
  const [organismes, setOrganismes] = useState<RankingRow[]>([]);
  const [finalitats, setFinalitats] = useState<RankingRow[]>([]);
  const [totalImport, setTotalImport] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  async function fetchDetail(finalitat: string) {
    setDetailLoading(true);
    const base = `https://${domain}/resource/${dataset}.json`;
    const yf = year === 'Tot' ? '' : `any_de_la_convocat_ria='${year}' AND `;

    function detailUrl(select: string, group: string, where: string, limit = 8): string {
      const params = new URLSearchParams({
        '$select': select,
        '$group': group,
        '$order': 'total DESC',
        '$limit': String(limit),
        '$where': `${yf}finalitat_p_blica='${finalitat.replace(/'/g, "''")}' AND ${where}`,
      });
      return `${base}?${params.toString()}`;
    }

    try {
      const [subRes, benRes, orgRes, totalRes, countRes] = await Promise.all([
        fetch(detailUrl('subfinalitat,sum(import_subvenci_pr_stec_ajut) as total', 'subfinalitat', 'subfinalitat IS NOT NULL')),
        fetch(detailUrl("ra_social_del_beneficiari,sum(import_subvenci_pr_stec_ajut) as total", 'ra_social_del_beneficiari', "ra_social_del_beneficiari IS NOT NULL AND ra_social_del_beneficiari != 'Benef. no publicable' AND ra_social_del_beneficiari != 'Persona física'")),
        fetch(detailUrl('entitat_oo_aa_o_departament_1,sum(import_subvenci_pr_stec_ajut) as total', 'entitat_oo_aa_o_departament_1', 'entitat_oo_aa_o_departament_1 IS NOT NULL')),
        fetch(`${base}?${new URLSearchParams({ '$select': 'sum(import_subvenci_pr_stec_ajut) as total', '$where': `${yf}finalitat_p_blica='${finalitat.replace(/'/g, "''")}'` }).toString()}`),
        fetch(`${base}?${new URLSearchParams({ '$select': 'count(*) as total', '$where': `${yf}finalitat_p_blica='${finalitat.replace(/'/g, "''")}'` }).toString()}`),
      ]);

      const [subData, benData, orgData, totalData, countData] = await Promise.all([
        subRes.ok ? subRes.json() : [],
        benRes.ok ? benRes.json() : [],
        orgRes.ok ? orgRes.json() : [],
        totalRes.ok ? totalRes.json() : [{ total: '0' }],
        countRes.ok ? countRes.json() : [{ total: '0' }],
      ]);

      setDetail({
        finalitat,
        year,
        totalImport: parseFloat(totalData[0]?.total) || 0,
        totalCount: parseInt(countData[0]?.total) || 0,
        subfinalitats: subData.map((r: Record<string, string>) => ({ name: r.subfinalitat, amount: parseFloat(r.total) || 0 })),
        beneficiaris: benData.map((r: Record<string, string>) => ({ name: r.ra_social_del_beneficiari, amount: parseFloat(r.total) || 0 })),
        organismes: orgData.map((r: Record<string, string>) => ({ name: r.entitat_oo_aa_o_departament_1, amount: parseFloat(r.total) || 0 })),
      });
    } catch {
      // silenced
    } finally {
      setDetailLoading(false);
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
                    <button
                      key={f.name}
                      onClick={() => fetchDetail(f.name)}
                      style={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '12px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#a1a1aa'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#18181b', fontWeight: 500 }}>{f.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(f.amount)} €</span>
                      </div>
                      <div style={{ height: '4px', backgroundColor: '#f4f4f5', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#71717a', borderRadius: '2px', width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                      <p style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '6px' }}>Clica per veure desglos</p>
                    </button>
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

      {detail && <DetailPanel detail={detail} onClose={() => setDetail(null)} domain={domain} dataset={dataset} />}
    </div>
  );
}
