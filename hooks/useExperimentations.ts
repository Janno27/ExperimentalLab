import { useEffect, useState } from 'react'
import { fetchExperimentations, fetchMarkets, fetchOwners, fetchKPIs, fetchPages, fetchProducts } from '@/lib/airtable'

export const COLUMN_ORDER = [
  'To be prioritized',
  'Denied',
  'Open',
  'Refinement',
  'Design & Development',
  'Setup',
  'Running',
  'Ready for Analysis',
  'Analysing',
  'Done',
]

export interface MarketRef { id: string; name: string }
export interface OwnerRef { id: string; name: string }
export interface Experimentation {
  id: string
  name: string
  status: string
  market: MarketRef[]
  owner: OwnerRef[]
  role?: string
  scope?: string
  startDate?: string
  endDate?: string
  [key: string]: any
}

export function useExperimentations({ useAirtable = true } = {}) {
  const [cards, setCards] = useState<Experimentation[]>([])
  const [markets, setMarkets] = useState<MarketRef[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [scopes, setScopes] = useState<string[]>([])
  const [kpis, setKpis] = useState<{id: string, name: string}[]>([])
  const [pages, setPages] = useState<{id: string, name: string}[]>([])
  const [products, setProducts] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!useAirtable) return
    setLoading(true)
    Promise.all([
      fetchExperimentations(),
      fetchMarkets(),
      fetchOwners(),
      fetchKPIs(),
      fetchPages(),
      fetchProducts()
    ])
      .then(([records, marketRecords, ownerRecords, kpiRecords, pageRecords, productRecords]) => {
        const marketMap = Object.fromEntries(marketRecords.map((m: MarketRef) => [m.id, m.name]))
        const ownerMap = Object.fromEntries(ownerRecords.map((o: OwnerRef) => [o.id, o.name]))
        const cards = records.map((r: any) => ({
          id: r.id,
          name: r.fields.Name || r.fields["Short Name"] || 'Untitled',
          status: r.fields.Status || '',
          market: Array.isArray(r.fields.Market)
            ? r.fields.Market.map((id: string) => ({ id, name: marketMap[id] || id }))
            : [],
          owner: Array.isArray(r.fields.Owner)
            ? r.fields.Owner.map((id: string) => ({ id, name: ownerMap[id] || id }))
            : [],
          role: r.fields.Role || '',
          scope: r.fields.Scope || r.fields.Scole || '',
          startDate: r.fields["Start Date"] || '',
          endDate: r.fields["End Date"] || '',
          ...r.fields,
        }))
        setCards(cards)
        setMarkets(marketRecords)
        setRoles(Array.from(new Set(cards.map((c: Experimentation) => c.role).filter((v): v is string => Boolean(v)))));
        setScopes(Array.from(new Set(cards.map((c: Experimentation) => c.scope).filter((v): v is string => Boolean(v)))));
        setKpis(kpiRecords)
        setPages(pageRecords)
        setProducts(productRecords)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [useAirtable])

  return { columns: COLUMN_ORDER, cards, markets, roles, scopes, kpis, pages, products, loading, error }
} 