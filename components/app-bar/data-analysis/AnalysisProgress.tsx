'use client'

import React from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'
import { AnalysisService } from '@/lib/services/analysis.service'

interface AnalysisProgressProps {
  status: string
  progress: number
  elapsedTime: number
  error?: string | null
  onCancel?: () => void
  canCancel?: boolean
}

export function AnalysisProgress({ 
  status, 
  progress, 
  elapsedTime,
  error,
  onCancel,
  canCancel = true
}: AnalysisProgressProps) {
  const formatDuration = (milliseconds: number): string => {
    return AnalysisService.formatDuration(milliseconds)
  }

  const getStatusIcon = () => {
    if (error) {
      return <AlertCircle className="w-6 h-6 text-red-500" />
    }
    if (progress === 100) {
      return <CheckCircle className="w-6 h-6 text-green-500" />
    }
    return null
  }

  const getProgressColor = () => {
    if (error) return 'text-red-600'
    if (progress === 100) return 'text-green-600'
    return 'text-purple-600'
  }

  const getCircleColor = () => {
    if (error) return 'stroke-red-500'
    if (progress === 100) return 'stroke-green-500'
    return 'stroke-purple-600'
  }

  // Calcul de la circonférence pour l'animation du cercle
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress / 100)

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Bouton Cancel */}
      {canCancel && onCancel && !error && progress < 100 && (
        <div className="absolute top-4 right-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cancel analysis"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>
      )}

      {/* Cercle de progression */}
      <div className="relative w-32 h-32 mb-6">
        <svg className="transform -rotate-90 w-32 h-32">
          {/* Cercle de fond */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          {/* Cercle de progression */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${getCircleColor()} transition-all duration-500 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Contenu au centre du cercle */}
        <div className="absolute inset-0 flex items-center justify-center">
          {getStatusIcon() || (
            <span className={`text-2xl font-bold ${getProgressColor()}`}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>

      {/* Informations de statut */}
      <div className="text-center max-w-md">
        <h3 className={`text-lg font-medium mb-2 ${error ? 'text-red-900' : 'text-gray-900'}`}>
          {error ? 'Analysis Failed' : status}
        </h3>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Elapsed time: {formatDuration(elapsedTime)}
            </p>
            
            {/* Barre de progression linéaire supplémentaire */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  progress === 100 ? 'bg-green-500' : 'bg-purple-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages d'étape */}
        {!error && (
          <div className="mt-6 text-xs text-gray-400">
            {progress < 20 && "Preparing data and validating configuration..."}
            {progress >= 20 && progress < 30 && "Starting analysis engine..."}
            {progress >= 30 && progress < 90 && "Running statistical calculations..."}
            {progress >= 90 && progress < 100 && "Finalizing results..."}
            {progress === 100 && "Analysis completed successfully!"}
          </div>
        )}
      </div>

      {/* Estimation du temps restant (seulement si en cours) */}
      {!error && progress > 10 && progress < 100 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            {progress < 50 ? "This may take a few minutes..." : "Almost done..."}
          </p>
        </div>
      )}
    </div>
  )
}

// Composant wrapper pour l'affichage en plein écran
export function AnalysisProgressFullScreen(props: AnalysisProgressProps) {
  return (
    <div className="w-full h-[88vh] overflow-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 relative">
          <AnalysisProgress {...props} />
        </div>
      </div>
    </div>
  )
}
