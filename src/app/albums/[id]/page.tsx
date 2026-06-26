'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

import { use } from 'react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://photo.parameedev.online/api/v1'

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [album, setAlbum] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/albums/${id}`).then(r => r.json()).then(d => setAlbum(d.data ?? d)),
      fetch(`${BASE_URL}/gallery?album_id=${id}&limit=100`).then(r => r.json()).then(d => setPhotos(d.data ?? [])),
    ]).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{album?.name}</h1>
            <p className="text-xs text-gray-400">{photos.length} photos</p>
          </div>
        </div>
        <Link href="/?tab=face" className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          🔍 Face Search
        </Link>
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">No photos</div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 p-2">
          {photos.map((photo: any) => (
            <div key={photo.id} className="aspect-square cursor-pointer overflow-hidden bg-gray-100"
              onClick={() => setSelectedPhoto(photo)}>
              <img
                src={photo.thumbnail_url || photo.jpeg_url}
                alt={photo.original_name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-white text-2xl"
              onClick={() => setSelectedPhoto(null)}>✕</button>
            <img
              src={selectedPhoto.jpeg_url || selectedPhoto.thumbnail_url}
              alt={selectedPhoto.original_name}
              className="w-full rounded-lg max-h-[85vh] object-contain"
            />
            <p className="text-white text-sm text-center mt-2 opacity-70">{selectedPhoto.original_name}</p>
          </div>
        </div>
      )}
    </div>
  )
}
