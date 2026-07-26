'use client'

import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { CameraOff, Keyboard, ScanLine, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  acik: boolean
  onKapat: () => void
  onSonuc: (deger: string) => void
}

export function QrOkuyucu({ acik, onKapat, onSonuc }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [manuel, setManuel] = useState('')
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    if (!acik) return

    let iptal = false
    const reader = new BrowserMultiFormatReader()

    async function basla() {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current!,
          (result) => {
            if (!result || iptal) return
            iptal = true
            controls.stop()
            onSonuc(result.getText().trim())
          },
        )
        if (iptal) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setHazir(true)
      } catch (error) {
        console.log('[v0] QR kamera hatası:', error)
        setHata(
          'Kameraya erişilemedi. Tarayıcı izinlerini kontrol edin veya sipariş numarasını elle girin.',
        )
      }
    }

    basla()

    return () => {
      iptal = true
      controlsRef.current?.stop()
      controlsRef.current = null
      setHazir(false)
      setHata(null)
    }
  }, [acik, onSonuc])

  if (!acik) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR kod okuyucu"
      className="bg-background fixed inset-0 z-50 flex flex-col"
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ScanLine className="text-primary size-5" aria-hidden="true" />
          <h2 className="text-base font-semibold">QR Kod Okut</h2>
        </div>
        <button
          type="button"
          onClick={onKapat}
          className="bg-secondary text-secondary-foreground hover:bg-accent flex size-11 items-center justify-center rounded-lg transition-colors"
          aria-label="Okuyucuyu kapat"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto p-4">
        {hata ? (
          <div className="border-destructive/40 bg-destructive/10 text-foreground flex w-full max-w-md flex-col items-center gap-3 rounded-xl border p-5 text-center">
            <CameraOff className="text-destructive size-8" aria-hidden="true" />
            <p className="text-sm leading-relaxed">{hata}</p>
          </div>
        ) : (
          <div className="border-border relative aspect-square w-full max-w-md overflow-hidden rounded-2xl border bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
            />
            <div className="border-primary/80 pointer-events-none absolute inset-8 rounded-xl border-2" />
            {!hazir ? (
              <p className="text-muted-foreground absolute inset-x-0 bottom-4 text-center text-sm">
                Kamera açılıyor...
              </p>
            ) : null}
          </div>
        )}

        <p className="text-muted-foreground max-w-md text-center text-sm leading-relaxed">
          Sipariş etiketindeki QR kodu çerçeveye tutun. Okuma sonrası sipariş
          otomatik olarak bir sonraki aşamaya aktarılır.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const deger = manuel.trim()
            if (!deger) return
            setManuel('')
            onSonuc(deger)
          }}
          className="flex w-full max-w-md flex-col gap-2"
        >
          <label
            htmlFor="manuel-siparis"
            className="text-muted-foreground flex items-center gap-2 text-sm font-medium"
          >
            <Keyboard className="size-4" aria-hidden="true" />
            Elle sipariş no gir
          </label>
          <div className="flex gap-2">
            <input
              id="manuel-siparis"
              value={manuel}
              onChange={(e) => setManuel(e.target.value)}
              placeholder="SIP-1001"
              autoComplete="off"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring h-14 min-w-0 flex-1 rounded-lg border px-4 font-mono text-base focus:ring-2 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 shrink-0 rounded-lg px-5 text-base font-semibold transition-colors"
            >
              Uygula
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
