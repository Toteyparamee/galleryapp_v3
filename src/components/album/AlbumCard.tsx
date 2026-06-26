import { Album } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Images, QrCode, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  album: Album
  onDelete: (id: number) => void
}

export function AlbumCard({ album, onDelete }: Props) {
  return (
    <div className="group relative rounded-xl bg-gray-800 border border-gray-700 overflow-hidden hover:border-violet-500 transition-colors">
      <Link href={`/albums/${album.id}`}>
        <div className="aspect-square bg-gray-900 flex items-center justify-center">
          {album.cover_url ? (
            <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
          ) : (
            <Images className="w-12 h-12 text-gray-600" />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-white truncate">{album.name}</h3>
          {album.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{album.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{album.photo_count} photos</span>
            <span className="text-xs text-gray-500">{formatDate(album.created_at)}</span>
          </div>
        </div>
      </Link>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {album.qr_code_url && (
          <a
            href={`https://photo.parameedev.online/api/v1/albums/${album.id}/qr`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-gray-900/80 text-gray-300 hover:text-white"
            onClick={e => e.stopPropagation()}
          >
            <QrCode className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onDelete(album.id) }}
          className="p-1.5 rounded-lg bg-gray-900/80 text-gray-300 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
