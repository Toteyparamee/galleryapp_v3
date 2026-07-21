'use client'
import { useEffect, useState } from 'react'

// IG/Facebook/Line/TikTok's in-app WebViews block file downloads and don't
// implement the Web Share API the same way real Safari/Chrome do — so
// "download failed silently" there isn't fixable from page code. The only
// reliable fix is asking the user to open the link in their real browser.
function detectInAppBrowser(ua: string): 'instagram' | 'facebook' | 'line' | 'tiktok' | null {
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/FBAN|FBAV/i.test(ua)) return 'facebook'
  if (/Line\//i.test(ua)) return 'line'
  if (/TikTok/i.test(ua)) return 'tiktok'
  return null
}

const LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  line: 'Line',
  tiktok: 'TikTok',
}

export default function InAppBrowserBanner() {
  const [app, setApp] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setApp(detectInAppBrowser(navigator.userAgent))
  }, [])

  if (!app || dismissed) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API can be blocked inside some in-app WebViews too
    }
  }

  return (
    <div className="sticky top-0 z-[60] bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-900">
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <span className="text-lg leading-none">⚠️</span>
        <div className="flex-1">
          <p className="font-medium">ดาวน์โหลดรูปไม่ได้ในเบราว์เซอร์ของ {LABELS[app]}</p>
          <p className="text-amber-700 mt-0.5">
            แตะเมนู <strong>••• (มุมขวาบน)</strong> แล้วเลือก <strong>&quot;เปิดใน Safari/Chrome&quot;</strong> หรือคัดลอกลิงก์ไปเปิดเอง
          </p>
          <button
            onClick={copyLink}
            className="mt-2 px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-medium hover:bg-amber-800 transition-colors"
          >
            {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอกลิงก์'}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 text-lg leading-none"
          aria-label="ปิด"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
