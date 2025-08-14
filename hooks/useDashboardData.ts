import { useState, useEffect, useMemo } from 'react'
import { fetchExperimentations, fetchOwners } from '@/lib/airtable'
import { airtableCache } from '@/lib/cache'

export interface DashboardDataOptions {
  region?: 'APAC' | 'EMEA' | 'AMER'
  status?: string[]
  owner?: string[]
  market?: string[]
  selectedMonth?: Date
}

export interface DashboardData {
  experimentations: any[]
  owners: any[]
  loading: boolean
  error: string | null
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  const { region } = options
  const [data, setData] = useState<DashboardData>({
    experimentations: [],
    owners: [],
    loading: true,
    error: null
  })

  // Charger les données une seule fois pour toute la page
  useEffect(() => {
    const loadData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))
        
        // Charger les experimentations
        const expParams = region ? { region } : undefined
        let experimentations = airtableCache.get('experimentations', expParams) as any[]
        
        if (!experimentations) {
          experimentations = await fetchExperimentations()
          airtableCache.set('experimentations', experimentations, expParams)
        }
        
        // Charger les owners
        let owners = airtableCache.get('owners') as any[]
        if (!owners) {
          owners = await fetchOwners()
          airtableCache.set('owners', owners)
        }
        
        setData({
          experimentations: experimentations || [],
          owners: owners || [],
          loading: false,
          error: null
        })
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Impossible de charger les données'
        }))
      }
    }

    loadData()
  }, [region])

  // Filtrer les données selon les critères appliqués
  const filteredExperimentations = useMemo(() => {
    if (!data.experimentations || data.experimentations.length === 0) return []
    
    let filtered = data.experimentations

    // Filtrer par région
    if (region) {
      filtered = filtered.filter(record => {
        const recordRegion = record.fields.Region
        if (Array.isArray(recordRegion)) {
          return recordRegion.includes(region)
        }
        return recordRegion === region
      })
    }

    // Filtrer par status
    if (options.status && options.status.length > 0) {
      filtered = filtered.filter(record => 
        options.status!.includes(record.fields.Status)
      )
    }

    // Filtrer par owner
    if (options.owner && options.owner.length > 0) {
      filtered = filtered.filter(record => {
        const recordOwners = record.fields.Owner || []
        return options.owner!.some(ownerName => {
          // Correspondance ID->nom avec les données owners
          const ownerRecord = data.owners.find(o => o.name === ownerName)
          return ownerRecord && recordOwners.includes(ownerRecord.id)
        })
      })
    }

    // Filtrer par market
    if (options.market && options.market.length > 0) {
      filtered = filtered.filter(record => {
        const recordMarkets = record.fields.Market || []
        return options.market!.some(marketId => recordMarkets.includes(marketId))
      })
    }

    return filtered
  }, [data.experimentations, data.owners, region, options.status, options.owner, options.market])

  return {
    ...data,
    filteredExperimentations
  }
} 