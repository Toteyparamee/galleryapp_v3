'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { use } from 'react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://photo.parameedev.online/api/v1'

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

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [album, setAlbum] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [selectedPhotos, setSelectedPhotos] = useState(new Set<number>())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/albums/${id}`).then(r => r.json()).then(d => setAlbum(d.data ?? d)),
      fetch(`${BASE_URL}/gallery?album_id=${id}`).then(r => r.json()).then(d => setPhotos(d.data ?? [])),
    ]).finally(() => setLoading(false))
  }, [id])

  const downloadPhoto = async (photoId: number, filename: string) => {
    try {
      const res = await fetch(`${BASE_URL}/gallery/${photoId}/download`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  const deletePhotos = async (ids: number[]) => {
    try {
      await Promise.all(ids.map(pid => fetch(`${BASE_URL}/gallery/${pid}`, { method: 'DELETE' })))
      setPhotos(photos.filter(p => !ids.includes(p.id)))
      setSelectedPhotos(new Set()); setIsSelectionMode(false); setShowDeleteConfirm(false)
    } catch { alert('Failed to delete') }
  }

  const toggleSelect = (pid: number) => {
    if (!isSelectionMode) return
    const s = new Set(selectedPhotos)
    s.has(pid) ? s.delete(pid) : s.add(pid)
    setSelectedPhotos(s)
  }

  if (loading) return (
    <div className="app">
      <NavBar />
      <div className="loading"><div className="spinner" /><p>Loading...</p></div>
    </div>
  )

  return (
    <div className="app">
      <NavBar />
      <div className="gallery">
        <div className="gallery-header">
          <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Albums</Link>
          <h1 style={{ marginTop: '0.5rem' }}>{album?.name}</h1>
          <p>{photos.length} photos</p>
          <div className="gallery-actions">
            <button className="action-btn" style={{ background: 'linear-gradient(45deg, #4ecdc4, #44a08d)' }} onClick={() => setShowQR(true)}>
              📱 QR Code
            </button>
            {!isSelectionMode ? (
              <button className="action-btn delete-mode-btn" onClick={() => { setIsSelectionMode(true); setSelectedPhotos(new Set()) }}>🗑️ Delete Photos</button>
            ) : (
              <div className="selection-controls" style={{ display: 'inline-flex', gap: '0.5rem' }}>
                <button className="action-btn select-all-btn" onClick={() => setSelectedPhotos(selectedPhotos.size === photos.length ? new Set() : new Set(photos.map((p: any) => p.id)))}>
                  {selectedPhotos.size === photos.length ? '❌ Deselect All' : '✅ Select All'}
                </button>
                <button className="action-btn confirm-delete-btn" disabled={selectedPhotos.size === 0} onClick={() => selectedPhotos.size > 0 && setShowDeleteConfirm(true)}>
                  🗑️ Delete ({selectedPhotos.size})
                </button>
                <button className="action-btn cancel-btn" onClick={() => { setIsSelectionMode(false); setSelectedPhotos(new Set()) }}>❌ Cancel</button>
              </div>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '4rem' }}>
            <p style={{ fontSize: '1.5rem' }}>No photos in this album</p>
          </div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo: any) => (
              <div key={photo.id}
                className={`photo-item ${selectedPhotos.has(photo.id) ? 'selected' : ''}`}
                onClick={() => isSelectionMode ? toggleSelect(photo.id) : setSelectedPhoto(photo)}
              >
                {isSelectionMode && (
                  <div className="selection-checkbox">
                    <input type="checkbox" checked={selectedPhotos.has(photo.id)} onChange={() => toggleSelect(photo.id)} />
                  </div>
                )}
                <img src={photo.thumbnail_path || photo.jpeg_path} alt={photo.original_name} className="photo-thumbnail" />
                {!isSelectionMode && (
                  <div className="photo-overlay">
                    <button className="download-btn" onClick={e => { e.stopPropagation(); downloadPhoto(photo.id, photo.original_name) }}>⬇️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="modal" onClick={() => setShowQR(false)}>
          <div className="modal-content" style={{ maxWidth: '350px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <span className="close" onClick={() => setShowQR(false)}>&times;</span>
            <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>📱 {album?.name}</h3>
              <img
                src={`${BASE_URL.replace('/api/v1', '')}/api/v1/albums/${id}/qr`}
                alt="QR Code"
                style={{ width: '200px', height: '200px', borderRadius: '10px', background: 'white', padding: '8px' }}
              />
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.8 }}>
                Scan to open album on web
              </p>
              <a
                href={`https://gallery.parameedev.online/albums/${id}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', marginTop: '1rem', color: '#4ecdc4', fontSize: '0.85rem', wordBreak: 'break-all' }}
              >
                gallery.parameedev.online/albums/{id}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="modal" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={() => setSelectedPhoto(null)}>&times;</span>
            <img src={selectedPhoto.jpeg_path || selectedPhoto.thumbnail_path} alt={selectedPhoto.original_name} className="modal-image" />
            <div className="modal-footer">
              <h3>{selectedPhoto.original_name}</h3>
              <button className="download-btn-large" onClick={() => downloadPhoto(selectedPhoto.id, selectedPhoto.original_name)}>📥 Download Photo</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal delete-confirm-modal" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <h2>⚠️ Confirm Delete</h2>
              <span className="close" onClick={() => setShowDeleteConfirm(false)}>&times;</span>
            </div>
            <div className="delete-confirm-body">
              <p>Delete <strong>{selectedPhotos.size}</strong> photo(s)?</p>
              <p className="warning-text">This cannot be undone!</p>
              <div className="selected-photos-preview">
                {Array.from(selectedPhotos).slice(0, 6).map(pid => {
                  const p = photos.find((x: any) => x.id === pid)
                  return p ? <img key={pid} src={p.thumbnail_path || p.jpeg_path} alt="" className="preview-thumbnail" /> : null
                })}
                {selectedPhotos.size > 6 && <div className="more-photos">+{selectedPhotos.size - 6}</div>}
              </div>
            </div>
            <div className="delete-confirm-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>❌ Cancel</button>
              <button className="confirm-delete-btn" onClick={() => deletePhotos(Array.from(selectedPhotos))}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
