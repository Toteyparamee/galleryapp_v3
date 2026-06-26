'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

export default function Gallery() {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [selectedPhotos, setSelectedPhotos] = useState(new Set<number>())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => { fetchPhotos() }, [])

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`${BASE_URL}/gallery`)
      const data = await res.json()
      setPhotos(data.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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
      await Promise.all(ids.map(id => fetch(`${BASE_URL}/gallery/${id}`, { method: 'DELETE' })))
      setPhotos(photos.filter(p => !ids.includes(p.id)))
      setSelectedPhotos(new Set()); setIsSelectionMode(false); setShowDeleteConfirm(false)
    } catch (e) { alert('Failed to delete') }
  }

  const toggleSelect = (id: number) => {
    if (!isSelectionMode) return
    const s = new Set(selectedPhotos)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedPhotos(s)
  }

  if (loading) return (
    <div className="app">
      <NavBar />
      <div className="loading"><div className="spinner" /><p>Loading photos...</p></div>
    </div>
  )

  return (
    <div className="app">
      <NavBar />
      <div className="gallery">
        <div className="gallery-header">
          <h1>My Photo Gallery</h1>
          <p>{photos.length} photos</p>
          <div className="gallery-actions">
            {!isSelectionMode ? (
              <button className="action-btn delete-mode-btn" onClick={() => { setIsSelectionMode(true); setSelectedPhotos(new Set()) }}>🗑️ Delete Photos</button>
            ) : (
              <div className="selection-controls">
                <button className="action-btn select-all-btn" onClick={() => setSelectedPhotos(selectedPhotos.size === photos.length ? new Set() : new Set(photos.map(p => p.id)))}>
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

        <div className="photo-grid">
          {photos.map(photo => (
            <div key={photo.id}
              className={`photo-item ${isSelectionMode ? 'selection-mode' : ''} ${selectedPhotos.has(photo.id) ? 'selected' : ''}`}
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
      </div>

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

      {showDeleteConfirm && (
        <div className="modal delete-confirm-modal" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm-content" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <h2>⚠️ Confirm Delete</h2>
              <span className="close" onClick={() => setShowDeleteConfirm(false)}>&times;</span>
            </div>
            <div className="delete-confirm-body">
              <p>Are you sure you want to delete <strong>{selectedPhotos.size}</strong> photo(s)?</p>
              <p className="warning-text">This action cannot be undone!</p>
              <div className="selected-photos-preview">
                {Array.from(selectedPhotos).slice(0, 6).map(id => {
                  const p = photos.find(x => x.id === id)
                  return p ? <img key={id} src={p.thumbnail_path || p.jpeg_path} alt={p.original_name} className="preview-thumbnail" /> : null
                })}
                {selectedPhotos.size > 6 && <div className="more-photos">+{selectedPhotos.size - 6} more</div>}
              </div>
            </div>
            <div className="delete-confirm-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>❌ Cancel</button>
              <button className="confirm-delete-btn" onClick={() => deletePhotos(Array.from(selectedPhotos))}>🗑️ Delete {selectedPhotos.size} Photo(s)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
