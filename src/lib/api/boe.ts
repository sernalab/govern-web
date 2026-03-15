const BOE_BASE = 'https://boe.es/datosabiertos/api';

export class BOEError extends Error {
  public status: number;
  public endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'BOEError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

export interface BOESummary {
  fecha: string;
  sumario: {
    diario: Array<{
      seccion: Array<{
        departamento: Array<{
          nombre: string;
          item: Array<{
            id: string;
            titulo: string;
            urlPdf: string;
            urlHtml: string;
          }>;
        }>;
      }>;
    }>;
  };
}

export interface BOELegislacionResult {
  items: Array<{
    id: string;
    titulo: string;
    fechaPublicacion: string;
    urlPdf: string;
    urlHtml: string;
    rango: string;
  }>;
  totalItems: number;
  page: number;
}

async function boeFetch<T>(endpoint: string): Promise<T> {
  const url = `${BOE_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new BOEError(
      `BOE API error: ${response.status} - ${errorBody}`,
      response.status,
      url,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Get the BOE summary for a specific date.
 * @param date - Date in YYYYMMDD format
 */
export async function getSummary(date: string): Promise<BOESummary> {
  return boeFetch<BOESummary>(`/boe/dias/${date}`);
}

/**
 * Search legislation in the BOE.
 * @param query - Search query text
 * @param page - Page number (optional, starts at 1)
 */
export async function searchLegislacion(
  query: string,
  page?: number,
): Promise<BOELegislacionResult> {
  const params = new URLSearchParams({ q: query });
  if (page !== undefined) params.set('page', String(page));
  return boeFetch<BOELegislacionResult>(`/boe/legislacion?${params.toString()}`);
}
