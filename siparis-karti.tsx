'use client'

import { ArrowRight, Check, CornerUpLeft, Loader2, Package } from 'lucide-react'
import {
  ASAMALAR,
  asamaIndex,
  ilerlemeYuzdesi,
  oncekiAsama,
  saatFarki,
  sonrakiAsama,
  type Siparis,
} from '@/lib/uretim'
import { cn } from '@/lib/utils'

type Props = {
  siparis: Siparis
  bekleniyor: boolean
  vurgulu: boolean
  onIleri: (siparis: Siparis) => void
  onGeri: (siparis: Siparis) => void
}

export function SiparisKarti({
  siparis,
  bekleniyor,
  vurgulu,
  onIleri,
  onGeri,
}: Props) {
  const index = asamaIndex(siparis.asama)
  const tamamlandi = siparis.asama === 'Tamamlandı'
  const sonraki = sonrakiAsama(siparis.asama)
  const onceki = oncekiAsama(siparis.asama)

  return (
    <article
      className={cn(
        'bg-card flex flex-col gap-4 rounded-xl border p-4 transition-colors sm:p-5',
        tamamlandi ? 'border-success/40' : 'border-border',
        vurgulu && 'ring-primary ring-2',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-primary font-mono text-lg font-semibold tracking-wider sm:text-xl">
            {siparis.siparis_no}
          </span>
          <h2 className="text-card-foreground truncate text-base font-semibold sm:text-lg">
            {siparis.musteri_adi}
          </h2>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide uppercase',
            tamamlandi
              ? 'bg-success text-success-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {siparis.asama}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Package className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-foreground font-medium">
            {siparis.urun_tipi}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{siparis.adet} adet</span>
        </div>
        {siparis.detay_ozet ? (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {siparis.detay_ozet}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              tamamlandi ? 'bg-success' : 'bg-primary',
            )}
            style={{ width: `${ilerlemeYuzdesi(siparis.asama)}%` }}
          />
        </div>
        <ol className="flex items-center justify-between gap-1">
          {ASAMALAR.map((asama, i) => (
            <li
              key={asama}
              className={cn(
                'flex-1 truncate text-center text-[10px] font-medium tracking-wide uppercase sm:text-xs',
                i <= index ? 'text-foreground' : 'text-muted-foreground/60',
              )}
            >
              {asama}
            </li>
          ))}
        </ol>
      </div>

      <footer className="flex items-center gap-2">
        {onceki ? (
          <button
            type="button"
            onClick={() => onGeri(siparis)}
            disabled={bekleniyor}
            aria-label={`${siparis.siparis_no} siparişini ${onceki} aşamasına geri al`}
            className="bg-secondary text-secondary-foreground hover:bg-accent flex h-14 w-14 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
          >
            <CornerUpLeft className="size-5" aria-hidden="true" />
          </button>
        ) : null}

        {sonraki ? (
          <button
            type="button"
            onClick={() => onIleri(siparis)}
            disabled={bekleniyor}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-14 flex-1 items-center justify-center gap-2 rounded-lg text-base font-semibold transition-colors active:scale-[0.99] disabled:opacity-60"
          >
            {bekleniyor ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-5" aria-hidden="true" />
            )}
            {sonraki} aşamasına al
          </button>
        ) : (
          <div className="bg-success/15 text-success flex h-14 flex-1 items-center justify-center gap-2 rounded-lg text-base font-semibold">
            <Check className="size-5" aria-hidden="true" />
            Üretim tamamlandı
          </div>
        )}
      </footer>

      <p className="text-muted-foreground font-mono text-xs">
        Son güncelleme: {saatFarki(siparis.updated_at)}
      </p>
    </article>
  )
}
