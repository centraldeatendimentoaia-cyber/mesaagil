interface Env {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

type Barraca = {
  nome: string
  logo_url: string | null
  cor_primaria: string
  modo: 'claro' | 'escuro'
}

const NOME_PADRAO = 'MesaAgil'
const COR_PADRAO = '#7e14ff'
const ICONE_192_PADRAO = '/icons/mesaagil-192.png'
const ICONE_512_PADRAO = '/icons/mesaagil-512.png'

async function buscarBarraca(env: Env, slug: string): Promise<Barraca | null> {
  try {
    const url =
      `${env.VITE_SUPABASE_URL}/rest/v1/barracas` +
      `?slug=eq.${encodeURIComponent(slug)}&select=nome,logo_url,cor_primaria,modo`

    const resposta = await fetch(url, {
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      },
    })

    if (!resposta.ok) return null

    const dados = (await resposta.json()) as Barraca[]
    return dados[0] ?? null
  } catch {
    return null
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const slug = String(context.params.slug ?? '')
  const barraca = await buscarBarraca(context.env, slug)

  const nome = barraca?.nome ?? NOME_PADRAO
  const corPrimaria = barraca?.cor_primaria ?? COR_PADRAO
  const modo = barraca?.modo ?? 'claro'
  const icone192 = barraca?.logo_url ?? ICONE_192_PADRAO
  const icone512 = barraca?.logo_url ?? ICONE_512_PADRAO

  const manifest = {
    name: nome,
    short_name: nome.length > 12 ? `${nome.slice(0, 11)}…` : nome,
    start_url: `/${slug}`,
    scope: `/${slug}`,
    display: 'standalone',
    background_color: modo === 'escuro' ? '#0D0D0D' : '#FFFFFF',
    theme_color: corPrimaria,
    icons: [
      { src: icone192, sizes: '192x192', type: 'image/png' },
      { src: icone512, sizes: '512x512', type: 'image/png' },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
