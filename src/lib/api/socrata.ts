import { SOCRATA_DOMAIN } from '../../data/datasets';
import type { SocrataQueryOptions } from '../types';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export class SocrataError extends Error {
  public status: number;
  public endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'SocrataError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

function buildSocrataUrl(options: SocrataQueryOptions): string {
  const domain = options.domain ?? SOCRATA_DOMAIN;
  const base = `https://${domain}/resource/${options.dataset}.json`;
  const params = new URLSearchParams();

  if (options.select) params.set('$select', options.select);
  if (options.where) params.set('$where', options.where);
  if (options.group) params.set('$group', options.group);
  if (options.order) params.set('$order', options.order);
  if (options.limit !== undefined) params.set('$limit', String(options.limit));
  if (options.offset !== undefined) params.set('$offset', String(options.offset));
  if (options.q) params.set('$q', options.q);

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export async function querySocrata<T>(options: SocrataQueryOptions): Promise<T[]> {
  const url = buildSocrataUrl(options);

  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T[];
  }

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new SocrataError(
      `Socrata API error: ${response.status} - ${errorBody}`,
      response.status,
      url,
    );
  }

  const data: T[] = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

export async function countSocrata(
  options: Omit<SocrataQueryOptions, 'select' | 'limit' | 'offset'>,
): Promise<number> {
  const url = buildSocrataUrl({
    ...options,
    select: 'count(*) as count',
    limit: 1,
  });

  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as number;
  }

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new SocrataError(
      `Socrata count error: ${response.status} - ${errorBody}`,
      response.status,
      url,
    );
  }

  const data: Array<{ count: string }> = await response.json();
  const count = data.length === 0 ? 0 : parseInt(data[0].count, 10);
  cache.set(url, { data: count, timestamp: Date.now() });
  return count;
}
