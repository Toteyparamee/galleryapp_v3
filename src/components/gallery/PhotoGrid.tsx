'use client'
import { Photo } from '@/lib/api'
import { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { PhotoLightbox } from './PhotoLightbox'

interface Props { photos: Photo[] }

export function PhotoGrid({ photos }: Props) {
  const [selected, setSelected] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-3" />
        <p>No photos yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
        {photos.map(photo => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo)}
            className="aspect-square bg-gray-800 overflow-hidden relative group"
          >
            {photo.thumbnail_path ? (
              <img
                src={photo.thumbnail_path}
                alt={photo.original_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {photo.status === 'processing' || photo.status === 'pending' ? (
                  <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
            )}
            {photo.status !== 'completed' && photo.thumbnail_path && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <PhotoLightbox
          photo={selected}
          photos={photos}
          onClose={() => setSelected(null)}
          onChange={setSelected}
        />
      )}
    </>
  )
}
