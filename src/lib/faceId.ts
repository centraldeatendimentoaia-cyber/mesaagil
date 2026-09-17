// Face ID/Touch ID/Windows Hello como atalho de reentrada NESTE aparelho —
// não é um método de login novo. A senha (Supabase Auth) continua sendo a
// autenticação de verdade; a sessão dela já fica persistida pelo
// supabase-js. O que o WebAuthn faz aqui é só travar a UI até o dono do
// aparelho provar com biometria que é ele mesmo antes de mostrar o app de
// novo — o mesmo papel de uma tela de bloqueio de celular.
//
// Por isso NÃO há verificação de assinatura no servidor: não existe
// servidor nessa conta, e não faria sentido criar um só pra isso (proteção
// contra um atacante remoto forjando a resposta não é o problema que
// estamos resolvendo — o problema é "alguém pega o aparelho destravado no
// balcão"). navigator.credentials.get() só resolve com sucesso quando o
// autenticador da própria plataforma (Secure Enclave / TPM) libera a
// credencial pro dono biométrico dela — é o bastante pra esse uso.

const CHAVE_CREDENCIAL_ID = 'mesaagil:faceid:credencial_id'
const CHAVE_EMAIL = 'mesaagil:faceid:email'
const RP_NAME = 'MesaAgil'

function base64UrlParaBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    base64url.length + ((4 - (base64url.length % 4)) % 4),
    '=',
  )
  const binario = atob(base64)
  return Uint8Array.from(binario, (c) => c.charCodeAt(0))
}

export async function faceIdSuportado(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function faceIdAtivado(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_CREDENCIAL_ID) !== null
  } catch {
    return false
  }
}

export function emailFaceId(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_EMAIL)
  } catch {
    return null
  }
}

export async function ativarFaceId(usuario: { id: string; email: string }): Promise<void> {
  const credencial = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: RP_NAME, id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(usuario.id),
        name: usuario.email,
        displayName: usuario.email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null

  if (!credencial) throw new Error('Não foi possível criar a credencial')

  window.localStorage.setItem(CHAVE_CREDENCIAL_ID, credencial.id)
  window.localStorage.setItem(CHAVE_EMAIL, usuario.email)
}

export function desativarFaceId(): void {
  try {
    window.localStorage.removeItem(CHAVE_CREDENCIAL_ID)
    window.localStorage.removeItem(CHAVE_EMAIL)
  } catch {
    // localStorage indisponível — nada a limpar
  }
}

/** Retorna true se a biometria confirmou o dono do aparelho, false se
 * cancelou/falhou (nunca lança — quem chama só precisa do boolean). */
export async function desbloquearComFaceId(): Promise<boolean> {
  const credencialId = window.localStorage.getItem(CHAVE_CREDENCIAL_ID)
  if (!credencialId) return false

  try {
    const resposta = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [
          { id: base64UrlParaBuffer(credencialId) as BufferSource, type: 'public-key' },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return resposta !== null
  } catch {
    return false
  }
}
