import { DATASETS } from '../data/datasets';
import { querySocrata, countSocrata } from './api/socrata';
import casosData from '../data/casos-corrupcion.json';
import type {
  Contracte,
  Subvencio,
  CarrecPublic,
  DashboardStats,
} from './types';

export interface ContractsByYearRow {
  any: number;
  total: number;
  import_total: number;
}

export interface ContractsByTypeRow {
  tipus_contracte: string;
  total: number;
}

/**
 * Fetch aggregated dashboard KPIs using SoQL count/sum queries.
 * Throws on failure — caller must handle errors.
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  console.log('[data-fetcher] fetchDashboardStats...');
  const [
    totalContractes,
    importContractes,
    totalSubvencions,
    importSubvencions,
  ] = await Promise.all([
    countSocrata({ dataset: DATASETS.contractes }),
    querySocrata<{ total: string }>({
      dataset: DATASETS.contractes,
      select: 'sum(import_adjudicacio) as total',
      limit: 1,
    }),
    countSocrata({ dataset: DATASETS.subvencions_concedides }),
    querySocrata<{ total: string }>({
      dataset: DATASETS.subvencions_concedides,
      select: 'sum(import_subvenci_pr_stec_ajut) as total',
      limit: 1,
    }),
  ]);

  const result: DashboardStats = {
    totalContractes,
    importTotalContractes: importContractes.length > 0
      ? parseFloat(importContractes[0].total) || 0
      : 0,
    totalSubvencions,
    importTotalSubvencions: importSubvencions.length > 0
      ? parseFloat(importSubvencions[0].total) || 0
      : 0,
    // Corruption stats from static JSON data
    totalCasosCorrupcio: casosData.length,
    totalPersonesImplicades: casosData.reduce(
      (sum: number, cas: { persones?: unknown[] }) => sum + (cas.persones?.length ?? 0),
      0,
    ),
    importEstimatCorrupcio: casosData.reduce(
      (sum: number, cas: { import_estimat?: number }) => sum + (cas.import_estimat ?? 0),
      0,
    ),
  };
  console.log('[data-fetcher] fetchDashboardStats → ', JSON.stringify(result).slice(0, 200));
  return result;
}

/**
 * Fetch top contracts ordered by adjudication amount (descending).
 */
export async function fetchTopContracts(limit: number = 20): Promise<Contracte[]> {
  console.log('[data-fetcher] fetchTopContracts...');
  const result = await querySocrata<Contracte>({
    dataset: DATASETS.contractes,
    order: 'import_adjudicacio DESC',
    limit,
  });
  console.log('[data-fetcher] fetchTopContracts → ', JSON.stringify(result).slice(0, 200));
  return result;
}

/**
 * Fetch contracts aggregated by year with total count and sum of amounts.
 * Uses date_extract_y to group by year from data_adjudicacio.
 */
export async function fetchContractsByYear(): Promise<ContractsByYearRow[]> {
  console.log('[data-fetcher] fetchContractsByYear...');
  const rows = await querySocrata<{ any: string; total: string; import_total: string }>({
    dataset: DATASETS.contractes,
    select: 'date_extract_y(data_adjudicacio) as any, count(*) as total, sum(import_adjudicacio) as import_total',
    group: 'date_extract_y(data_adjudicacio)',
    order: 'any ASC',
    limit: 50,
  });

  const currentYear = new Date().getFullYear();
  const result = rows
    .map((row) => ({
      any: parseInt(row.any, 10),
      total: parseInt(row.total, 10),
      import_total: parseFloat(row.import_total) || 0,
    }))
    .filter((row) => row.any >= 1990 && row.any <= currentYear);
  console.log('[data-fetcher] fetchContractsByYear → ', JSON.stringify(result).slice(0, 200));
  return result;
}

/**
 * Fetch contracts aggregated by tipus_contracte.
 */
export async function fetchContractsByType(): Promise<ContractsByTypeRow[]> {
  console.log('[data-fetcher] fetchContractsByType...');
  const rows = await querySocrata<{ tipus_contracte: string; total: string }>({
    dataset: DATASETS.contractes,
    select: 'tipus_contracte, count(*) as total',
    group: 'tipus_contracte',
    order: 'total DESC',
    limit: 20,
  });

  const result = rows
    .filter((row) => row.tipus_contracte)
    .map((row) => ({
      tipus_contracte: row.tipus_contracte,
      total: parseInt(row.total, 10),
    }));
  console.log('[data-fetcher] fetchContractsByType → ', JSON.stringify(result).slice(0, 200));
  return result;
}

/**
 * Fetch salary rankings ordered by salary (descending).
 */
export async function fetchSalaryRankings(limit: number = 50): Promise<CarrecPublic[]> {
  console.log('[data-fetcher] fetchSalaryRankings...');
  const result = await querySocrata<CarrecPublic>({
    dataset: DATASETS.retribucions_alts_carrecs,
    order: 'retribucio_anual_prevista DESC',
    limit,
  });
  console.log('[data-fetcher] fetchSalaryRankings → ', JSON.stringify(result).slice(0, 200));
  return result;
}

/**
 * Fetch most recently published contracts.
 */
export async function fetchRecentContracts(limit: number = 10): Promise<Contracte[]> {
  console.log('[data-fetcher] fetchRecentContracts...');
  const today = new Date().toISOString().slice(0, 10);
  const result = await querySocrata<Contracte>({
    dataset: DATASETS.contractes,
    where: `data_adjudicacio <= '${today}'`,
    order: 'data_adjudicacio DESC',
    limit,
  });
  console.log('[data-fetcher] fetchRecentContracts → ', JSON.stringify(result).slice(0, 200));
  return result;
}

/**
 * Fetch most recently published subsidies.
 */
export async function fetchRecentSubvencions(limit: number = 10): Promise<Subvencio[]> {
  console.log('[data-fetcher] fetchRecentSubvencions...');
  const today = new Date().toISOString().slice(0, 10);
  const result = await querySocrata<Subvencio>({
    dataset: DATASETS.subvencions_concedides,
    where: `data_concessi <= '${today}'`,
    order: 'data_concessi DESC',
    limit,
  });
  console.log('[data-fetcher] fetchRecentSubvencions → ', JSON.stringify(result).slice(0, 200));
  return result;
}
