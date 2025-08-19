// lib/airtable.ts

import { airtableCache } from './cache'

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY as string;
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID as string;
const AIRTABLE_TABLE_ID = process.env.NEXT_PUBLIC_AIRTABLE_TABLE_ID as string;
const AIRTABLE_MARKET_TABLE_ID = process.env.NEXT_PUBLIC_AIRTABLE_MARKET_TABLE_ID as string;
const AIRTABLE_OWNER_TABLE_ID = process.env.NEXT_PUBLIC_AIRTABLE_OWNER_TABLE_ID as string;
const AIRTABLE_KPI_TABLE_ID = process.env.NEXT_PUBLIC_AIRTABLE_KPI_TABLE_ID as string;
const AIRTABLE_PAGE_TABLE_ID = process.env.NEXT_PUBLIC_AIRTABLE_PAGE_TABLE_ID as string;
const AIRTABLE_PRODUCT_TABLE_ID = process.env.NEXT_PUBLIC_AIRTABLE_PRODUCT_TABLE_ID as string;
const AIRTABLE_TEST_TYPE_TABLE_ID = process.env.NEXT_PUBLIC_AIRTABLE_TEST_TYPE_TABLE_ID as string;

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
const AIRTABLE_MARKET_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_MARKET_TABLE_ID}`;
const AIRTABLE_OWNER_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_OWNER_TABLE_ID}`;
const AIRTABLE_KPI_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_KPI_TABLE_ID}`;
const AIRTABLE_PAGE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PAGE_TABLE_ID}`;
const AIRTABLE_PRODUCT_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PRODUCT_TABLE_ID}`;
const AIRTABLE_TEST_TYPE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TEST_TYPE_TABLE_ID}`;

export async function fetchExperimentations(): Promise<AirtableRecord[]> {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<AirtableRecord[]>('experimentations')
  if (cachedData) {
    return cachedData
  }

  let allRecords: AirtableRecord[] = [];
  let offset: string | undefined = undefined;
  let etag: string | undefined = undefined;
  
  do {
    const url = new URL(AIRTABLE_API_URL);
    if (offset) url.searchParams.set('offset', offset);
    
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
      cache: 'no-store',
    });
    
    if (!res.ok) throw new Error('Failed to fetch experimentations');
    
    // Récupérer l'ETag pour la synchronisation
    if (!etag) {
      etag = res.headers.get('etag') || undefined
    }
    
    const data: AirtableResponse = await res.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
  } while (offset);
  
  // Traiter les données
  const processedRecords = allRecords.map(r => ({
    ...r,
    fields: {
      ...r.fields,
      'Success Criteria #1': r.fields['Success Criteria #1'] || '',
      'Success Criteria #2': r.fields['Success Criteria #2'] || '',
      'Success Criteria #3': r.fields['Success Criteria #3'] || '',
      // Champs de timeline pour l'analyse avec les noms corrects
      'Date - Ready for Analysis': r.fields['Date - Ready for Analysis'] || '',
      'Date - Analysis': r.fields['Date - Analysis'] || '',
      'Date - Done': r.fields['Date - Done'] || '',
      // Champs de temps d'analyse avec les noms corrects
      'Days from Waiting for Analysis to Analysing': r.fields['Days from Waiting for Analysis to Analysing'] || '',
      'Days from Analysing to Done': r.fields['Days from Analysing to Done'] || '',
      // Champs supplémentaires pour la timeline
      'Tool:': r.fields['Tool:'] || '',
      'Scope': r.fields['Scope'] || '',
      'Analysis Owner': r.fields["Analysis' Owner"] || r.fields['Analysis Owner'] || '',
      // Nouveaux champs pour la section Data
      'Audience': r.fields['Audience'] || '',
      'Conversion': r.fields['Conversion'] || '',
      'Existing % Rate': r.fields['Existing % Rate'] || '',
      'Traffic Allocation': r.fields['Traffic Allocation'] || '',
      // Champ pour le fichier d'analyse
      'Results - Deepdive': r.fields['Results - Deepdive'] || null,
    }
  }))
  
  // Mettre en cache avec l'ETag
  airtableCache.set('experimentations', processedRecords, undefined, etag)
  
  return processedRecords
}

export async function fetchMarkets() {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<{id: string, name: string, region?: string}[]>('markets')
  if (cachedData) {
    return cachedData
  }

  const res = await fetch(AIRTABLE_MARKET_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch markets');
  
  const etag = res.headers.get('etag') || undefined
  const data: AirtableResponse = await res.json();
  const markets = data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Market as string) || '',
    region: (r.fields.Region as string) || ''
  }));
  
  // Mettre en cache
  airtableCache.set('markets', markets, undefined, etag)
  
  return markets
}

export async function fetchOwners() {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<{id: string, name: string}[]>('owners')
  if (cachedData) {
    return cachedData
  }

  const res = await fetch(AIRTABLE_OWNER_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch owners');
  
  const etag = res.headers.get('etag') || undefined
  const data: AirtableResponse = await res.json();
  const owners = data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || '' 
  }));
  
  // Mettre en cache
  airtableCache.set('owners', owners, undefined, etag)
  
  return owners
}

export async function fetchKPIs() {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<{id: string, name: string}[]>('kpis')
  if (cachedData) {
    return cachedData
  }

  const res = await fetch(AIRTABLE_KPI_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch KPIs');
  
  const etag = res.headers.get('etag') || undefined
  const data: AirtableResponse = await res.json();
  const kpis = data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || (r.fields.KPI as string) || '' 
  }));
  
  // Mettre en cache
  airtableCache.set('kpis', kpis, undefined, etag)
  
  return kpis
}

export async function fetchPages() {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<{id: string, name: string}[]>('pages')
  if (cachedData) {
    return cachedData
  }

  const res = await fetch(AIRTABLE_PAGE_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch Pages');
  
  const etag = res.headers.get('etag') || undefined
  const data: AirtableResponse = await res.json();
  const pages = data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || (r.fields.Page as string) || '' 
  }));
  
  // Mettre en cache
  airtableCache.set('pages', pages, undefined, etag)
  
  return pages
}

export async function fetchProducts() {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<{id: string, name: string}[]>('products')
  if (cachedData) {
    return cachedData
  }

  const res = await fetch(AIRTABLE_PRODUCT_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch Products');
  
  const etag = res.headers.get('etag') || undefined
  const data: AirtableResponse = await res.json();
  const products = data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || (r.fields.Product as string) || '' 
  }));
  
  // Mettre en cache
  airtableCache.set('products', products, undefined, etag)
  
  return products
}

export async function fetchStatuses() {
  const records = await fetchExperimentations();
  const statuses = Array.from(new Set(records.map((r: AirtableRecord) => r.fields.Status as string).filter(Boolean)));
  return statuses;
} 

export async function updateExperimentationStatus(id: string, newStatus: string) {
  const url = `${AIRTABLE_API_URL}/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: { Status: newStatus } }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  
  // Invalider le cache des expérimentations
  airtableCache.invalidate('experimentations')
  
  return res.json();
} 

export async function updateExperimentationFields(id: string, fields: Record<string, unknown>) {
  const url = `${AIRTABLE_API_URL}/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  
  if (!res.ok) {
    // Essayer de récupérer le message d'erreur détaillé d'Airtable
    let errorMessage = 'Failed to update fields'
    try {
      const errorData = await res.json()
      console.error('Airtable error response:', errorData)
      if (errorData.error && errorData.error.message) {
        errorMessage = `Airtable error: ${errorData.error.message}`
      } else if (errorData.error) {
        errorMessage = `Airtable error: ${JSON.stringify(errorData.error)}`
      }
    } catch (parseError) {
      console.error('Could not parse Airtable error response:', parseError)
    }
    
    console.error('HTTP Status:', res.status, res.statusText)
    console.error('Fields being updated:', fields)
    console.error('Project ID:', id)
    
    throw new Error(errorMessage)
  }
  
  // Invalider le cache des expérimentations
  airtableCache.invalidate('experimentations')
  
  return res.json();
}

export async function fetchTestTypes() {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<{id: string, name: string}[]>('testTypes')
  if (cachedData) {
    return cachedData
  }

  const res = await fetch(AIRTABLE_TEST_TYPE_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch Test Types');
  
  const etag = res.headers.get('etag') || undefined
  const data: AirtableResponse = await res.json();
  const testTypes = data.records.map((r: AirtableRecord) => ({
    id: r.id,
    name: (r.fields.Name as string) || ''
  }));
  
  // Mettre en cache
  airtableCache.set('testTypes', testTypes, undefined, etag)
  
  return testTypes
}

export async function fetchDevices() {
  // Récupérer les devices depuis les expérimentations existantes
  const records = await fetchExperimentations();
  const devices = Array.from(new Set(records.map(r => (r.fields['Devices'] as string) || '').filter(Boolean)));
  return devices.sort();
} 

export async function updateAnalysisFile(id: string, fileUrl: string, fileName: string) {
  const url = `${AIRTABLE_API_URL}/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      fields: { 
        'Results - Deepdive': [
          { 
            url: fileUrl,
            filename: fileName
          }
        ]
      } 
    }),
  });
  
  if (!res.ok) {
    let errorMessage = 'Failed to update analysis file'
    try {
      const errorData = await res.json()
      console.error('Airtable error response:', errorData)
      if (errorData.error && errorData.error.message) {
        errorMessage = `Airtable error: ${errorData.error.message}`
      }
    } catch (parseError) {
      console.error('Could not parse Airtable error response:', parseError)
    }
    
    throw new Error(errorMessage)
  }
  
  // Invalider le cache des expérimentations
  airtableCache.invalidate('experimentations')
  
  return res.json();
} 

export async function deleteAnalysisFile(id: string) {
  const url = `${AIRTABLE_API_URL}/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      fields: { 
        'Results - Deepdive': null
      } 
    }),
  });
  
  if (!res.ok) {
    let errorMessage = 'Failed to delete analysis file'
    try {
      const errorData = await res.json()
      console.error('Airtable error response:', errorData)
      if (errorData.error && errorData.error.message) {
        errorMessage = `Airtable error: ${errorData.error.message}`
      }
    } catch (parseError) {
      console.error('Could not parse Airtable error response:', parseError)
    }
    
    throw new Error(errorMessage)
  }
  
  // Invalider le cache des expérimentations
  airtableCache.invalidate('experimentations')
  
  return res.json();
} 

export async function fetchTypes() {
  // Vérifier le cache d'abord
  const cachedData = airtableCache.get<{id: string, name: string}[]>('types')
  if (cachedData) {
    return cachedData
  }

  // Récupérer les types depuis les expérimentations existantes
  const records = await fetchExperimentations();
  const types = Array.from(new Set(records.map(r => (r.fields['Type'] as string) || '').filter(Boolean)));
  
  // Créer un format cohérent avec les autres fonctions
  const typesData = types.map((type, index) => ({
    id: type, // Utiliser le nom comme ID pour la cohérence
    name: type
  }));
  
  // Mettre en cache
  airtableCache.set('types', typesData)
  
  return typesData
} 