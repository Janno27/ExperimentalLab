import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  title?: string
}

export function PDFViewer({ isOpen, onClose, pdfUrl }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(1)

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }



  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-2" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">


        {/* PDF Content */}
        <div className="flex-1 relative">
          <iframe
            src={`${pdfUrl}#page=${currentPage}`}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={() => {
              // Note: Getting total pages from PDF.js would require additional setup
              // For now, we'll assume it's a single page or handle it differently
            }}
          />
        </div>

        {/* Navigation Footer - Compact */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 p-2 border-t border-gray-200">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Previous
            </button>
            <span className="text-xs text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 