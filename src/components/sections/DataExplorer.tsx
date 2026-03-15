import { useRef, useEffect, useState } from 'preact/hooks';

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

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '---';
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

function formatDate(value: string): string {
  if (!value) return '---';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('ca-ES', { year: 'numeric', month: 'short', day: 'numeric' });
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

function buildSocrataUrl(domain: string, dataset: string): string {
  return `https://${domain}/resource/${dataset}.json`;
}

function buildBdnsUrl(domain: string, dataset: string): string {
  return `https://${domain}/${dataset}`;
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
      console.error('DataExplorer fetch error:', err);
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
                  <tr key={i} class="hover:bg-gray-50 transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        class={`px-4 py-2.5 text-gray-700 ${
                          col.format === 'currency' ? 'text-right tabular-nums font-medium' : ''
                        } max-w-xs truncate`}
                      >
                        {formatCell(item[col.key], col.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between mt-3 text-xs">
            <span class="text-gray-400">
              {total.toLocaleString('ca-ES')} resultats · Pagina {page + 1} de {totalPages.toLocaleString('ca-ES')}
            </span>
            <div class="flex gap-1.5">
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
                Seguent
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
