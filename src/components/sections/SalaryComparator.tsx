import { useRef, useEffect, useState } from 'preact/hooks';

const DOMAIN = 'analisi.transparenciacatalunya.cat';
const DATASET = 'x9au-abcn';

interface SalaryResult {
  cognoms_nom: string;
  denominacio_lloc: string;
  departament: string;
  retribucio_anual_prevista: string;
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '---';
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

export default function SalaryComparator() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SalaryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compared, setCompared] = useState<SalaryResult[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function search(q: string) {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `https://${DOMAIN}/resource/${DATASET}.json?$q=${encodeURIComponent(q)}&$limit=10&$order=retribucio_anual_prevista DESC`;
      const res = await fetch(url);
      if (res.ok) {
        setResults(await res.json());
      } else {
        setResults([]);
        setError(`Error ${res.status} de l'API`);
      }
    } catch (err) {
      // silenced
      setResults([]);
      setError('No s\'ha pogut connectar amb l\'API');
    } finally {
      setLoading(false);
    }
  }

  function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => search(value), 400);
  }

  function addToCompare(person: SalaryResult) {
    if (compared.length >= 3) return;
    if (compared.some((c) => c.cognoms_nom === person.cognoms_nom && c.denominacio_lloc === person.denominacio_lloc)) return;
    setCompared([...compared, person]);
  }

  function removeFromCompare(index: number) {
    setCompared(compared.filter((_, i) => i !== index));
  }

  function parseSalary(value: string | undefined): number {
    if (!value) return 0;
    // retribucio_anual_prevista comes as string like "130,049.12 EUR" or "130049.12"
    const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '');
    return parseFloat(cleaned) || 0;
  }

  const maxSalary = compared.length > 0
    ? Math.max(...compared.map((c) => parseSalary(c.retribucio_anual_prevista)))
    : 0;

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Comparador de Retribucions</h2>
        {compared.length > 0 && (
          <button
            onClick={() => setCompared([])}
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Netejar comparativa
          </button>
        )}
      </div>

      {/* Compare cards */}
      {compared.length > 0 && (
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {compared.map((person, i) => {
            const salary = parseSalary(person.retribucio_anual_prevista);
            const barWidth = maxSalary > 0 ? (salary / maxSalary) * 100 : 0;
            return (
              <div key={i} class="relative bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <button
                  onClick={() => removeFromCompare(i)}
                  class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-600 hover:text-white transition-colors text-xs"
                  title="Eliminar"
                >
                  x
                </button>
                <p class="text-gray-900 font-medium mb-1">{person.cognoms_nom}</p>
                <p class="text-gray-500 text-sm mb-1">{person.denominacio_lloc}</p>
                <p class="text-gray-400 text-xs mb-3">{person.departament}</p>
                <div class="space-y-1">
                  <div class="flex items-baseline justify-between">
                    <span class="text-xs text-gray-500">Retribucio bruta</span>
                    <span class="text-lg font-mono font-semibold text-emerald-600">
                      {formatCurrency(salary)}
                    </span>
                  </div>
                  <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div>
        <div class="relative w-full max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onInput={handleInput}
            placeholder="Cercar per nom..."
            class="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
        </div>
        {compared.length < 3 && (
          <p class="text-xs text-gray-500 mt-2">
            Selecciona fins a 3 persones per comparar ({3 - compared.length} restants)
          </p>
        )}
      </div>

      {/* Search Results */}
      {loading && (
        <div class="flex items-center gap-2 text-gray-500">
          <div class="w-4 h-4 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
          Cercant...
        </div>
      )}

      {error && !loading && (
        <p class="text-red-600 text-sm">{error}</p>
      )}

      {!loading && !error && results.length > 0 && (
        <div class="space-y-2">
          {results.map((person, i) => {
            const isSelected = compared.some(
              (c) => c.cognoms_nom === person.cognoms_nom && c.denominacio_lloc === person.denominacio_lloc
            );
            return (
              <div
                key={i}
                class={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div class="min-w-0 flex-1">
                  <p class="text-gray-900 font-medium truncate">{person.cognoms_nom}</p>
                  <p class="text-gray-500 text-sm truncate">{person.denominacio_lloc} -- {person.departament}</p>
                </div>
                <div class="flex items-center gap-3 ml-4 shrink-0">
                  <span class="font-mono text-emerald-600">
                    {person.retribucio_anual_prevista || '---'}
                  </span>
                  <button
                    onClick={() => addToCompare(person)}
                    disabled={isSelected || compared.length >= 3}
                    class="px-3 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSelected ? 'Afegit' : 'Comparar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && query.trim() && results.length === 0 && (
        <p class="text-gray-500 text-sm">No s'han trobat resultats per "{query}"</p>
      )}
    </div>
  );
}
