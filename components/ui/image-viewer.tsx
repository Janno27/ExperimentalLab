import React, { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'

interface ImageViewerProps {
  isOpen: boolean
  onClose: () => void
  controlImage: unknown
  variationImage: unknown
  title: string
}

// Helper function to extract URL from attachment
function getAttachmentUrl(attachment: unknown): string | null {
  if (!attachment) return null
  if (typeof attachment === 'string') return attachment
  if (typeof attachment === 'object' && attachment !== null) {
    const obj = attachment as Record<string, unknown>
    if (obj.url && typeof obj.url === 'string') return obj.url
  }
  return null
}

export function ImageViewer({ isOpen, onClose, controlImage, variationImage, title }: ImageViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const controlUrl = getAttachmentUrl(controlImage)
  const variationUrl = getAttachmentUrl(variationImage)

  const images = [
    { url: controlUrl, label: 'Control' },
    { url: variationUrl, label: 'Variation 1' }
  ].filter(img => img.url)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handlePreviousImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }, [currentImageIndex])

  const handleNextImage = useCallback(() => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }, [currentImageIndex, images.length])

  React.useEffect(() => {
    if (isOpen) {
      const handleKeyDownEvent = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        } else if (e.key === 'ArrowLeft') {
          handlePreviousImage()
        } else if (e.key === 'ArrowRight') {
          handleNextImage()
        }
      }
      
      document.addEventListener('keydown', handleKeyDownEvent)
      return () => document.removeEventListener('keydown', handleKeyDownEvent)
    }
  }, [isOpen, currentImageIndex, onClose, handleNextImage, handlePreviousImage])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentImageIndex]

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium">{title || 'Image Viewer'}</h2>
            <span className="text-sm text-gray-300">
              {currentImage.label} ({currentImageIndex + 1} of {images.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Content */}
        <div className="flex-1 relative flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            {currentImage.url && (
              <Image
                src={currentImage.url}
                alt={currentImage.label}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain"
                priority
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={handlePreviousImage}
              disabled={currentImageIndex <= 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              title="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={handleNextImage}
              disabled={currentImageIndex >= images.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              title="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  title={`Go to ${images[index].label}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 right-4 text-xs text-white/70">
          Use arrow keys or click to navigate • ESC to close
        </div>
      </div>
    </div>
  )
} 