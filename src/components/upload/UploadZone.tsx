'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadPhoto } from '@/lib/api'
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  albumId: number
  onDone: () => void
}

interface FileState {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
}

export function UploadZone({ albumId, onDone }: Props) {
  const [files, setFiles] = useState<FileState[]>([])
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [
      ...prev,
      ...accepted.map(file => ({ file, progress: 0, status: 'pending' as const })),
    ])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'image/x-raw': [], 'image/arw': [] },
    multiple: true,
  })

  const uploadAll = async () => {
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'done') continue
      setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'uploading' } : f))
      try {
        await uploadPhoto(files[i].file, albumId, progress =>
          setFiles(prev => prev.map((f, j) => j === i ? { ...f, progress } : f))
        )
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'done', progress: 100 } : f))
      } catch {
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: 'error' } : f))
      }
    }
    setUploading(false)
    onDone()
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-violet-500 bg-violet-500/10' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-300">Drop photos here or click to select</p>
        <p className="text-xs text-gray-500 mt-1">Supports RAW, JPEG, PNG</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{f.file.name}</p>
                {f.status === 'uploading' && (
                  <div className="h-1 bg-gray-700 rounded mt-1">
                    <div className="h-full bg-violet-500 rounded transition-all" style={{ width: `${f.progress}%` }} />
                  </div>
                )}
              </div>
              {f.status === 'pending' && <Loader2 className="w-4 h-4 text-gray-500" />}
              {f.status === 'uploading' && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
              {f.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
              {f.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <Button onClick={uploadAll} loading={uploading} className="w-full" size="lg">
          Upload {files.filter(f => f.status !== 'done').length} Photos
        </Button>
      )}
    </div>
  )
}
