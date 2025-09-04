export type MetricUnit = 'currency' | 'percentage' | 'count' | 'duration' | 'none'
export type CurrencySymbol = '€' | '$' | '£' | '¥' | 'kr' | 'CHF'

export interface DetectedMetric {
  name: string
  type: 'binary' | 'continuous'
  numerator?: string
  denominator?: string
  valueColumn?: string
  valueColumn2?: string // Pour les ratios dans continuous
  description: string
  // Nouvelles propriétés pour l'affichage
  unit?: MetricUnit
  currency?: CurrencySymbol
  decimals?: number
  isRevenue?: boolean
  suggestedFormat?: string
}

export interface DetectedDimension {
  name: string
  type: 'categorical' | 'temporal'
  description: string
  uniqueValues?: number
  sampleValues?: unknown[]
}

export interface MetricDetectionResult {
  suggestedMetrics: DetectedMetric[]
  dimensions: DetectedDimension[]
  variationColumn?: string
  userColumn?: string
  currencyDetected?: CurrencySymbol
  dataQuality?: {
    score: number
    warnings: string[]
  }
}

// Keywords pour détecter les colonnes de revenus
const REVENUE_KEYWORDS = [
  'revenue', 'sales', 'amount', 'price', 'cost', 'value', 'total',
  'chiffre', 'montant', 'prix', 'vente', // French
  'umsatz', 'betrag', 'preis', // German
  'ingresos', 'ventas', 'precio', 'importe' // Spanish
]

const CURRENCY_PATTERNS = {
  '€': /€|EUR|euro/i,
  '$': /\$|USD|dollar/i,
  '£': /£|GBP|pound/i,
  '¥': /¥|JPY|yen/i,
  'kr': /kr|SEK|NOK|DKK|krona|krone/i,
  'CHF': /CHF|franc/i
}

// const CONVERSION_KEYWORDS = [
//   'conversion', 'purchase', 'order', 'transaction', 'booking', 'signup',
//   'registration', 'subscribe', 'click', 'view', 'visit', 'download',
//   'add_to_cart', 'checkout', 'payment'
// ]

const USER_KEYWORDS = [
  'user', 'visitor', 'customer', 'client', 'session', 'unique',
  'utilisateur', 'visiteur', 'besucher', 'usuario'
]

// Templates de métriques standards
export const METRIC_TEMPLATES = {
  'Conversion Rate': {
    type: 'binary' as const,
    description: 'Percentage of users who converted',
    unit: 'percentage' as MetricUnit,
    pattern: /conversion|purchase|order|transaction/i
  },
  'Revenue per User': {
    type: 'continuous' as const,
    description: 'Average revenue generated per user',
    unit: 'currency' as MetricUnit,
    isRevenue: true,
    pattern: /revenue.*user|rpu|arpu/i
  },
  'Average Order Value': {
    type: 'continuous' as const,
    description: 'Average value per order',
    unit: 'currency' as MetricUnit,
    isRevenue: true,
    pattern: /average.*order|aov|basket|panier/i
  },
  'Click-through Rate': {
    type: 'binary' as const,
    description: 'Percentage of users who clicked',
    unit: 'percentage' as MetricUnit,
    pattern: /click.*rate|ctr/i
  },
  'Items per Cart': {
    type: 'continuous' as const,
    description: 'Average number of items per cart',
    unit: 'count' as MetricUnit,
    pattern: /items|quantity|cart.*size/i
  }
}

// Fonction pour détecter la devise
export function detectCurrency(data: Record<string, unknown>[], column: string): CurrencySymbol | null {
  // Vérifier le nom de la colonne
  for (const [symbol, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    if (pattern.test(column)) {
      return symbol as CurrencySymbol
    }
  }
  
  // Vérifier les valeurs
  const sampleValues = data.slice(0, 100).map(row => String(row[column] || ''))
  for (const [symbol, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    if (sampleValues.some(val => pattern.test(val))) {
      return symbol as CurrencySymbol
    }
  }
  
  // Par défaut EUR pour contexte européen
  if (REVENUE_KEYWORDS.some(keyword => column.toLowerCase().includes(keyword))) {
    return '€'
  }
  
  return null
}

// Fonction pour normaliser les noms de colonnes
export function normalizeColumnName(column: string): string {
  return column
    .trim()
    .replace(/[\s\-\.]+/g, '_')
    .replace(/[^\w]/g, '')
    .toLowerCase()
}

export function detectMetricsFromData(data: Record<string, unknown>[]): MetricDetectionResult {
  if (!data || data.length === 0) {
    return {
      suggestedMetrics: [],
      dimensions: [],
      dataQuality: { score: 0, warnings: ['No data provided'] }
    }
  }

  const columns = Object.keys(data[0])
  const result: MetricDetectionResult = {
    suggestedMetrics: [],
    dimensions: [],
  }
  
  let globalCurrency: CurrencySymbol | undefined

  // Détecter la colonne utilisateurs
  const userColumns = columns.filter(col => 
    USER_KEYWORDS.some(keyword => col.toLowerCase().includes(keyword))
  )
  
  if (userColumns.length > 0) {
    result.userColumn = userColumns[0]
  }

  // Détecter la colonne de variation
  const variationColumns = columns.filter(col => {
    const lower = col.toLowerCase()
    return lower.includes('variation') || lower.includes('variant') ||
           lower.includes('group') || lower.includes('test')
  })
  
  if (variationColumns.length > 0) {
    result.variationColumn = variationColumns[0]
  }

  // Détecter les métriques de conversion binaires spécifiques
  const conversionPatterns = [
    { pattern: /user_pdp_view/i, name: 'PDP View Rate', description: 'Product detail page view conversion rate' },
    { pattern: /user_add_to_cart/i, name: 'Add to Cart Rate', description: 'Add to cart conversion rate' },
    { pattern: /user_begin_checkout/i, name: 'Begin Checkout Rate', description: 'Checkout initiation rate' },
    { pattern: /user_purchase/i, name: 'Purchase Conversion Rate', description: 'Purchase conversion rate' },
    { pattern: /user_signup/i, name: 'Signup Rate', description: 'User registration rate' },
    { pattern: /user_subscription/i, name: 'Subscription Rate', description: 'Subscription conversion rate' }
  ]

  conversionPatterns.forEach(({ pattern, name, description }) => {
    const matchingColumns = columns.filter(col => pattern.test(col))
    matchingColumns.forEach(col => {
      result.suggestedMetrics.push({
        name,
        type: 'binary',
        numerator: col,
        denominator: result.userColumn || 'users',
        description,
        unit: 'percentage',
        decimals: 2,
        suggestedFormat: '{value}%'
      })
    })
  })

  // Détecter les métriques de revenus
  const revenuePatterns = [
    { pattern: /^revenue$/i, name: 'Revenue', description: 'Total revenue', aggregationType: 'total' },
    { pattern: /gross_revenue/i, name: 'Gross Revenue', description: 'Total gross revenue', aggregationType: 'total' },
    { pattern: /net_revenue/i, name: 'Net Revenue', description: 'Total net revenue', aggregationType: 'total' },
    { pattern: /gross_margin/i, name: 'Gross Margin', description: 'Total gross margin', aggregationType: 'total' }
  ]

  revenuePatterns.forEach(({ pattern, name, description }) => {
    const matchingColumns = columns.filter(col => pattern.test(col))
    matchingColumns.forEach(col => {
      const currency = detectCurrency(data, col)
      if (currency && !globalCurrency) globalCurrency = currency
      
      result.suggestedMetrics.push({
        name,
        type: 'continuous',
        valueColumn: col,
        description,
        unit: 'currency',
        currency: currency || '€',
        decimals: 2,
        isRevenue: true,
        suggestedFormat: `${currency || '€'}{value}`
      })
    })
  })

  // Détecter les métriques composites (ratios)
  const revenueCol = columns.find(c => /revenue/i.test(c))
  const purchasesCol = columns.find(c => /purchase/i.test(c) && !c.toLowerCase().includes('user_'))
  const usersCol = result.userColumn

  if (revenueCol && purchasesCol) {
    const currency = detectCurrency(data, revenueCol)
    result.suggestedMetrics.push({
      name: 'Average Order Value (AOV)',
      type: 'continuous',
      numerator: revenueCol,
      denominator: purchasesCol,
      valueColumn: revenueCol,
      valueColumn2: purchasesCol,
      description: 'Average revenue per order',
      unit: 'currency',
      currency: currency || '€',
      decimals: 2,
      isRevenue: true,
      suggestedFormat: `${currency || '€'}{value}`
    })
  }

  if (revenueCol && usersCol) {
    const currency = detectCurrency(data, revenueCol)
    result.suggestedMetrics.push({
      name: 'Revenue per User (RPU)',
      type: 'continuous',
      numerator: revenueCol,
      denominator: usersCol,
      valueColumn: revenueCol,
      valueColumn2: usersCol,
      description: 'Average revenue per user',
      unit: 'currency',
      currency: currency || '€',
      decimals: 2,
      isRevenue: true,
      suggestedFormat: `${currency || '€'}{value}`
    })
  }

  // Détecter les métriques de volume/comptage
  const countPatterns = [
    { pattern: /^purchases$/i, name: 'Total Purchases', description: 'Total number of purchases' },
    { pattern: /^quantity$/i, name: 'Total Quantity Sold', description: 'Total quantity of items sold' },
    { pattern: /matched_orders/i, name: 'Matched Orders', description: 'Number of matched orders' }
  ]

  countPatterns.forEach(({ pattern, name, description }) => {
    const matchingColumns = columns.filter(col => pattern.test(col))
    matchingColumns.forEach(col => {
      result.suggestedMetrics.push({
        name,
        type: 'continuous',
        valueColumn: col,
        description,
        unit: 'count',
        decimals: 0,
        suggestedFormat: '{value} items'
      })
    })
  })

  // Détecter les métriques de funnel
  const funnelMetrics = [
    {
      name: 'Cart to Purchase Rate',
      numerator: 'user_purchases',
      denominator: 'user_add_to_cart',
      description: 'Conversion rate from cart to purchase'
    },
    {
      name: 'Checkout to Purchase Rate',
      numerator: 'user_purchases',
      denominator: 'user_begin_checkout',
      description: 'Conversion rate from checkout to purchase'
    },
    {
      name: 'PDP to Cart Rate',
      numerator: 'user_add_to_cart',
      denominator: 'user_pdp_views',
      description: 'Conversion rate from PDP view to cart'
    }
  ]

  funnelMetrics.forEach(({ name, numerator, denominator, description }) => {
    const hasNumerator = columns.some(col => col.toLowerCase() === numerator.toLowerCase())
    const hasDenominator = columns.some(col => col.toLowerCase() === denominator.toLowerCase())
    
    if (hasNumerator && hasDenominator) {
      result.suggestedMetrics.push({
        name,
        type: 'binary',
        numerator,
        denominator,
        description,
        unit: 'percentage',
        decimals: 2,
        suggestedFormat: '{value}%'
      })
    }
  })

  // Détecter les dimensions
  const dimensionColumns = columns.filter(col => {
    const lowerCol = col.toLowerCase()
    return (
      lowerCol.includes('device') ||
      lowerCol.includes('category') ||
      lowerCol.includes('country') ||
      lowerCol.includes('browser') ||
      lowerCol.includes('source') ||
      lowerCol.includes('campaign') ||
      lowerCol.includes('product')
    )
  })

  dimensionColumns.forEach(dimension => {
    const dimensionName = dimension.replace(/_/g, ' ')
    const uniqueValues = new Set(data.map(row => row[dimension])).size
    
    result.dimensions.push({
      name: dimensionName.charAt(0).toUpperCase() + dimensionName.slice(1),
      type: 'categorical',
      description: `${dimensionName} for filtering and segmentation`,
      uniqueValues,
      sampleValues: Array.from(new Set(data.slice(0, 5).map(row => row[dimension])))
    })
  })

  // Calculer la qualité des données
  result.dataQuality = calculateDataQuality(data)
  result.currencyDetected = globalCurrency

  return result
}

// Fonction pour valider si une colonne contient des valeurs numériques
export function isNumericColumn(data: Record<string, unknown>[], column: string): boolean {
  if (!data || data.length === 0) return false
  
  const sampleSize = Math.min(100, data.length)
  let numericCount = 0
  
  for (let i = 0; i < sampleSize; i++) {
    const value = data[i][column]
    if (value !== null && value !== undefined && value !== '') {
      const numValue = parseFloat(String(value))
      if (!isNaN(numValue)) {
        numericCount++
      }
    }
  }
  
  return (numericCount / sampleSize) >= 0.8
}

// Calculer la qualité des données
function calculateDataQuality(data: Record<string, unknown>[]): { score: number; warnings: string[] } {
  const warnings: string[] = []
  let score = 1.0

  // Vérifier les valeurs manquantes
  const totalCells = Object.keys(data[0]).length * data.length
  let missingCells = 0
  
  data.forEach(row => {
    Object.values(row).forEach(value => {
      if (value == null || value === '') missingCells++
    })
  })

  const missingPercentage = (missingCells / totalCells) * 100
  if (missingPercentage > 10) {
    warnings.push(`${missingPercentage.toFixed(1)}% of data is missing`)
    score -= missingPercentage / 100
  }

  // Vérifier la taille de l'échantillon
  if (data.length < 100) {
    warnings.push('Small sample size may affect statistical significance')
    score -= 0.2
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    warnings
  }
}

// Fonction pour améliorer la détection avec templates
export function enhanceMetricDetection(data: Record<string, unknown>[], initialResult: MetricDetectionResult): MetricDetectionResult {
  const enhancedResult = { ...initialResult }
  const columns = Object.keys(data[0] || {})
  
  // Appliquer les templates
  Object.entries(METRIC_TEMPLATES).forEach(([templateName, template]) => {
    const matchingColumn = columns.find(col => template.pattern.test(col))
    
    if (matchingColumn && !enhancedResult.suggestedMetrics.some(m => m.name === templateName)) {
      const isRevenue = 'isRevenue' in template ? template.isRevenue : false
      const currency = isRevenue ? detectCurrency(data, matchingColumn) : undefined
      
      enhancedResult.suggestedMetrics.push({
        name: templateName,
        type: template.type,
        description: template.description,
        valueColumn: template.type === 'continuous' ? matchingColumn : undefined,
        numerator: template.type === 'binary' ? matchingColumn : undefined,
        denominator: template.type === 'binary' ? enhancedResult.userColumn : undefined,
        unit: template.unit,
        currency: currency || (isRevenue ? '€' : undefined),
        decimals: template.unit === 'percentage' ? 2 : template.unit === 'currency' ? 2 : 0,
        isRevenue: isRevenue,
        suggestedFormat: template.unit === 'percentage' ? '{value}%' : 
                        template.unit === 'currency' ? `${currency || '€'}{value}` : 
                        '{value}'
      })
    }
  })

  // Détecter les métriques composites (AOV, etc.)
  const revenueCol = columns.find(c => /revenue|sales|amount/i.test(c))
  const ordersCol = columns.find(c => /order|purchase|transaction/i.test(c))
  
  if (revenueCol && ordersCol && !enhancedResult.suggestedMetrics.some(m => m.name === 'Average Order Value')) {
    const currency = detectCurrency(data, revenueCol)
    enhancedResult.suggestedMetrics.push({
      name: 'Average Order Value',
      type: 'continuous',
      description: 'Average revenue per order',
      valueColumn: revenueCol,
      valueColumn2: ordersCol, // Utilisé pour le ratio
      unit: 'currency',
      currency: currency || '€',
      decimals: 2,
      isRevenue: true,
      suggestedFormat: `${currency || '€'}{value}`
    })
  }
  
  return enhancedResult
}