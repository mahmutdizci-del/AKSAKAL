'use client'

import { Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ASAMALAR, type Asama, type Siparis } from '@/lib/uretim'

type Props = {
  acik: boolean
  onKapat: () => void
  onEklendi: (siparis: Siparis) => void
}

const BOS_FORM = {
  siparis_no: '',
  musteri_adi: '',
  urun_tipi: '',
  detay_ozet: '',
  adet: '1',
  asama: 'Kesim' as Asama,
}

export function YeniSiparisFormu({ acik, onKapat, onEklendi }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState(BOS_FORM)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const ilkAlan = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!acik) return
    setForm(BOS_FORM)
    setHata(null)
    const t = setTimeout(() => ilkAlan.current?.focus(), 80)

    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKapat()
    }
    window.addEventListener('keydown', esc)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', esc)
    }
  }, [acik, onKapat])

  if (!acik) return null

  const guncelle = (alan: keyof typeof BOS_FORM, deger: string) =>
    setForm((mevcut) => ({ ...mevcut, [alan]: deger }))

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (kaydediliyor) return

    const siparisNo = form.siparis_no.trim()
    const musteri = form.musteri_adi.trim()
    const urun = form.urun_tipi.trim()

    if (!siparisNo || !musteri || !urun) {
      setHata('Sipariş no, müşteri adı ve ürün tipi zorunludur.')
      return
    }

    setKaydediliyor(true)
    setHata(null)

    const { data, error } = await supabase
      .from('uretim_takip')
      .insert({
        siparis_no: siparisNo,
        musteri_adi: musteri,
        urun_tipi: urun,
        detay_ozet: form.detay_ozet.trim() || null,
        adet: Math.max(1, Number.parseInt(form.adet, 10) || 1),
        asama: form.asama,
      })
      .select()
      .single()

    setKaydediliyor(false)

    if (error) {
      setHata(
        error.code === '23505' || error.message.includes('duplicate')
          ? `"${siparisNo}" numaralı sipariş zaten kayıtlı.`
          : error.message,
      )
      return
    }

    onEklendi(data as Siparis)
    onKapat()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="yeni-siparis-baslik"
      className="bg-background fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center sm:bg-black/70 sm:p-6"
    >
      <form
        onSubmit={kaydet}
        className="border-border bg-card flex max-h-dvh w-full flex-1 flex-col gap-5 overflow-y-auto border-b p-4 sm:max-h-[calc(100dvh-3rem)] sm:max-w-lg sm:flex-none sm:rounded-2xl sm:border sm:p-6 sm:shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="yeni-siparis-baslik" className="text-lg font-semibold">
              Yeni Sipariş Ekle
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Kayıt doğrudan Supabase tablosuna yazılır.
            </p>
          </div>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Formu kapat"
            className="border-border bg-secondary text-secondary-foreground hover:bg-accent flex size-11 shrink-0 items-center justify-center rounded-lg border"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Sipariş No
            </span>
            <input
              ref={ilkAlan}
              value={form.siparis_no}
              onChange={(e) => guncelle('siparis_no', e.target.value)}
              placeholder="SIP-2001"
              autoComplete="off"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-14 rounded-lg border px-4 font-mono text-base focus:ring-2 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Müşteri Adı
            </span>
            <input
              value={form.musteri_adi}
              onChange={(e) => guncelle('musteri_adi', e.target.value)}
              placeholder="Müşteri / firma adı"
              autoComplete="off"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-14 rounded-lg border px-4 text-base focus:ring-2 focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-muted-foreground text-sm font-medium">
                Ürün Tipi
              </span>
              <input
                value={form.urun_tipi}
                onChange={(e) => guncelle('urun_tipi', e.target.value)}
                placeholder="Mutfak dolabı"
                autoComplete="off"
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-14 rounded-lg border px-4 text-base focus:ring-2 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2 sm:w-28">
              <span className="text-muted-foreground text-sm font-medium">
                Adet
              </span>
              <input
                value={form.adet}
                onChange={(e) => guncelle('adet', e.target.value)}
                inputMode="numeric"
                className="border-input bg-background text-foreground focus:ring-ring h-14 rounded-lg border px-4 font-mono text-base focus:ring-2 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Detay Özet
            </span>
            <textarea
              value={form.detay_ozet}
              onChange={(e) => guncelle('detay_ozet', e.target.value)}
              rows={3}
              placeholder="Renk, ölçü, malzeme notları"
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring resize-none rounded-lg border p-4 text-base leading-relaxed focus:ring-2 focus:outline-none"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-muted-foreground pb-2 text-sm font-medium">
              Başlangıç Aşaması
            </legend>
            <div className="flex flex-wrap gap-2">
              {ASAMALAR.map((asama) => (
                <button
                  key={asama}
                  type="button"
                  onClick={() => guncelle('asama', asama)}
                  aria-pressed={form.asama === asama}
                  className={
                    form.asama === asama
                      ? 'bg-primary text-primary-foreground border-primary h-12 rounded-lg border px-4 text-sm font-semibold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border-border h-12 rounded-lg border px-4 text-sm font-semibold'
                  }
                >
                  {asama}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {hata ? (
          <p
            role="alert"
            className="bg-destructive/15 text-destructive rounded-lg px-4 py-3 text-sm leading-relaxed"
          >
            {hata}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 sm:mt-0 sm:flex-row-reverse">
          <button
            type="submit"
            disabled={kaydediliyor}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-14 flex-1 items-center justify-center gap-2 rounded-lg text-base font-semibold disabled:opacity-60"
          >
            {kaydediliyor ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : null}
            {kaydediliyor ? 'Kaydediliyor' : 'Siparişi Kaydet'}
          </button>
          <button
            type="button"
            onClick={onKapat}
            className="border-border bg-secondary text-secondary-foreground hover:bg-accent h-14 rounded-lg border px-6 text-base font-semibold sm:flex-none"
          >
            Vazgeç
          </button>
        </div>
      </form>
    </div>
  )
}
