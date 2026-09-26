// Recebe o webhook da Kirvano e repassa pro RPC processar_webhook_kirvano,
// que é o único portão de verdade (valida o token contra
// configuracao_webhook_kirvano no banco — a anon key usada aqui é
// pública, então a validação real tem que acontecer lá dentro, não aqui).
//
// Onde vem o token: a doc da Kirvano não deixa claro se ele chega num
// header ou dentro do corpo. O primeiro evento de teste enviado pelo
// painel (Integrações → Webhook → Enviar teste) fica gravado por inteiro
// em eventos_webhook_kirvano mesmo que o token não bata — dá pra abrir
// esse payload no Supabase e confirmar onde o token realmente está, e
// então ajustar `extrairToken` abaixo se for preciso.
interface Env {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

function extrairToken(request: Request, payload: Record<string, unknown>): string {
  const doHeader =
    request.headers.get('x-webhook-token') ??
    request.headers.get('x-kirvano-token') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (doHeader) return doHeader

  const doCorpo = payload['token'] ?? payload['webhook_token']
  return typeof doCorpo === 'string' ? doCorpo : ''
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let payload: Record<string, unknown>

  try {
    payload = await context.request.json()
  } catch {
    return new Response('Corpo inválido', { status: 400 })
  }

  const token = extrairToken(context.request, payload)

  try {
    const resposta = await fetch(
      `${context.env.VITE_SUPABASE_URL}/rest/v1/rpc/processar_webhook_kirvano`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: context.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${context.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ p_payload: payload, p_token: token }),
      },
    )

    if (resposta.status === 400 || resposta.status === 404) {
      // PostgREST devolve 400 quando a função RAISE EXCEPTION (aqui, só
      // acontece por token inválido) — mapeia pra 401 pra Kirvano.
      const corpo = await resposta.text()
      const tokenInvalido = /token inv/i.test(corpo)
      return new Response(tokenInvalido ? 'Token inválido' : corpo, {
        status: tokenInvalido ? 401 : 400,
      })
    }

    if (!resposta.ok) {
      return new Response('Erro ao processar webhook', { status: 502 })
    }

    return new Response('ok', { status: 200 })
  } catch {
    return new Response('Erro ao processar webhook', { status: 502 })
  }
}
