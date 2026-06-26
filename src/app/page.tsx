'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://photo.parameedev.online/api/v1'
const FACE_URL = process.env.NEXT_PUBLIC_FACE_URL || 'https://photo.parameedev.online/face'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'gallery' | 'face'>(searchParams.get('tab') === 'face' ? 'face' : 'gallery')
  const [albums, setAlbums] = useState<any[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loadingAlbums, setLoadingAlbums] = useState(true)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)

  // Face search state
  const [faceMode, setFaceMode] = useState<'upload' | 'camera'>('upload')
  const [faceImage, setFaceImage] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState<string | null>(null)
  const [faceResults, setFaceResults] = useState<any[]>([])
  const [faceLoading, setFaceLoading] = useState(false)
  const [faceError, setFaceError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    fetch(`${API}/albums`)
      .then(r => r.json())
      .then(d => setAlbums(d.data ?? []))
      .finally(() => setLoadingAlbums(false))
  }, [])

  const openAlbum = (album: any) => {
    router.push(`/albums/${album.id}`)
  }

  // Camera
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    setCameraStream(stream)
    if (videoRef.current) videoRef.current.srcObject = stream
  }
  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop())
    setCameraStream(null)
  }
  const captureCamera = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      setFaceImage(file)
      setFacePreview(URL.createObjectURL(blob))
      stopCamera()
    }, 'image/jpeg')
  }

  const searchFace = async () => {
    if (!faceImage) return
    setFaceLoading(true)
    setFaceError(null)
    setFaceResults([])
    try {
      const fd = new FormData()
      fd.append('image', faceImage)
      const res = await fetch(`${FACE_URL}/search-faces`, { method: 'POST', body: fd })
      const d = await res.json()
      setFaceResults(d.results ?? d.matches ?? [])
    } catch {
      setFaceError('ค้นหาไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setFaceLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">📸 Photo Gallery</span>
          <div className="flex gap-1">
            <button
              onClick={() => setTab('gallery')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'gallery'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setTab('face')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'face'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Face Search
            </button>
          </div>
        </div>
      </nav>

      {/* Gallery Tab */}
      {tab === 'gallery' && (
        <main className="max-w-6xl mx-auto px-4 py-8">
          {!selectedAlbum ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Albums</h1>
              {loadingAlbums ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : albums.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-5xl mb-4">🗂️</p>
                  <p>ยังไม่มี album</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albums.map(album => (
                    <button
                      key={album.id}
                      onClick={() => openAlbum(album)}
                      className="group text-left rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
                        {album.cover_url ? (
                          <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">🗂️</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-gray-900 text-sm truncate">{album.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(album.created_at).toLocaleDateString('th-TH')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { setSelectedAlbum(null); setPhotos([]) }}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  ← กลับ
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{selectedAlbum.name}</h1>
              </div>
              {loadingPhotos ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-20 text-gray-400">ยังไม่มีรูปใน album นี้</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {photos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photo.thumbnail_url || photo.jpeg_url}
                        alt={photo.original_name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* Face Search Tab */}
      {tab === 'face' && (
        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Face Search</h1>
            <p className="text-gray-400 text-sm mt-1">ค้นหาใบหน้าในคลัง</p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setFaceMode('upload'); stopCamera() }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${faceMode === 'upload' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              อัพโหลดรูป
            </button>
            <button
              onClick={() => { setFaceMode('camera'); startCamera() }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${faceMode === 'camera' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              ถ่ายรูป
            </button>
          </div>

          {/* Upload mode */}
          {faceMode === 'upload' && (
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center h-56 transition-colors ${facePreview ? 'border-indigo-300' : 'border-gray-200 hover:border-indigo-300'}`}>
                {facePreview ? (
                  <img src={facePreview} alt="preview" className="h-full w-full object-contain rounded-2xl" />
                ) : (
                  <>
                    <span className="text-4xl mb-2">📷</span>
                    <p className="text-gray-400 text-sm">คลิกเพื่อเลือกรูป</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  setFaceImage(f)
                  setFacePreview(URL.createObjectURL(f))
                  setFaceResults([])
                }}
              />
            </label>
          )}

          {/* Camera mode */}
          {faceMode === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden bg-black h-56 flex items-center justify-center">
              {facePreview ? (
                <img src={facePreview} alt="capture" className="h-full w-full object-contain" />
              ) : (
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              )}
              {!facePreview && (
                <button
                  onClick={captureCamera}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                >
                  📸
                </button>
              )}
            </div>
          )}

          {/* Reset */}
          {facePreview && (
            <button
              onClick={() => { setFaceImage(null); setFacePreview(null); setFaceResults([]); setFaceError(null) }}
              className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              เลือกรูปใหม่
            </button>
          )}

          {/* Search button */}
          <button
            onClick={searchFace}
            disabled={!faceImage || faceLoading}
            className="w-full mt-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {faceLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>

          {/* Error */}
          {faceError && <p className="mt-3 text-center text-red-500 text-sm">{faceError}</p>}

          {/* Results */}
          {faceResults.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-700 mb-3">พบ {faceResults.length} รูป</p>
              <div className="grid grid-cols-3 gap-2">
                {faceResults.map((r, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-square bg-gray-100">
                    <img
                      src={r.thumbnail_url || r.jpeg_url || r.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {faceResults.length === 0 && !faceLoading && faceImage && !faceError && (
            <p className="mt-6 text-center text-gray-400 text-sm">ไม่พบใบหน้าที่ตรงกัน</p>
          )}
        </main>
      )}

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-2xl"
            >
              ✕
            </button>
            <img
              src={selectedPhoto.jpeg_url || selectedPhoto.thumbnail_url}
              alt={selectedPhoto.original_name}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-white/60 text-sm text-center mt-3">{selectedPhoto.original_name}</p>
          </div>
        </div>
      )}
    </div>
  )
}
