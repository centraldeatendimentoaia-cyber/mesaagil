import { useBarracaAtual } from '../layouts/LayoutBarraca'

export function TelaChamada() {
  const barraca = useBarracaAtual()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-cozinha-fundo p-6">
      <h1 className="text-2xl font-semibold text-white">{barraca.nome}</h1>
      <p className="text-neutral-400">Tela de chamada em construção.</p>
    </div>
  )
}
