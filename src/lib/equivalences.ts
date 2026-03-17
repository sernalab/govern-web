/**
 * Equivalències basades en dades reals i verificades.
 *
 * Fonts:
 * - T-jove 2026: 45,50 €/trimestre amb bonificació 50% (ATM, gener 2026)
 * - Mestre: ~2.388 €/mes × 14 pagues (Dept. Educació, taules retributives 2026)
 * - Mosso d'Esquadra: 44.344–47.951 €/any (Taules salarials Generalitat, 2026)
 * - Bomber: ~42.000 €/any base (Taules salarials Generalitat, 2026)
 * - Beca universitària: 6.000 € import mitjà (Ministeri d'Educació, curs 2024-25)
 * - Menjador escolar: ~7 €/dia × 180 dies (estimació sector públic Catalunya)
 * - Habitatge social: 180.000 € cost construcció (INCASÒL, estimació 2024)
 * - Escola CEIP: 5-6M € (Dept. Educació, licitacions recents)
 */

export interface Equivalence {
  label: string;
  amount: number;
  icon: string;
  source: string;
}

const EQUIVALENCES: Equivalence[] = [
  // Serveis personals
  { label: 'T-jove anuals', amount: 182, icon: '🚇', source: 'ATM 2026, amb bonificació 50%' },
  { label: 'anys de menjador escolar', amount: 1260, icon: '🍽', source: '~7 €/dia × 180 dies lectius' },
  { label: 'beques universitàries', amount: 6000, icon: '🎓', source: 'Import mitjà beca general MEC' },

  // Sous públics (anuals bruts, dades Generalitat 2026)
  { label: 'sous de mestre', amount: 33432, icon: '👩‍🏫', source: 'Taules retributives Dept. Educació 2026' },
  { label: 'sous de bomber', amount: 42000, icon: '🚒', source: 'Taules salarials Generalitat 2026' },
  { label: 'sous de Mosso d\'Esquadra', amount: 46000, icon: '👮', source: 'Taules salarials Generalitat 2026 (categoria 3)' },

  // Infraestructures
  { label: 'habitatges socials', amount: 180000, icon: '🏠', source: 'Cost mitjà construcció INCASÒL' },
  { label: 'km de carril bici', amount: 200000, icon: '🚲', source: 'Cost mitjà construcció urbà' },
  { label: 'escoles noves (CEIP)', amount: 5500000, icon: '🏫', source: 'Licitacions Dept. Educació' },
];

function formatNum(n: number): string {
  return n.toLocaleString('ca-ES');
}

export function getEquivalences(totalAmount: number, count: number = 3): { icon: string; text: string }[] {
  if (totalAmount <= 0) return [];

  const valid = EQUIVALENCES
    .map(eq => ({
      ...eq,
      quantity: Math.floor(totalAmount / eq.amount),
    }))
    .filter(eq => eq.quantity >= 1 && eq.quantity <= 10_000_000);

  if (valid.length === 0) return [];

  const sorted = valid.sort((a, b) => a.amount - b.amount);
  const picks: typeof valid = [];

  if (sorted.length >= 3) {
    picks.push(sorted[0]);
    picks.push(sorted[Math.floor(sorted.length / 2)]);
    picks.push(sorted[sorted.length - 1]);
  } else {
    picks.push(...sorted.slice(0, count));
  }

  return picks.slice(0, count).map(eq => ({
    icon: eq.icon,
    text: `${formatNum(eq.quantity)} ${eq.label}`,
  }));
}

/** Get all equivalences with sources for the methodology page */
export function getAllEquivalences(): Equivalence[] {
  return EQUIVALENCES;
}
