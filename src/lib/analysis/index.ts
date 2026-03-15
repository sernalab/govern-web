/**
 * Mòdul d'anàlisi de contractació pública
 *
 * Punt d'entrada únic per a tots els detectors d'anomalies.
 */

import type { Contracte, Anomalia } from '@lib/types';
import { detectFraccionament } from './fraccionament';
import { detectConcentracio } from './concentracio';

export { detectFraccionament } from './fraccionament';
export { detectConcentracio } from './concentracio';

/**
 * Executa tots els detectors d'anomalies i fusiona els resultats.
 * Ordena per severitat (alta > mitjana > baixa).
 */
export function runAllAnalysis(contracts: Contracte[]): Anomalia[] {
  const results: Anomalia[] = [
    ...detectFraccionament(contracts),
    ...detectConcentracio(contracts),
  ];

  const sevOrder = { alta: 0, mitjana: 1, baixa: 2 };
  return results.sort((a, b) => sevOrder[a.gravetat] - sevOrder[b.gravetat]);
}
