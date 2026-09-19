export type ItemListaBarras = {
  chave: string
  rotulo: string
  valor: number
  rotuloValor: string
}

/** Lista de barras horizontais — um hue só (mesa-teal), comprimento
 * proporcional ao maior valor da lista. Identidade vem do rótulo ao lado
 * (direct label), não de cor, então não precisa de paleta categórica nem
 * de legenda. */
export function ListaBarras({ itens }: { itens: ItemListaBarras[] }) {
  const maximo = Math.max(1, ...itens.map((i) => i.valor))

  return (
    <ul className="mt-2 flex flex-col gap-2.5">
      {itens.map((item) => (
        <li key={item.chave}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-mesa-text-primary">{item.rotulo}</span>
            <span className="shrink-0 font-mesa-mono font-semibold text-mesa-text-primary">
              {item.rotuloValor}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-mesa-full bg-mesa-neutral-100 dark:bg-mesa-neutral-800">
            <div
              className="h-full rounded-mesa-full bg-mesa-teal-500"
              style={{ width: `${Math.max((item.valor / maximo) * 100, item.valor > 0 ? 3 : 0)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
