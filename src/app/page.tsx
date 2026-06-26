'use client'
import { useState, useEffect } from 'react'
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

export default function Home() {
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/albums`)
      .then(r => r.json())
      .then(d => setAlbums(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="app">
      <NavBar />
      <div className="loading"><div className="spinner" /><p>Loading albums...</p></div>
    </div>
  )

  return (
    <div className="app">
      <NavBar />
      <div className="gallery">
        <div className="gallery-header">
          <h1>Albums</h1>
          <p>{albums.length} album{albums.length !== 1 ? 's' : ''}</p>
        </div>

        {albums.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '4rem' }}>
            <p style={{ fontSize: '1.5rem' }}>No albums yet</p>
          </div>
        ) : (
          <div className="photo-grid">
            {albums.map(album => (
              <Link key={album.id} href={`/albums/${album.id}`} style={{ textDecoration: 'none' }}>
                <div className="photo-item" style={{ cursor: 'pointer' }}>
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={album.name} className="photo-thumbnail" />
                  ) : (
                    <div className="photo-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '3rem' }}>
                      🗂️
                    </div>
                  )}
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.name}</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{new Date(album.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div className="photo-overlay">
                    <span style={{ color: 'white', fontWeight: 600 }}>Open Album →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
