'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

import { use } from 'react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://photo.parameedev.online/api/v1'

async function downloadPhoto(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()

  // Mobile Safari/Chrome ignore <a download> on JS-built blob URLs — the tap
  // silently does nothing. The native share sheet (same one Lightroom's
  // "Save Image" uses) is the reliable path there, so prefer it whenever the
  // OS supports sharing this file.
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return // user cancelled the share sheet
      // fall through to the <a download> path below
    }
  }

  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

async function downloadMultiple(photos: any[]) {
  for (const photo of photos) {
    const url = photo.jpeg_url || photo.thumbnail_url
    if (!url) continue
    await downloadPhoto(url, photo.original_name || `photo_${photo.id}.jpg`)
    await new Promise(r => setTimeout(r, 200))
  }
}

const LONG_PRESS_MS = 450
const ONBOARDING_KEY = 'gallery_album_onboarding_dismissed'

interface TourStep {
  targetRef: React.RefObject<HTMLElement | null>
  title: string
  description: string
  placement: 'bottom' | 'top'
}

function CoachMark({ steps, onFinish }: { steps: TourStep[]; onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[stepIndex]

  useEffect(() => {
    const update = () => {
      const el = step.targetRef.current
      setRect(el ? el.getBoundingClientRect() : null)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [step])

  useEffect(() => {
    step.targetRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [step])

  if (!rect) return null

  const pad = 8
  const holeTop = rect.top - pad
  const holeLeft = rect.left - pad
  const holeW = rect.width + pad * 2
  const holeH = rect.height + pad * 2
  const isLast = stepIndex === steps.length - 1

  const tooltipTop = step.placement === 'bottom' ? holeTop + holeH + 14 : undefined
  const tooltipBottom = step.placement === 'top' ? window.innerHeight - holeTop + 14 : undefined

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Spotlight overlay: 4 dark panels around the hole, so the hole itself has no dimming layer on top */}
      <div className="absolute bg-black/70 transition-all duration-300" style={{ top: 0, left: 0, right: 0, height: Math.max(holeTop, 0) }} />
      <div className="absolute bg-black/70 transition-all duration-300" style={{ top: holeTop + holeH, left: 0, right: 0, bottom: 0 }} />
      <div className="absolute bg-black/70 transition-all duration-300" style={{ top: holeTop, left: 0, width: Math.max(holeLeft, 0), height: holeH }} />
      <div className="absolute bg-black/70 transition-all duration-300" style={{ top: holeTop, left: holeLeft + holeW, right: 0, height: holeH }} />

      {/* Highlighted ring around the target */}
      <div
        className="absolute rounded-2xl ring-4 ring-indigo-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0)] pointer-events-none transition-all duration-300 animate-pulse"
        style={{ top: holeTop, left: holeLeft, width: holeW, height: holeH }}
      />

      {/* Tooltip */}
      <div
        className="absolute w-[calc(100vw-2rem)] max-w-xs rounded-2xl bg-white shadow-2xl p-4 transition-all duration-300"
        style={{
          top: tooltipTop,
          bottom: tooltipBottom,
          left: Math.min(Math.max(holeLeft, 16), window.innerWidth - 16 - 320),
        }}
      >
        <p className="text-sm font-semibold text-gray-900">{step.title}</p>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{step.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-gray-200'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onFinish} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">ข้าม</button>
            <button
              onClick={() => (isLast ? onFinish() : setStepIndex(i => i + 1))}
              className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {isLast ? 'เข้าใจแล้ว' : 'ถัดไป'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [album, setAlbum] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Selection mode (long-press a thumbnail to enter, tap toggles others)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)
  const firstPhotoRef = useRef<HTMLDivElement>(null)
  const downloadAllRef = useRef<HTMLButtonElement>(null)
  const faceSearchRef = useRef<HTMLAnchorElement>(null)

  const startLongPress = (photo: any) => {
    longPressFired.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      setSelectMode(true)
      setSelectedIds(new Set([photo.id]))
    }, LONG_PRESS_MS)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }
  const toggleSelected = (photo: any) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(photo.id)) next.delete(photo.id)
      else next.add(photo.id)
      return next
    })
  }
  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }
  const handlePhotoClick = (photo: any) => {
    if (longPressFired.current) return // long-press already handled this tap
    if (selectMode) toggleSelected(photo)
    else setSelectedPhoto(photo)
  }
  const selectedPhotoIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : -1
  const showPrevPhoto = () => {
    if (selectedPhotoIndex > 0) setSelectedPhoto(photos[selectedPhotoIndex - 1])
  }
  const showNextPhoto = () => {
    if (selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length - 1) setSelectedPhoto(photos[selectedPhotoIndex + 1])
  }
  const downloadSelected = async () => {
    const chosen = photos.filter(p => selectedIds.has(p.id))
    if (!chosen.length) return
    setDownloading(true)
    try {
      await downloadMultiple(chosen)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/albums/${id}`).then(r => r.json()).then(d => setAlbum(d.data ?? d)),
      fetch(`${BASE_URL}/gallery?album_id=${id}&limit=100`).then(r => r.json()).then(d => setPhotos(d.data ?? [])),
    ]).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!loading && photos.length > 0 && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true)
    }
  }, [loading, photos.length])

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  useEffect(() => {
    if (!selectedPhoto) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPrevPhoto()
      if (e.key === 'ArrowRight') showNextPhoto()
      if (e.key === 'Escape') setSelectedPhoto(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedPhoto, photos])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {selectMode ? (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={exitSelectMode}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="ยกเลิก"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <p className="text-sm font-semibold text-gray-800">เลือกแล้ว {selectedIds.size} รูป</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set(photos.map(p => p.id)))}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                เลือกทั้งหมด
              </button>
              <button
                onClick={downloadSelected}
                disabled={!selectedIds.size || downloading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloading ? 'กำลังโหลด...' : `โหลด (${selectedIds.size})`}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="กลับ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </Link>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-gray-900 truncate">{album?.name}</h1>
                <p className="text-xs text-gray-400">{photos.length} photos · กดค้างที่รูปเพื่อเลือก</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {photos.length > 0 && (
                <button
                  ref={downloadAllRef}
                  onClick={() => downloadMultiple(photos)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span className="hidden sm:inline">โหลดทั้งหมด ({photos.length})</span>
                </button>
              )}
              <Link
                ref={faceSearchRef}
                href="/?tab=face"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>ค้นหาใบหน้า</span>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Onboarding coach mark */}
      {showOnboarding && !selectMode && (
        <CoachMark
          onFinish={dismissOnboarding}
          steps={[
            {
              targetRef: firstPhotoRef,
              placement: 'bottom',
              title: '1. แตะรูปเพื่อดูขนาดใหญ่',
              description: 'แตะที่รูปเพื่อเปิดดูแบบเต็มจอ แล้วใช้ปุ่ม ‹ › หรือลูกศรซ้าย/ขวาบนคีย์บอร์ดเพื่อเลื่อนดูรูปถัดไป ส่วนการกดค้างที่รูปจะเข้าสู่โหมดเลือกหลายรูป',
            },
            {
              targetRef: downloadAllRef,
              placement: 'bottom',
              title: '2. ดาวน์โหลดรูป',
              description: 'กดปุ่มนี้เพื่อโหลดรูปทั้งหมดในอัลบั้มทีเดียว หรือจะเลือกโหลดทีละรูปจากปุ่ม ⬇ ที่มุมรูปก็ได้',
            },
            {
              targetRef: faceSearchRef,
              placement: 'bottom',
              title: '3. ค้นหาด้วยใบหน้า',
              description: 'อัปโหลดรูปใบหน้าเพื่อค้นหารูปทั้งหมดที่มีคนคนนั้นอยู่ในคลังภาพ',
            },
          ]}
        />
      )}

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <p className="text-sm">ยังไม่มีรูปใน album นี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-1.5 p-1.5 sm:p-2 pb-24">
          {photos.map((photo: any, index: number) => {
            const isSelected = selectedIds.has(photo.id)
            return (
              <div
                key={photo.id}
                ref={index === 0 ? firstPhotoRef : undefined}
                className="relative group aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 select-none"
                onClick={() => handlePhotoClick(photo)}
                onPointerDown={() => startLongPress(photo)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onContextMenu={e => { if (selectMode) e.preventDefault() }}
              >
                <img
                  src={photo.thumbnail_url || photo.jpeg_url}
                  alt={photo.original_name}
                  draggable={false}
                  className={`w-full h-full object-cover transition-transform duration-300 ease-out ${selectMode ? '' : 'group-hover:scale-105'} ${isSelected ? 'scale-95 brightness-75' : ''}`}
                />
                {!selectMode && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
                {selectMode ? (
                  <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-black/30 border-white'}`}>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); downloadPhoto(photo.jpeg_url || photo.thumbnail_url, photo.original_name || `photo_${photo.id}.jpg`) }}
                    className="absolute bottom-1.5 right-1.5 flex items-center justify-center w-7 h-7 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    aria-label="ดาวน์โหลด"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Floating action bar (selection mode, mobile) */}
      {selectMode && (
        <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-4 py-3 flex items-center justify-between md:hidden">
          <button onClick={exitSelectMode} className="text-gray-400 text-sm font-medium">ยกเลิก</button>
          <p className="text-sm text-gray-600">{selectedIds.size} รูป</p>
          <button
            onClick={downloadSelected}
            disabled={!selectedIds.size || downloading}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-medium shadow-sm shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-colors"
          >
            {downloading ? 'กำลังโหลด...' : `โหลด (${selectedIds.size})`}
          </button>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 sm:px-6 py-4 z-10">
            <p className="text-white/60 text-sm truncate max-w-[60%]">{selectedPhoto.original_name}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); downloadPhoto(selectedPhoto.jpeg_url || selectedPhoto.thumbnail_url, selectedPhoto.original_name || `photo_${selectedPhoto.id}.jpg`) }}
                className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span className="hidden sm:inline">โหลดรูป</span>
              </button>
              <button
                onClick={e => { e.stopPropagation(); setSelectedPhoto(null) }}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                aria-label="ปิด"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* Image */}
          <img
            src={selectedPhoto.jpeg_url || selectedPhoto.thumbnail_url}
            alt={selectedPhoto.original_name}
            onClick={e => e.stopPropagation()}
            className="max-w-[92vw] max-h-[85vh] rounded-xl object-contain shadow-2xl shadow-black/50"
          />

          {/* Prev / Next */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); showPrevPhoto() }}
              className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95"
              aria-label="รูปก่อนหน้า"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {selectedPhotoIndex >= 0 && selectedPhotoIndex < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); showNextPhoto() }}
              className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95"
              aria-label="รูปถัดไป"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          {/* Position indicator */}
          {selectedPhotoIndex >= 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/70 text-xs">
              {selectedPhotoIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
