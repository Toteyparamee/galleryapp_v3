'use client'
import { useEffect, useState, useCallback } from 'react'
import { getAlbum, getPhotos, Album, Photo } from '@/lib/api'
import { PhotoGrid } from '@/components/gallery/PhotoGrid'
import { UploadZone } from '@/components/upload/UploadZone'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Button } from '@/components/ui/button'
import { Upload, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { use } from 'react'

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const albumId = Number(id)

  const [album, setAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  const loadPhotos = useCallback(async () => {
    try {
      const data = await getPhotos(albumId)
      setPhotos(data ?? [])
    } catch {
      toast.error('Failed to load photos')
    }
  }, [albumId])

  useEffect(() => {
    Promise.all([
      getAlbum(albumId).then(setAlbum).catch(() => toast.error('Album not found')),
      loadPhotos(),
    ]).finally(() => setLoading(false))
  }, [albumId, loadPhotos])

  useWebSocket(event => {
    if (event.type === 'photo.completed' || event.type === 'gallery.updated') {
      loadPhotos()
    }
  })

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{album?.name}</h1>
          {album?.description && <p className="text-gray-400 text-sm">{album.description}</p>}
        </div>
        <span className="text-gray-500 text-sm">{photos.length} photos</span>
        <Button onClick={() => setShowUpload(v => !v)}>
          <Upload className="w-4 h-4 mr-1" /> Upload
        </Button>
      </div>

      {showUpload && (
        <div className="mb-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <UploadZone albumId={albumId} onDone={() => { setShowUpload(false); loadPhotos() }} />
        </div>
      )}

      <PhotoGrid photos={photos} />
    </div>
  )
}
