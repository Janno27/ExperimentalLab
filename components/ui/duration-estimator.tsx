'use client'

import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { estimateABTestDuration, type ABTestResult } from '@/lib/ab-test-calculator'

interface DurationEstimatorProps {
  audience: string
  conversion: string
  mde: string
  mdeCustom?: string
  trafficAllocation: string
  statisticalConfidence: string
  power?: string
  onEstimationComplete?: (result: ABTestResult) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function DurationEstimator({
  audience,
  conversion,
  mde,
  mdeCustom,
  trafficAllocation,
  statisticalConfidence,
  power = '80',
  onEstimationComplete,
  className = '',
  size = 'md'
}: DurationEstimatorProps) {
  const [estimationResult, setEstimationResult] = useState<ABTestResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const canCalculate = audience && conversion && mde && trafficAllocation

  const handleRunEstimation = async () => {
    if (!canCalculate) return

    setIsCalculating(true)

    // Simulation d'un délai de calcul
    await new Promise(resolve => setTimeout(resolve, 1500))

    const audiencePerDay = parseFloat(audience)
    const conversionsPerDay = parseFloat(conversion)
    const mdeValue = mde === 'custom' ? 
      parseFloat(mdeCustom?.replace(/[^0-9.]/g, '') || '0') / 100 :
      parseFloat(mde.replace(/[^0-9.]/g, '') || '0') / 100
    const trafficExposed = parseFloat(trafficAllocation) / 100
    const alpha = 1 - (parseFloat(statisticalConfidence) / 100)
    const powerValue = parseFloat(power) / 100

    try {
      const result = estimateABTestDuration({
        audiencePerDay,
        conversionsPerDay,
        mde: mdeValue,
        trafficExposed,
        alpha,
        power: powerValue
      })

      setEstimationResult(result)
      onEstimationComplete?.(result)
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'text-xs',
          icon: 'w-3 h-3',
          results: 'text-xs space-y-1'
        }
      case 'lg':
        return {
          button: 'text-base',
          icon: 'w-5 h-5',
          results: 'text-sm space-y-2'
        }
      default:
        return {
          button: 'text-sm',
          icon: 'w-4 h-4',
          results: 'text-sm space-y-1'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Bouton Run Estimation */}
      <button
        onClick={handleRunEstimation}
        disabled={!canCalculate || isCalculating}
        className={`flex items-center gap-2 ${sizeClasses.button} transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          canCalculate && !isCalculating 
            ? 'text-purple-600 hover:text-purple-700 font-medium' 
            : 'text-gray-500 hover:text-purple-600'
        }`}
        title={!canCalculate ? 
          "Veuillez remplir Audience, Conversion, MDE et Traffic Allocation pour lancer l'estimation" : 
          "Lancer l'estimation de durée du test"
        }
      >
        {isCalculating ? (
          <Loader2 className={`${sizeClasses.icon} animate-spin`} />
        ) : (
          <Play className={sizeClasses.icon} />
        )}
        <span>{isCalculating ? 'Calculating...' : 'Run Estimation'}</span>
      </button>

      {/* Résultats de l'estimation */}
      {estimationResult && (
        <div className={`text-gray-600 ${sizeClasses.results}`}>
          <div>Estimated Duration: {estimationResult.durationDays} days</div>
          <div>Sample per Group: {estimationResult.samplePerGroup.toLocaleString()}</div>
          <div>Total Sample: {estimationResult.totalSample.toLocaleString()}</div>
        </div>
      )}
    </div>
  )
}
