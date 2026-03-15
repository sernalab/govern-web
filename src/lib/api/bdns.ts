import type { SubvencioBDNS } from '../types';

const BDNS_BASE = 'https://www.pap.hacienda.gob.es/bdnstrans/api';

export class BDNSError extends Error {
  public status: number;
  public endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'BDNSError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

export interface BDNSConcesionesParams {
  text?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
}

export interface BDNSConvocatoriasParams {
  text?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
}

interface BDNSPaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

async function bdnsFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BDNS_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new BDNSError(
      `BDNS API error: ${response.status} - ${errorBody}`,
      response.status,
      url.toString(),
    );
  }

  return response.json() as Promise<T>;
}

function buildParams(params: BDNSConcesionesParams | BDNSConvocatoriasParams): Record<string, string> {
  const result: Record<string, string> = {};
  if (params.text) result['text'] = params.text;
  if (params.fechaDesde) result['fechaDesde'] = params.fechaDesde;
  if (params.fechaHasta) result['fechaHasta'] = params.fechaHasta;
  if (params.page !== undefined) result['page'] = String(params.page);
  if (params.pageSize !== undefined) result['pageSize'] = String(params.pageSize);
  return result;
}

export async function searchConcesiones(
  params: BDNSConcesionesParams,
): Promise<BDNSPaginatedResponse<SubvencioBDNS>> {
  return bdnsFetch<BDNSPaginatedResponse<SubvencioBDNS>>(
    '/concesiones',
    buildParams(params),
  );
}

export async function searchConvocatorias(
  params: BDNSConvocatoriasParams,
): Promise<BDNSPaginatedResponse<SubvencioBDNS>> {
  return bdnsFetch<BDNSPaginatedResponse<SubvencioBDNS>>(
    '/convocatorias',
    buildParams(params),
  );
}

export async function getConvocatoria(num: string): Promise<SubvencioBDNS> {
  return bdnsFetch<SubvencioBDNS>(`/convocatorias/${num}`, {});
}
