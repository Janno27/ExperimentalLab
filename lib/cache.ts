// lib/cache.ts

interface CacheEntry<T> {
  data: T
  timestamp: number
  etag?: string
}

interface CacheConfig {
  ttl: number // Time to live en millisecondes
  maxSize: number // Nombre maximum d'entrées en cache
}

class AirtableCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private config: CacheConfig
  private lastSyncTimestamp = 0
  private syncInterval: NodeJS.Timeout | null = null

  constructor(config: CacheConfig = { ttl: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config
    this.startPeriodicSync()
  }

  // Générer une clé de cache basée sur les paramètres
  private generateKey(endpoint: string, params?: Record<string, unknown>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramString}`
  }

  // Vérifier si une entrée de cache est valide
  private isEntryValid(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp < this.config.ttl
  }

  // Nettoyer le cache en supprimant les entrées expirées
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key)
      }
    }

    // Si le cache est trop plein, supprimer les entrées les plus anciennes
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, this.cache.size - this.config.maxSize)
      toDelete.forEach(([key]) => this.cache.delete(key))
    }
  }

  // Obtenir des données du cache
  get<T>(endpoint: string, params?: Record<string, unknown>): T | null {
    this.cleanupCache()
    
    const key = this.generateKey(endpoint, params)
    const entry = this.cache.get(key)
    
    if (entry && this.isEntryValid(entry)) {
      return entry.data as T
    }
    
    return null
  }

  // Mettre des données en cache
  set<T>(endpoint: string, data: T, params?: Record<string, unknown>, etag?: string): void {
    this.cleanupCache()
    
    const key = this.generateKey(endpoint, params)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag
    })
  }

  // Invalider le cache pour un endpoint spécifique
  invalidate(endpoint: string, params?: Record<string, unknown>): void {
    const key = this.generateKey(endpoint, params)
    this.cache.delete(key)
  }

  // Invalider tout le cache
  invalidateAll(): void {
    this.cache.clear()
  }

  // Vérifier si des données ont changé côté serveur
  async checkForUpdates(endpoint: string, etag?: string): Promise<boolean> {
    if (!etag) return true // Pas d'ETag, considérer comme modifié
    
    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        headers: {
          'If-None-Match': etag
        }
      })
      
      return response.status !== 304 // 304 = Not Modified
    } catch (error) {
      console.error('Error checking for updates:', error)
      return true // En cas d'erreur, considérer comme modifié
    }
  }

  // Synchronisation périodique avec le serveur
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      this.syncWithServer()
    }, 30000) // Vérifier toutes les 30 secondes
  }

  // Synchroniser avec le serveur
  private async syncWithServer(): Promise<void> {
    const now = Date.now()
    
    // Ne pas synchroniser trop fréquemment
    if (now - this.lastSyncTimestamp < 30000) {
      return
    }

    try {
      // Vérifier les mises à jour pour les endpoints principaux
      const endpoints = [
        'experimentations',
        'markets', 
        'owners',
        'kpis',
        'pages',
        'products',
        'testTypes'
      ]

      for (const endpoint of endpoints) {
        const key = this.generateKey(endpoint)
        const entry = this.cache.get(key)
        
        if (entry?.etag) {
          const hasUpdates = await this.checkForUpdates(
            this.getEndpointUrl(endpoint),
            entry.etag
          )
          
          if (hasUpdates) {
            this.invalidate(endpoint)
            console.log(`Cache invalidated for ${endpoint} due to server changes`)
          }
        }
      }
      
      this.lastSyncTimestamp = now
    } catch (error) {
      console.error('Error during cache sync:', error)
    }
  }

  // Obtenir l'URL d'un endpoint
  private getEndpointUrl(endpoint: string): string {
    const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || ''
    
    const tableMap: Record<string, string> = {
      experimentations: process.env.NEXT_PUBLIC_AIRTABLE_TABLE_ID || '',
      markets: process.env.NEXT_PUBLIC_AIRTABLE_MARKET_TABLE_ID || '',
      owners: process.env.NEXT_PUBLIC_AIRTABLE_OWNER_TABLE_ID || '',
      kpis: process.env.NEXT_PUBLIC_AIRTABLE_KPI_TABLE_ID || '',
      pages: process.env.NEXT_PUBLIC_AIRTABLE_PAGE_TABLE_ID || '',
      products: process.env.NEXT_PUBLIC_AIRTABLE_PRODUCT_TABLE_ID || '',
      testTypes: process.env.NEXT_PUBLIC_AIRTABLE_TEST_TYPE_TABLE_ID || ''
    }
    
    const tableId = tableMap[endpoint]
    return `https://api.airtable.com/v0/${baseId}/${tableId}`
  }

  // Arrêter la synchronisation périodique
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Obtenir les statistiques du cache
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0 // À implémenter si nécessaire
    }
  }
}

// Instance singleton du cache
export const airtableCache = new AirtableCache()

// Hook pour utiliser le cache dans les composants React
export function useCache() {
  return {
    get: airtableCache.get.bind(airtableCache),
    set: airtableCache.set.bind(airtableCache),
    invalidate: airtableCache.invalidate.bind(airtableCache),
    invalidateAll: airtableCache.invalidateAll.bind(airtableCache),
    getStats: airtableCache.getStats.bind(airtableCache)
  }
}

// Fonction utilitaire pour forcer la synchronisation
export function forceCacheSync(): void {
  airtableCache.invalidateAll()
}

// Fonction utilitaire pour obtenir les statistiques du cache
export function getCacheStats() {
  return airtableCache.getStats()
} 