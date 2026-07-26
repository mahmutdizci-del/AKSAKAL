export const ASAMALAR = [
  'Kesim',
  'Bantlama',
  'Boyahane',
  'Paketleme',
  'Tamamlandı',
] as const

export type Asama = (typeof ASAMALAR)[number]

export type Siparis = {
  id: string
  siparis_no: string
  musteri_adi: string
  urun_tipi: string
  detay_ozet: string | null
  asama: Asama
  adet: number
  created_at: string
  updated_at: string
}

export function asamaIndex(asama: Asama) {
  const i = ASAMALAR.indexOf(asama)
  return i === -1 ? 0 : i
}

export function sonrakiAsama(asama: Asama): Asama | null {
  const i = asamaIndex(asama)
  return i >= ASAMALAR.length - 1 ? null : ASAMALAR[i + 1]
}

export function oncekiAsama(asama: Asama): Asama | null {
  const i = asamaIndex(asama)
  return i <= 0 ? null : ASAMALAR[i - 1]
}

export function ilerlemeYuzdesi(asama: Asama) {
  return Math.round(((asamaIndex(asama) + 1) / ASAMALAR.length) * 100)
}

export function saatFarki(tarih: string) {
  const diff = Date.now() - new Date(tarih).getTime()
  const dakika = Math.floor(diff / 60000)
  if (dakika < 1) return 'az önce'
  if (dakika < 60) return `${dakika} dk önce`
  const saat = Math.floor(dakika / 60)
  if (saat < 24) return `${saat} sa önce`
  return `${Math.floor(saat / 24)} gün önce`
}
