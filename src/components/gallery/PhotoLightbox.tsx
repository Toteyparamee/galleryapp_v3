'use client'
import { Photo } from '@/lib/api'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useEffect, useCallback } from 'react'

interface Props {
  photo: Photo
  photos: Photo[]
  onClose: () => void
  onChange: (p: Photo) => void
}

export function PhotoLightbox({ photo, photos, onClose, onChange }: Props) {
  const idx = photos.indexOf(photo)

  const prev = useCallback(() => {
    if (idx > 0) onChange(photos[idx - 1])
  }, [idx, photos, onChange])

  const next = useCallback(() => {
    if (idx < photos.length - 1) onChange(photos[idx + 1])
  }, [idx, photos, onChange])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative max-w-6xl max-h-full p-4" onClick={e => e.stopPropagation()}>
        {photo.jpeg_path ? (
          <img
            src={photo.jpeg_path}
            alt={photo.original_name}
            className="max-h-[85vh] max-w-full object-contain rounded"
          />
        ) : (
          <div className="w-96 h-64 bg-gray-800 rounded flex items-center justify-center text-gray-500">
            Processing...
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2">
          {photo.jpeg_path && (
            <a
              href={photo.jpeg_path}
              download={photo.original_name}
              className="p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button onClick={onClose} className="p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {idx > 0 && (
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {idx < photos.length - 1 && (
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <p className="text-center text-gray-400 text-sm mt-2">{photo.original_name}</p>
      </div>
    </div>
  )
}
