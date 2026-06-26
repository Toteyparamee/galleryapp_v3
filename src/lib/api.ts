import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://photo.parameedev.online/api/v1',
  timeout: 30000,
})

export interface Album {
  id: number
  name: string
  description?: string
  photo_count: number
  cover_url?: string
  qr_code_url?: string
  created_at: string
}

export interface Photo {
  id: number
  album_id: number
  original_name: string
  jpeg_path?: string
  thumbnail_path?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_size: number
  created_at: string
}

// Albums
export const getAlbums = () => api.get<{ data: Album[] }>('/albums').then(r => r.data.data)
export const getAlbum = (id: number) => api.get<{ data: Album }>(`/albums/${id}`).then(r => r.data.data)
export const createAlbum = (name: string, description?: string) =>
  api.post<{ data: Album }>('/albums', { name, description }).then(r => r.data.data)
export const deleteAlbum = (id: number) => api.delete(`/albums/${id}`)

// Gallery
export const getPhotos = (albumId?: number, page = 1, limit = 30) =>
  api.get<{ data: Photo[] }>('/gallery', { params: { album_id: albumId, page, limit } }).then(r => r.data.data)

// Upload
export const uploadPhoto = (file: File, albumId: number, onProgress?: (p: number) => void) => {
  const form = new FormData()
  form.append('file', file)
  form.append('album_id', String(albumId))
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1))),
  })
}

export default api
