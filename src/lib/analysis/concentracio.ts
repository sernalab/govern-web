/**
 * Detector de concentració de proveïdors (supplier concentration)
 *
 * Identifica quan un únic proveïdor acapara un percentatge elevat
 * dels contractes d'un mateix òrgan de contractació.
 *
 * Llindar: >30% dels contractes d'un òrgan (mínim 5 contractes totals)
 */

import type { Contracte, Anomalia } from '@lib/types';

const PERCENTATGE_LLINDAR = 30;
const MIN_CONTRACTES_ORGAN = 5;

interface ProveidorStats {
  adjudicatari: string;
  numContractes: number;
  importTotal: number;
  contracteIds: string[];
}

interface OrganStats {
  organ: string;
  totalContractes: number;
  importTotal: number;
  proveidors: Map<string, ProveidorStats>;
}

function normalizeStr(s: string | undefined): string {
  return (s || '').trim().toLowerCase();
}

/**
 * Detecta concentració excessiva de proveïdors per òrgan de contractació.
 *
 * Marca com anomalia si un sol proveïdor té >30% dels contractes
 * d'un òrgan (amb un mínim de 5 contractes totals per l'òrgan).
 */
export function detectConcentracio(contracts: Contracte[]): Anomalia[] {
  const anomalies: Anomalia[] = [];

  // Group by organ
  const organs = new Map<string, OrganStats>();

  for (const c of contracts) {
    const organKey = normalizeStr(c.organisme_contractant);
    const adjKey = normalizeStr(c.adjudicatari);

    if (!organKey || !adjKey) continue;

    if (!organs.has(organKey)) {
      organs.set(organKey, {
        organ: c.organisme_contractant || organKey,
        totalContractes: 0,
        importTotal: 0,
        proveidors: new Map(),
      });
    }

    const organStats = organs.get(organKey)!;
    organStats.totalContractes++;
    organStats.importTotal += c.import_adjudicacio ?? 0;

    if (!organStats.proveidors.has(adjKey)) {
      organStats.proveidors.set(adjKey, {
        adjudicatari: c.adjudicatari || adjKey,
        numContractes: 0,
        importTotal: 0,
        contracteIds: [],
      });
    }

    const provStats = organStats.proveidors.get(adjKey)!;
    provStats.numContractes++;
    provStats.importTotal += c.import_adjudicacio ?? 0;
    if (c.codi_expedient) {
      provStats.contracteIds.push(c.codi_expedient);
    }
  }

  for (const [, organStats] of organs) {
    if (organStats.totalContractes < MIN_CONTRACTES_ORGAN) continue;

    for (const [, provStats] of organStats.proveidors) {
      const percentatgeContractes =
        (provStats.numContractes / organStats.totalContractes) * 100;
      const percentatgeImport =
        organStats.importTotal > 0
          ? (provStats.importTotal / organStats.importTotal) * 100
          : 0;

      if (percentatgeContractes <= PERCENTATGE_LLINDAR) continue;

      const severity: Anomalia['gravetat'] =
        percentatgeContractes > 60
          ? 'alta'
          : percentatgeContractes > 45
            ? 'mitjana'
            : 'baixa';

      anomalies.push({
        id: `conc-${normalizeStr(organStats.organ).substring(0, 20)}-${normalizeStr(provStats.adjudicatari).substring(0, 20)}`,
        tipus: 'concentracio',
        gravetat: severity,
        titol: `Concentració: ${Math.round(percentatgeContractes)}% dels contractes a un proveïdor`,
        descripcio:
          `"${provStats.adjudicatari}" ha rebut ${provStats.numContractes} de ${organStats.totalContractes} ` +
          `contractes (${Math.round(percentatgeContractes)}%) de "${organStats.organ}". ` +
          `Acumula el ${Math.round(percentatgeImport)}% de l'import total.`,
        organ: organStats.organ,
        adjudicatari: provStats.adjudicatari,
        evidencia: {
          num_contractes_proveidor: provStats.numContractes,
          num_contractes_organ: organStats.totalContractes,
          percentatge_contractes: Math.round(percentatgeContractes * 100) / 100,
          percentatge_import: Math.round(percentatgeImport * 100) / 100,
          import_proveidor: Math.round(provStats.importTotal * 100) / 100,
          import_organ: Math.round(organStats.importTotal * 100) / 100,
          contracte_ids: provStats.contracteIds.slice(0, 10),
        },
        data_deteccio: new Date().toISOString(),
      });
    }
  }

  return anomalies.sort((a, b) => {
    const sevOrder = { alta: 0, mitjana: 1, baixa: 2 };
    return sevOrder[a.gravetat] - sevOrder[b.gravetat];
  });
}
