// lib/airtable.ts

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
  let allRecords: AirtableRecord[] = [];
  let offset: string | undefined = undefined;
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
    const data: AirtableResponse = await res.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
  } while (offset);
  // Ajout explicite des champs Success Criteria #1, #2, #3 dans chaque record
  return allRecords.map(r => ({
    ...r,
    fields: {
      ...r.fields,
      'Success Criteria #1': r.fields['Success Criteria #1'] || '',
      'Success Criteria #2': r.fields['Success Criteria #2'] || '',
      'Success Criteria #3': r.fields['Success Criteria #3'] || '',
    }
  }))
}

export async function fetchMarkets() {
  const res = await fetch(AIRTABLE_MARKET_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch markets');
  const data: AirtableResponse = await res.json();
  return data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Market as string) || '' 
  }));
}

export async function fetchOwners() {
  const res = await fetch(AIRTABLE_OWNER_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch owners');
  const data: AirtableResponse = await res.json();
  return data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || '' 
  }));
}

export async function fetchKPIs() {
  const res = await fetch(AIRTABLE_KPI_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch KPIs');
  const data: AirtableResponse = await res.json();
  return data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || (r.fields.KPI as string) || '' 
  }));
}

export async function fetchPages() {
  const res = await fetch(AIRTABLE_PAGE_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch Pages');
  const data: AirtableResponse = await res.json();
  return data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || (r.fields.Page as string) || '' 
  }));
}

export async function fetchProducts() {
  const res = await fetch(AIRTABLE_PRODUCT_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch Products');
  const data: AirtableResponse = await res.json();
  return data.records.map((r: AirtableRecord) => ({ 
    id: r.id, 
    name: (r.fields.Name as string) || (r.fields.Product as string) || '' 
  }));
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
  if (!res.ok) throw new Error('Failed to update fields');
  return res.json();
}

export async function fetchTestTypes() {
  const res = await fetch(AIRTABLE_TEST_TYPE_API_URL, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch Test Types');
  const data: AirtableResponse = await res.json();
  return data.records.map((r: AirtableRecord) => ({
    id: r.id,
    name: (r.fields.Name as string) || ''
  }));
} 