import { useRef, useEffect, useState, useCallback } from 'preact/hooks';

interface Column {
  key: string;
  label: string;
  format?: 'currency' | 'date' | 'text';
}

type DataSource = 'socrata' | 'bdns';

interface DataExplorerProps {
  title: string;
  dataset: string;
  domain?: string;
  dataSource?: DataSource;
  columns: Column[];
  searchField: string;
  defaultOrder?: string;
  pageSize?: number;
}

const FIELD_LABELS: Record<string, string> = {
  // Contracts
  situaci_contractual: 'Situació contractual',
  exercici: 'Exercici',
  subjecte_ambit: 'Àmbit',
  agrupacio_organisme: 'Departament',
  id_agrupacio_organisme: 'ID departament',
  id_organisme_contractant: 'ID organisme',
  organisme_contractant: 'Organisme contractant',
  codi_expedient: 'Codi expedient',
  procediment_adjudicacio: 'Procediment',
  tipus_contracte: 'Tipus de contracte',
  descripcio_expedient: 'Descripció',
  contracte: 'Contracte',
  numero_lot: 'Lot',
  codi_cpv: 'Codi CPV',
  adjudicatari: 'Adjudicatari',
  import_adjudicacio: 'Import adjudicació',
  data_adjudicacio: 'Data adjudicació',
  lot_desert: 'Lot desert',
  dies_durada: 'Dies durada',
  mesos_durada: 'Mesos durada',
  anys_durada: 'Anys durada',
  // Subsidies
  clau: 'Clau',
  codi_raisc: 'Codi RAISC',
  codi_bdns: 'Codi BDNS',
  discriminador_de_la_concessi: 'Discriminador concessió',
  objecte_de_la_convocat_ria: 'Objecte convocatòria',
  t_tol_convocat_ria_catal: 'Títol (català)',
  t_tol_convocat_ria_castell: 'Títol (castellà)',
  bases_reguladores_url_catal: 'Bases reguladores',
  bases_reguladores_url_castell: 'Bases reguladores (ES)',
  ra_social_del_beneficiari: 'Beneficiari',
  cif_beneficiari: 'CIF beneficiari',
  import_subvenci_pr_stec_ajut: 'Import subvenció',
  import_ajuda_equivalent: 'Import ajuda equivalent',
  data_concessi: 'Data concessió',
  entitat_oo_aa_o_departament: 'Entitat (codi)',
  entitat_oo_aa_o_departament_1: 'Entitat',
  any_de_la_convocat_ria: 'Any convocatòria',
  subfinalitat_codi: 'Subfinalitat (codi)',
  subfinalitat: 'Subfinalitat',
  finalitat_rais_codi: 'Finalitat RAIS (codi)',
  finalitat_rais: 'Finalitat RAIS',
  finalitat_p_blica_codi: 'Finalitat pública (codi)',
  finalitat_p_blica: 'Finalitat pública',
  tipus_d_instument_d_ajut: 'Instrument (codi)',
  tipus_d_instument_d_ajut_1: 'Instrument d\'ajut',
  aplicaci_pressupost_ria: 'Aplicació pressupostària',
  tipus_de_beneficiaris_codi: 'Tipus beneficiari (codi)',
  tipus_de_beneficiaris: 'Tipus de beneficiari',
  codi_territorial: 'Codi territorial',
  administraci_codi: 'Administració (codi)',
  administraci_: 'Administració',
  departament_o_entitat_local_d_adscripci_codi: 'Dept. adscripció (codi)',
  departament_o_entitat_local_d_adscripci_: 'Dept. adscripció',
  // Salaries
  cognoms_nom: 'Nom',
  denominacio_lloc: 'Càrrec',
  departament: 'Departament',
  retribucio_anual_prevista: 'Retribució anual',
  vinculacio: 'Vinculació',
  sexe: 'Sexe',
  inici_periode: 'Inici període',
  // BDNS
  descripcion: 'Descripció',
  beneficiario: 'Beneficiari',
  importe: 'Import',
  fechaConcesion: 'Data concessió',
  organo: 'Òrgan',
};

const CURRENCY_FIELDS = new Set([
  'import_adjudicacio',
  'import_subvenci_pr_stec_ajut',
  'import_ajuda_equivalent',
  'importe',
]);

const DATE_FIELDS = new Set([
  'data_adjudicacio',
  'data_concessi',
  'fechaConcesion',
  'fechaPublicacion',
  'inici_periode',
]);

const HIDDEN_FIELDS = new Set([
  ':@computed_region_anyid',
  // Hide internal code fields when the human-readable version exists
  'id_agrupacio_organisme',
  'id_organisme_contractant',
  'subfinalitat_codi',
  'finalitat_rais_codi',
  'finalitat_p_blica_codi',
  'tipus_de_beneficiaris_codi',
  'administraci_codi',
  'departament_o_entitat_local_d_adscripci_codi',
  'entitat_oo_aa_o_departament',
  'tipus_d_instument_d_ajut',
]);

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '---';
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

function formatDate(value: string): string {
  if (!value) return '---';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('ca-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return value;
  }
}

function formatCell(value: unknown, format?: 'currency' | 'date' | 'text'): string {
  if (value === null || value === undefined) return '---';
  switch (format) {
    case 'currency':
      return formatCurrency(value as number | string);
    case 'date':
      return formatDate(value as string);
    default:
      return String(value);
  }
}

function isUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function formatDetailValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '---';
  if (CURRENCY_FIELDS.has(key)) return formatCurrency(value as number | string);
  if (DATE_FIELDS.has(key)) return formatDate(value as string);
  return String(value);
}

function getFieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  // Fallback: humanize the key
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildSocrataUrl(domain: string, dataset: string): string {
  return `https://${domain}/resource/${dataset}.json`;
}

function buildBdnsUrl(domain: string, dataset: string): string {
  return `https://${domain}/${dataset}`;
}

function DetailModal({
  item,
  onClose,
}: {
  item: Record<string, unknown>;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  const entries = Object.entries(item).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== '' &&
      !key.startsWith(':@') &&
      !HIDDEN_FIELDS.has(key)
  );

  // Get the title from the first meaningful text field
  const titleField =
    (item.descripcio_expedient as string) ||
    (item.contracte as string) ||
    (item.objecte_de_la_convocat_ria as string) ||
    (item.descripcion as string) ||
    (item.cognoms_nom as string) ||
    'Detall del registre';

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '16px',
      }}
    >
      <div
        class="animate-in"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 class="text-sm font-bold text-gray-900" style={{ lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {titleField}
            </h3>
            <p class="text-xs text-gray-400" style={{ marginTop: '2px' }}>Totes les dades disponibles</p>
          </div>
          <button
            onClick={onClose}
            style={{ flexShrink: 0, padding: '6px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#a1a1aa' }}
            aria-label="Tancar"
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {entries.map(([key, value]) => {
              const strValue = String(value);
              const isLink = isUrl(strValue);
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <dt class="text-xs font-medium text-gray-400">
                    {getFieldLabel(key)}
                  </dt>
                  <dd
                    class={`text-sm text-gray-900 ${
                      CURRENCY_FIELDS.has(key) ? 'font-semibold' : ''
                    }`}
                    style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                  >
                    {isLink ? (
                      <a
                        href={strValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 hover:text-blue-800 underline text-xs"
                      >
                        Obrir enllaç
                      </a>
                    ) : (
                      formatDetailValue(key, value)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 500, color: '#3f3f46', backgroundColor: '#f4f4f5', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataExplorer({
  title,
  dataset,
  domain = 'analisi.transparenciacatalunya.cat',
  dataSource = 'socrata',
  columns,
  searchField,
  defaultOrder = ':id',
  pageSize = 20,
}: DataExplorerProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function fetchSocrataData(query: string, currentPage: number) {
    const baseUrl = buildSocrataUrl(domain, dataset);
    const params = new URLSearchParams({
      $limit: String(pageSize),
      $offset: String(currentPage * pageSize),
      $order: defaultOrder,
    });

    if (query.trim()) {
      params.set('$q', query.trim());
    }

    const [dataRes, countRes] = await Promise.all([
      fetch(`${baseUrl}?${params.toString()}`),
      fetch(`${baseUrl}?$select=count(*)${query.trim() ? `&$q=${encodeURIComponent(query.trim())}` : ''}`),
    ]);

    let data: Record<string, unknown>[] = [];
    let count = 0;

    if (dataRes.ok) {
      data = await dataRes.json();
    } else {
      throw new Error(`API Socrata ha retornat error ${dataRes.status}`);
    }

    if (countRes.ok) {
      const countData = await countRes.json();
      count = Number(countData?.[0]?.count ?? countData?.[0]?.count_0 ?? 0);
    }

    return { data, count };
  }

  async function fetchBdnsData(query: string, currentPage: number) {
    const baseUrl = buildBdnsUrl(domain, dataset);
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(pageSize),
    });

    if (query.trim()) {
      params.set('texto', query.trim());
    }

    const res = await fetch(`${baseUrl}?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`API BDNS ha retornat error ${res.status}`);
    }

    const json = await res.json();
    const data: Record<string, unknown>[] = json?.resultado ?? json?.data ?? [];
    const count = Number(json?.totalRegistros ?? json?.total ?? 0);

    return { data, count };
  }

  async function fetchData(query: string, currentPage: number) {
    setLoading(true);
    setError(null);
    try {
      let result: { data: Record<string, unknown>[]; count: number };

      if (dataSource === 'bdns') {
        result = await fetchBdnsData(query, currentPage);
      } else {
        result = await fetchSocrataData(query, currentPage);
      }

      setItems(result.data);
      setTotal(result.count);
    } catch (err) {
      // silenced
      setItems([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Error desconegut carregant les dades');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(searchQuery, page);
  }, [page]);

  useEffect(() => {
    setPage(0);
    fetchData(searchQuery, 0);
  }, [searchQuery]);

  function handleSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  }

  const handleCloseModal = useCallback(() => setSelectedItem(null), []);

  return (
    <div class="w-full">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
        <div class="relative w-full sm:w-72">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cercar..."
            onInput={handleSearchInput}
            class="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {loading ? (
        <div class="flex items-center justify-center py-16">
          <div class="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <span class="ml-3 text-sm text-gray-500">Carregant...</span>
        </div>
      ) : error ? (
        <div class="text-center py-16">
          <p class="text-sm text-gray-700">No s'han pogut carregar les dades</p>
          <p class="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div class="text-center py-16">
          <p class="text-sm text-gray-700">No s'han trobat resultats</p>
          {searchQuery && (
            <p class="text-xs text-gray-400 mt-1">Prova amb altres termes de cerca</p>
          )}
        </div>
      ) : (
        <>
          <div class="overflow-x-auto border border-gray-200 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedItem(item)}
                    class="hover:bg-blue-50 transition-colors cursor-pointer group"
                    title="Fes clic per veure tots els detalls"
                  >
                    {columns.map((col, ci) => {
                      const rawValue = item[col.key];
                      const displayValue = formatCell(rawValue, col.format);
                      return (
                        <td
                          key={col.key}
                          title={rawValue != null ? String(rawValue) : undefined}
                          class={`px-4 py-2.5 text-gray-700 ${
                            col.format === 'currency' ? 'text-right tabular-nums font-medium' : ''
                          } max-w-xs truncate`}
                        >
                          <span class="flex items-center gap-1.5">
                            {ci === 0 && (
                              <svg class="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                            {displayValue}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 text-xs gap-2">
            <span class="text-gray-400">
              {total.toLocaleString('ca-ES')} resultats · Pàgina {page + 1} de {totalPages.toLocaleString('ca-ES')}
            </span>
            <div class="flex items-center gap-1.5">
              {dataSource === 'socrata' && (
                <a
                  href={`https://${domain}/resource/${dataset}.csv?$limit=50000${searchQuery.trim() ? `&$q=${encodeURIComponent(searchQuery.trim())}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-xs inline-flex items-center gap-1"
                  title="Descarregar totes les dades en format CSV"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </a>
              )}
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                class="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                class="px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
              >
                Següent
              </button>
            </div>
          </div>
        </>
      )}

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={handleCloseModal} />
      )}
    </div>
  );
}
