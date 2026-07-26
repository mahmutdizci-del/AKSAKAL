'use client'

import { PackagePlus, Radio, ScanLine, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QrOkuyucu } from '@/components/qr-okuyucu'
import { SiparisKarti } from '@/components/siparis-karti'
import { YeniSiparisFormu } from '@/components/yeni-siparis-formu'
import { createClient } from '@/lib/supabase/client'
import {
  ASAMALAR,
  asamaIndex,
  oncekiAsama,
  sonrakiAsama,
  type Asama,
  type Siparis,
} from '@/lib/uretim'
import { cn } from '@/lib/utils'

type Filtre = Asama | 'Tumu'

const FILTRELER: Filtre[] = ['Tumu', ...ASAMALAR]

function sirala(liste: Siparis[]) {
  return [...liste].sort((a, b) => {
    const fark = asamaIndex(a.asama) - asamaIndex(b.asama)
    if (fark !== 0) return fark
    return a.siparis_no.localeCompare(b.siparis_no)
  })
}

export function UretimPaneli({ ilkVeri }: { ilkVeri: Siparis[] }) {
  const supabase = createClient()
  const [siparisler, setSiparisler] = useState<Siparis[]>(() => sirala(ilkVeri))
  const [filtre, setFiltre] = useState<Filtre>('Tumu')
  const [arama, setArama] = useState('')
  const [bekleyen, setBekleyen] = useState<string | null>(null)
  const [vurgulu, setVurgulu] = useState<string | null>(null)
  const [qrAcik, setQrAcik] = useState(false)
  const [formAcik, setFormAcik] = useState(false)
  const [mesaj, setMesaj] = useState<{
    tip: 'basarili' | 'hata'
    metin: string
  } | null>(null)
  const [canli, setCanli] = useState(false)
  const siparislerRef = useRef(siparisler)

  siparislerRef.current = siparisler

  useEffect(() => {
    if (!mesaj) return
    const t = setTimeout(() => setMesaj(null), 3500)
    return () => clearTimeout(t)
  }, [mesaj])

  useEffect(() => {
    const kanal = supabase
      .channel('uretim-takip-canli')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'uretim_takip' },
        (payload) => {
          setSiparisler((mevcut) => {
            if (payload.eventType === 'DELETE') {
              return mevcut.filter((s) => s.id !== (payload.old as Siparis).id)
            }
            const yeni = payload.new as Siparis
            const varMi = mevcut.some((s) => s.id === yeni.id)
            return sirala(
              varMi
                ? mevcut.map((s) => (s.id === yeni.id ? yeni : s))
                : [...mevcut, yeni],
            )
          })
        },
      )
      .subscribe((durum) => setCanli(durum === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(kanal)
    }
  }, [supabase])

  const asamaGuncelle = useCallback(
    async (siparis: Siparis, yeniAsama: Asama) => {
      setBekleyen(siparis.id)
      const oncekiListe = siparislerRef.current

      setSiparisler((mevcut) =>
        sirala(
          mevcut.map((s) =>
            s.id === siparis.id
              ? { ...s, asama: yeniAsama, updated_at: new Date().toISOString() }
              : s,
          ),
        ),
      )

      const { error } = await supabase
        .from('uretim_takip')
        .update({ asama: yeniAsama, updated_at: new Date().toISOString() })
        .eq('id', siparis.id)

      setBekleyen(null)

      if (error) {
        console.log('[v0] Aşama güncelleme hatası:', error.message)
        setSiparisler(oncekiListe)
        setMesaj({ tip: 'hata', metin: 'Güncelleme başarısız. Tekrar deneyin.' })
        return
      }

      setVurgulu(siparis.id)
      setTimeout(() => setVurgulu(null), 1500)
      setMesaj({
        tip: 'basarili',
        metin: `${siparis.siparis_no} → ${yeniAsama}`,
      })
    },
    [supabase],
  )

  const ileriAl = useCallback(
    (siparis: Siparis) => {
      const sonraki = sonrakiAsama(siparis.asama)
      if (sonraki) asamaGuncelle(siparis, sonraki)
    },
    [asamaGuncelle],
  )

  const geriAl = useCallback(
    (siparis: Siparis) => {
      const onceki = oncekiAsama(siparis.asama)
      if (onceki) asamaGuncelle(siparis, onceki)
    },
    [asamaGuncelle],
  )

  const qrSonuc = useCallback(
    (deger: string) => {
      const temiz = deger.trim().toLowerCase()
      const bulunan = siparislerRef.current.find(
        (s) =>
          s.siparis_no.toLowerCase() === temiz ||
          s.id.toLowerCase() === temiz ||
          temiz.includes(s.siparis_no.toLowerCase()),
      )

      setQrAcik(false)

      if (!bulunan) {
        setMesaj({ tip: 'hata', metin: `Sipariş bulunamadı: ${deger}` })
        return
      }

      const sonraki = sonrakiAsama(bulunan.asama)
      if (!sonraki) {
        setMesaj({
          tip: 'hata',
          metin: `${bulunan.siparis_no} zaten tamamlandı.`,
        })
        return
      }

      asamaGuncelle(bulunan, sonraki)
    },
    [asamaGuncelle],
  )

  const siparisEklendi = useCallback((yeni: Siparis) => {
    setSiparisler((mevcut) =>
      sirala(
        mevcut.some((s) => s.id === yeni.id) ? mevcut : [...mevcut, yeni],
      ),
    )
    setVurgulu(yeni.id)
    setTimeout(() => setVurgulu(null), 1500)
    setMesaj({ tip: 'basarili', metin: `${yeni.siparis_no} eklendi` })
  }, [])

  const sayimlar = useMemo(() => {
    const sonuc = {} as Record<Filtre, number>
    sonuc.Tumu = siparisler.length
    for (const asama of ASAMALAR) {
      sonuc[asama] = siparisler.filter((s) => s.asama === asama).length
    }
    return sonuc
  }, [siparisler])

  const gorunen = useMemo(() => {
    const q = arama.trim().toLowerCase()
    return siparisler.filter((s) => {
      const filtreUygun = filtre === 'Tumu' || s.asama === filtre
      const aramaUygun =
        !q ||
        s.siparis_no.toLowerCase().includes(q) ||
        s.musteri_adi.toLowerCase().includes(q) ||
        s.urun_tipi.toLowerCase().includes(q)
      return filtreUygun && aramaUygun
    })
  }, [siparisler, filtre, arama])

  const aktif = siparisler.length - sayimlar['Tamamlandı']

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/90 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Üretim Takip Paneli
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Radio
                  className={cn(
                    'size-3.5',
                    canli ? 'text-success' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
                {canli ? 'Canlı bağlantı açık' : 'Bağlanıyor...'}
                <span aria-hidden="true">·</span>
                <span className="font-mono">{aktif} aktif iş</span>
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => setFormAcik(true)}
                className="border-border bg-secondary text-secondary-foreground hover:bg-accent flex h-14 items-center justify-center gap-2 rounded-lg border px-6 text-base font-semibold transition-colors active:scale-[0.99]"
              >
                <PackagePlus className="size-5" aria-hidden="true" />
                Yeni Sipariş Ekle
              </button>

              <button
                type="button"
                onClick={() => setQrAcik(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-14 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition-colors active:scale-[0.99]"
              >
                <ScanLine className="size-5" aria-hidden="true" />
                QR Kod Okut
              </button>
            </div>
          </div>

          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Sipariş no, müşteri veya ürün ara"
              aria-label="Sipariş ara"
              className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring h-14 w-full rounded-lg border pr-4 pl-12 text-base focus:ring-2 focus:outline-none"
            />
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {FILTRELER.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltre(f)}
                aria-pressed={filtre === f}
                className={cn(
                  'flex h-12 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors',
                  filtre === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border',
                )}
              >
                {f === 'Tumu' ? 'Tümü' : f}
                <span className="font-mono text-xs opacity-80">
                  {sayimlar[f] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
        {gorunen.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
            <PackagePlus className="size-8" aria-hidden="true" />
            <p className="text-sm leading-relaxed">
              {siparisler.length === 0
                ? 'Tabloda henüz sipariş yok. İlk siparişi ekleyerek başlayın.'
                : 'Bu filtreye uygun sipariş bulunmuyor.'}
            </p>
            {siparisler.length === 0 ? (
              <button
                type="button"
                onClick={() => setFormAcik(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-14 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold"
              >
                <PackagePlus className="size-5" aria-hidden="true" />
                Yeni Sipariş Ekle
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gorunen.map((siparis) => (
              <SiparisKarti
                key={siparis.id}
                siparis={siparis}
                bekleniyor={bekleyen === siparis.id}
                vurgulu={vurgulu === siparis.id}
                onIleri={ileriAl}
                onGeri={geriAl}
              />
            ))}
          </div>
        )}
      </main>

      {mesaj ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-lg px-4 py-4 text-center text-base font-semibold shadow-lg',
            mesaj.tip === 'basarili'
              ? 'bg-success text-success-foreground'
              : 'bg-destructive text-foreground',
          )}
        >
          {mesaj.metin}
        </div>
      ) : null}

      <QrOkuyucu
        acik={qrAcik}
        onKapat={() => setQrAcik(false)}
        onSonuc={qrSonuc}
      />

      <YeniSiparisFormu
        acik={formAcik}
        onKapat={() => setFormAcik(false)}
        onEklendi={siparisEklendi}
      />
    </div>
  )
}
