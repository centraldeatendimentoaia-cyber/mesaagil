import { useBarracaAtual } from '../layouts/LayoutBarraca'

export function Ajustes() {
  const barraca = useBarracaAtual()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white p-6 dark:bg-neutral-950">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Ajustes — {barraca.nome}
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">Em construção.</p>
    </div>
  )
}
