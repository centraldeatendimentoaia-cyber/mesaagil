export type RequisitoSenha = {
  chave: string
  label: string
  erro: string
  testar: (senha: string) => boolean
}

export const REQUISITOS_SENHA: RequisitoSenha[] = [
  {
    chave: 'tamanho',
    label: 'Mínimo de 8 caracteres',
    erro: 'Precisa ter no mínimo 8 caracteres',
    testar: (senha) => senha.length >= 8,
  },
  {
    chave: 'letra',
    label: 'Pelo menos uma letra',
    erro: 'Precisa ter pelo menos uma letra',
    testar: (senha) => /[a-zA-Z]/.test(senha),
  },
  {
    chave: 'numero',
    label: 'Pelo menos um número',
    erro: 'Precisa ter pelo menos um número',
    testar: (senha) => /[0-9]/.test(senha),
  },
  {
    chave: 'especial',
    label: 'Pelo menos um caractere especial (!@#$%&*...)',
    erro: 'Precisa ter pelo menos um caractere especial (!@#$%&*...)',
    testar: (senha) => /[^a-zA-Z0-9]/.test(senha),
  },
]

export function validarSenhaForte(senha: string): { valida: boolean; erros: string[] } {
  const erros = REQUISITOS_SENHA.filter((requisito) => !requisito.testar(senha)).map(
    (requisito) => requisito.erro,
  )
  return { valida: erros.length === 0, erros }
}
