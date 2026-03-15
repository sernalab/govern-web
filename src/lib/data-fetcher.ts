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

export async function fetchDashboardStats(): Promise<DashboardStats> {
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

  return {
    totalContractes,
    importTotalContractes: importContractes.length > 0
      ? parseFloat(importContractes[0].total) || 0
      : 0,
    totalSubvencions,
    importTotalSubvencions: importSubvencions.length > 0
      ? parseFloat(importSubvencions[0].total) || 0
      : 0,
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
}

export async function fetchTopContracts(limit: number = 20): Promise<Contracte[]> {
  return querySocrata<Contracte>({
    dataset: DATASETS.contractes,
    order: 'import_adjudicacio DESC',
    limit,
  });
}

export async function fetchContractsByYear(): Promise<ContractsByYearRow[]> {
  const rows = await querySocrata<{ any: string; total: string; import_total: string }>({
    dataset: DATASETS.contractes,
    select: 'date_extract_y(data_adjudicacio) as any, count(*) as total, sum(import_adjudicacio) as import_total',
    group: 'date_extract_y(data_adjudicacio)',
    order: 'any ASC',
    limit: 50,
  });

  const currentYear = new Date().getFullYear();
  return rows
    .map((row) => ({
      any: parseInt(row.any, 10),
      total: parseInt(row.total, 10),
      import_total: parseFloat(row.import_total) || 0,
    }))
    .filter((row) => row.any >= 1990 && row.any <= currentYear);
}

export async function fetchContractsByType(): Promise<ContractsByTypeRow[]> {
  const rows = await querySocrata<{ tipus_contracte: string; total: string }>({
    dataset: DATASETS.contractes,
    select: 'tipus_contracte, count(*) as total',
    group: 'tipus_contracte',
    order: 'total DESC',
    limit: 20,
  });

  return rows
    .filter((row) => row.tipus_contracte)
    .map((row) => ({
      tipus_contracte: row.tipus_contracte,
      total: parseInt(row.total, 10),
    }));
}

export async function fetchSalaryRankings(limit: number = 50): Promise<CarrecPublic[]> {
  return querySocrata<CarrecPublic>({
    dataset: DATASETS.retribucions_alts_carrecs,
    order: 'retribucio_anual_prevista DESC',
    limit,
  });
}

export async function fetchRecentContracts(limit: number = 10): Promise<Contracte[]> {
  const today = new Date().toISOString().slice(0, 10);
  return querySocrata<Contracte>({
    dataset: DATASETS.contractes,
    where: `data_adjudicacio <= '${today}'`,
    order: 'data_adjudicacio DESC',
    limit,
  });
}

export async function fetchRecentSubvencions(limit: number = 10): Promise<Subvencio[]> {
  const today = new Date().toISOString().slice(0, 10);
  return querySocrata<Subvencio>({
    dataset: DATASETS.subvencions_concedides,
    where: `data_concessi <= '${today}'`,
    order: 'data_concessi DESC',
    limit,
  });
}
