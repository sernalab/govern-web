export interface Equivalence {
  label: string;
  amount: number;
  icon: string;
}

const EQUIVALENCES: Equivalence[] = [
  // Serveis personals
  { label: 'T-jove de transport', amount: 176, icon: '🚇' },
  { label: 'lots de llibres escolars', amount: 300, icon: '📚' },
  { label: 'anys de menjador escolar', amount: 1320, icon: '🍽' },
  { label: 'beques universitàries', amount: 6000, icon: '🎓' },

  // Sous públics (anuals)
  { label: 'sous d\'infermera', amount: 35000, icon: '🏥' },
  { label: 'sous de mestre', amount: 42000, icon: '👩‍🏫' },
  { label: 'sous de Mosso d\'Esquadra', amount: 45000, icon: '👮' },
  { label: 'sous de metge especialista', amount: 55000, icon: '⚕' },

  // Infraestructures
  { label: 'instal·lacions solars', amount: 45000, icon: '☀' },
  { label: 'parcs infantils', amount: 120000, icon: '🛝' },
  { label: 'habitatges socials', amount: 180000, icon: '🏠' },
  { label: 'km de carril bici', amount: 200000, icon: '🚲' },
  { label: 'aparells de ressonància magnètica', amount: 1500000, icon: '🏥' },
  { label: 'escoles noves', amount: 5500000, icon: '🏫' },
];

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString('ca-ES');
}

export function getEquivalences(totalAmount: number, count: number = 3): { icon: string; text: string }[] {
  if (totalAmount <= 0) return [];

  // Find equivalences that produce reasonable numbers (between 1 and 10M)
  const valid = EQUIVALENCES
    .map(eq => ({
      ...eq,
      quantity: Math.floor(totalAmount / eq.amount),
    }))
    .filter(eq => eq.quantity >= 1 && eq.quantity <= 10_000_000);

  if (valid.length === 0) return [];

  // Pick spread: one small, one medium, one large
  const sorted = valid.sort((a, b) => a.amount - b.amount);
  const picks: typeof valid = [];

  if (sorted.length >= 3) {
    picks.push(sorted[0]); // cheapest (most units)
    picks.push(sorted[Math.floor(sorted.length / 2)]); // middle
    picks.push(sorted[sorted.length - 1]); // most expensive (fewest units)
  } else {
    picks.push(...sorted.slice(0, count));
  }

  return picks.slice(0, count).map(eq => ({
    icon: eq.icon,
    text: `${formatNum(eq.quantity)} ${eq.label}`,
  }));
}
