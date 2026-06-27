'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

import { use } from 'react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://photo.parameedev.online/api/v1'

interface UploadItem {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [album, setAlbum] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPhotos = () =>
    fetch(`${BASE_URL}/gallery?album_id=${id}&limit=100`).then(r => r.json()).then(d => setPhotos(d.data ?? []))

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/albums/${id}`).then(r => r.json()).then(d => setAlbum(d.data ?? d)),
      loadPhotos(),
    ]).finally(() => setLoading(false))
  }, [id])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const items: UploadItem[] = files.map(f => ({ file: f, progress: 0, status: 'pending' }))
    setUploads(items)
    startUpload(items)
    e.target.value = ''
  }

  const startUpload = async (items: UploadItem[]) => {
    setUploading(true)
    for (let i = 0; i < items.length; i++) {
      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'uploading' } : u))
      try {
        await new Promise<void>((resolve, reject) => {
          const form = new FormData()
          form.append('file', items[i].file)
          form.append('album_id', id)
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${BASE_URL}/upload`)
          xhr.upload.onprogress = e => {
            const pct = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0
            setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, progress: pct } : u))
          }
          xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`))
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(form)
        })
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'done', progress: 100 } : u))
      } catch (err: any) {
        setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: 'error', error: err.message } : u))
      }
    }
    setUploading(false)
    await loadPhotos()
  }

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
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'กำลังอัพโหลด...' : '+ อัพโหลดรูป'}
          </button>
          <Link href="/?tab=face" className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            🔍 Face Search
          </Link>
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-100 space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 truncate max-w-[160px]">{u.file.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${u.status === 'error' ? 'bg-red-400' : 'bg-indigo-500'}`}
                  style={{ width: `${u.progress}%` }}
                />
              </div>
              <span className="text-xs w-14 text-right text-gray-400">
                {u.status === 'done' ? '✓ เสร็จ' : u.status === 'error' ? '✗ ผิดพลาด' : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
          <p>ยังไม่มีรูปใน album นี้</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + อัพโหลดรูปแรก
          </button>
        </div>
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
