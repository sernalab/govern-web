/**
 * Detector de fraccionament de contractes (contract splitting)
 *
 * Identifica patrons on un mateix òrgan + adjudicatari divideix contractes
 * per quedar per sota dels llindars legals de licitació.
 *
 * Llindars:
 * - Serveis: 15.000€
 * - Obres: 40.000€
 */

import type { Contracte, Anomalia } from '@lib/types';

const LLINDAR_SERVEIS = 15_000;
const LLINDAR_OBRES = 40_000;
const MIN_CONTRACTES = 3;

interface GrupContractes {
  organ: string;
  adjudicatari: string;
  contractes: Contracte[];
  any: number;
}

function getYear(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getFullYear();
}

function getLlindar(contracte: Contracte): number {
  const tipus = (contracte.tipus_contracte || '').toLowerCase();
  if (tipus.includes('obr')) return LLINDAR_OBRES;
  return LLINDAR_SERVEIS;
}

function normalizeStr(s: string | undefined): string {
  return (s || '').trim().toLowerCase();
}

/**
 * Detecta possible fraccionament de contractes.
 *
 * Agrupa per organ + adjudicatari + any, i marca com anomalia si hi ha
 * 3+ contractes just per sota del llindar dins el mateix any.
 */
export function detectFraccionament(contracts: Contracte[]): Anomalia[] {
  const anomalies: Anomalia[] = [];

  // Group by organ + adjudicatari + year
  const grups = new Map<string, GrupContractes>();

  for (const c of contracts) {
    const organ = normalizeStr(c.organisme_contractant);
    const adj = normalizeStr(c.adjudicatari);
    const year = getYear(c.data_adjudicacio);

    if (!organ || !adj || !year) continue;

    const key = `${organ}::${adj}::${year}`;
    if (!grups.has(key)) {
      grups.set(key, {
        organ: c.organisme_contractant || organ,
        adjudicatari: c.adjudicatari || adj,
        contractes: [],
        any: year,
      });
    }
    grups.get(key)!.contractes.push(c);
  }

  for (const [, grup] of grups) {
    // Filter contracts that are just under their respective threshold
    // "Just under" = between 50% and 100% of the threshold
    const sospitosos = grup.contractes.filter((c) => {
      const import_ = c.import_adjudicacio ?? 0;
      const llindar = getLlindar(c);
      return import_ > 0 && import_ < llindar && import_ >= llindar * 0.5;
    });

    if (sospitosos.length < MIN_CONTRACTES) continue;

    const totalImport = sospitosos.reduce(
      (sum, c) => sum + (c.import_adjudicacio ?? 0),
      0
    );

    const llindarRef = getLlindar(sospitosos[0]);
    const severity: Anomalia['gravetat'] =
      sospitosos.length >= 6 ? 'alta' : sospitosos.length >= 4 ? 'mitjana' : 'baixa';

    anomalies.push({
      id: `frac-${grup.organ.substring(0, 20)}-${grup.adjudicatari.substring(0, 20)}-${grup.any}`,
      tipus: 'fraccionament',
      gravetat: severity,
      titol: `Possible fraccionament: ${sospitosos.length} contractes sota llindar`,
      descripcio:
        `${grup.organ} ha adjudicat ${sospitosos.length} contractes a "${grup.adjudicatari}" ` +
        `durant ${grup.any}, tots per sota del llindar de ${llindarRef.toLocaleString('ca-ES')}€. ` +
        `Import total acumulat: ${totalImport.toLocaleString('ca-ES', { minimumFractionDigits: 2 })}€.`,
      organ: grup.organ,
      adjudicatari: grup.adjudicatari,
      evidencia: {
        num_contractes: sospitosos.length,
        any: grup.any,
        llindar: llindarRef,
        import_total: Math.round(totalImport * 100) / 100,
        imports: sospitosos.map(
          (c) => c.import_adjudicacio ?? 0
        ),
        contracte_ids: sospitosos
          .map((c) => c.codi_expedient)
          .filter(Boolean),
      },
      data_deteccio: new Date().toISOString(),
    });
  }

  return anomalies.sort((a, b) => {
    const sevOrder = { alta: 0, mitjana: 1, baixa: 2 };
    return sevOrder[a.gravetat] - sevOrder[b.gravetat];
  });
}
