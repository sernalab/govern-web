const DATOSGOB_BASE = 'https://datos.gob.es/apidata';

export class DatosGobError extends Error {
  public status: number;
  public endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'DatosGobError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

export interface DatosGobDataset {
  identifier: string;
  title: string;
  description: string;
  theme: string[];
  publisher: string;
  issued: string;
  modified: string;
  distribution: Array<{
    accessURL: string;
    format: string;
    title: string;
  }>;
  keyword: string[];
}

export interface DatosGobSearchResult {
  result: {
    items: DatosGobDataset[];
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
  };
}

async function datosGobFetch<T>(endpoint: string): Promise<T> {
  const url = `${DATOSGOB_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new DatosGobError(
      `datos.gob.es API error: ${response.status} - ${errorBody}`,
      response.status,
      url,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Search datasets in the datos.gob.es catalog.
 * @param keyword - Search keyword
 * @param limit - Max number of results (default 20)
 */
export async function searchDatasets(
  keyword: string,
  limit: number = 20,
): Promise<DatosGobSearchResult> {
  const params = new URLSearchParams({
    q: keyword,
    _pageSize: String(limit),
  });
  return datosGobFetch<DatosGobSearchResult>(`/catalog/dataset?${params.toString()}`);
}
