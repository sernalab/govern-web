export const SOCRATA_DOMAIN = 'analisi.transparenciacatalunya.cat';

export const DATASETS = {
  // Contractació pública
  contractes: 'hb6v-jcbf',           // ALL public contracts in Catalunya
  contractes_menors: 'qjue-2pk9',     // Minor contracts only

  // Subvencions (RAISC)
  subvencions_concedides: 's9xt-n979', // Concessions del RAISC
  subvencions_convocatories: 'khxn-nv6a',

  // Retribucions
  retribucions_alts_carrecs: 'x9au-abcn', // Individual salaries
  retribucions_directius: '62n8-i8x7',     // Public sector directors
  retribucions_taules: '3b6m-hrxk',        // Salary tables by role

  // Pressupostos
  pressupostos_generalitat: 'yd9k-7jhw',
  pressupostos_municipals: '4g9s-gzp6',

  // Activitat institucional
  viatges_oficials: '5kte-hque',
  grups_interes: 'gwpn-de62',
} as const;

export type DatasetKey = keyof typeof DATASETS;
