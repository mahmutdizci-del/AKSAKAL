import { UretimPaneli } from '@/components/uretim-paneli'
import { createClient } from '@/lib/supabase/server'
import type { Siparis } from '@/lib/uretim'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('uretim_takip')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold">Veriler yüklenemedi</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {error.message}
        </p>
      </main>
    )
  }

  return <UretimPaneli ilkVeri={(data ?? []) as Siparis[]} />
}
