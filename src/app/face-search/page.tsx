'use client'
import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const FACE_URL = process.env.NEXT_PUBLIC_FACE_URL || 'https://photo.parameedev.online/face'

function NavBar() {
  const path = usePathname()
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">📸 Photo Gallery</Link>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`}>Gallery</Link>
          <Link href="/face-search" className={`nav-link ${path === '/face-search' ? 'active' : ''}`}>Face Search</Link>
        </div>
      </div>
    </nav>
  )
}

export default function FaceSearch() {
  const [searchMode, setSearchMode] = useState<'camera' | 'upload'>('upload')
  const [cameraActive, setCameraActive] = useState(false)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {
      alert('Cannot access camera')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  const captureAndSearch = async () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async blob => {
      if (!blob) return
      setPreviewImage(canvas.toDataURL('image/jpeg'))
      await searchFace(blob)
    }, 'image/jpeg')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewImage(URL.createObjectURL(file))
    await searchFace(file)
  }

  const searchFace = async (blob: Blob | File) => {
    setSearching(true); setResults([])
    try {
      const form = new FormData()
      form.append('file', blob, 'face.jpg')
      const res = await fetch(`${FACE_URL}/search-faces`, { method: 'POST', body: form })
      const data = await res.json()
      setResults(data.matches ?? data.results ?? [])
    } catch {
      alert('Face search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="app">
      <NavBar />
      <div className="face-search">
        <div className="search-container">
          <h1>🔍 Face Search</h1>
          <p>Find photos by face using AI recognition</p>

          <div className="search-mode-toggle">
            <button className={`mode-btn ${searchMode === 'upload' ? 'active' : ''}`} onClick={() => { setSearchMode('upload'); stopCamera() }}>
              📁 Upload Photo
            </button>
            <button className={`mode-btn ${searchMode === 'camera' ? 'active' : ''}`} onClick={() => setSearchMode('camera')}>
              📷 Use Camera
            </button>
          </div>

          {searchMode === 'camera' && (
            <div className="camera-section">
              {cameraActive && (
                <div className="camera-container">
                  <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}
              <div className="camera-controls">
                {!cameraActive ? (
                  <button className="camera-btn" onClick={startCamera}>📷 Start Camera</button>
                ) : (
                  <>
                    <button className="camera-btn capture" onClick={captureAndSearch} disabled={searching}>
                      {searching ? '🔍 Searching...' : '📸 Capture & Search'}
                    </button>
                    <button className="camera-btn stop" onClick={stopCamera}>⏹️ Stop</button>
                  </>
                )}
              </div>
            </div>
          )}

          {searchMode === 'upload' && (
            <div className="upload-section">
              {previewImage && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <img src={previewImage} alt="Preview" style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '15px', objectFit: 'cover' }} />
                </div>
              )}
              <div className="upload-container-face" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">🖼️</div>
                <h3>Upload a Photo</h3>
                <p>Click to select a photo containing a face to search</p>
                <button className="upload-btn-face" disabled={searching} onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                  {searching ? '🔍 Searching...' : '📁 Choose Photo'}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
            </div>
          )}

          {searching && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Searching for matching faces...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="search-results">
              <h2>Found {results.length} match{results.length !== 1 ? 'es' : ''}</h2>
              <div className="results-grid">
                {results.map((r, i) => (
                  <div key={i} className="result-item">
                    <img src={r.thumbnail_path || r.jpeg_path || r.image_url} alt={r.original_name || 'Match'} className="result-image" />
                    <div className="result-overlay">
                      <button className="download-btn" onClick={() => window.open(r.jpeg_path || r.image_url, '_blank')}>⬇️</button>
                    </div>
                    {r.similarity !== undefined && (
                      <div style={{ padding: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.85rem' }}>
                        {(r.similarity * 100).toFixed(1)}% match
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searching && results.length === 0 && previewImage && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.8)' }}>
              <p>No matching faces found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
