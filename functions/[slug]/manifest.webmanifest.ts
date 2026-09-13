interface Env {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

type Barraca = {
  nome: string
  logo_url: string | null
}

const NOME_PADRAO = 'MesaAgil'
// Cor de marca fixa do MesaAgil v2 (laranja 500) — não é mais por barraca.
const COR_MARCA = '#F58B00'
const ICONE_192_PADRAO = '/icons/mesaagil-192.png'
const ICONE_512_PADRAO = '/icons/mesaagil-512.png'

async function buscarBarraca(env: Env, slug: string): Promise<Barraca | null> {
  try {
    const url =
      `${env.VITE_SUPABASE_URL}/rest/v1/barracas` +
      `?slug=eq.${encodeURIComponent(slug)}&select=nome,logo_url`

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
  const icone192 = barraca?.logo_url ?? ICONE_192_PADRAO
  const icone512 = barraca?.logo_url ?? ICONE_512_PADRAO

  const manifest = {
    name: nome,
    short_name: nome.length > 12 ? `${nome.slice(0, 11)}…` : nome,
    start_url: `/${slug}`,
    scope: `/${slug}`,
    display: 'standalone',
    background_color: COR_MARCA,
    theme_color: COR_MARCA,
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
