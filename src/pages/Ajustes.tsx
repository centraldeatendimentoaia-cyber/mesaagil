import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { aplicarTema, PRESETS } from '../lib/tema'
import { useBarracaAtual } from '../layouts/contextoBarraca'
import { useAuth } from '../hooks/useAuth'
import { centavosParaReais, reaisParaCentavos } from '../lib/preco'
import { METODOS_DISPONIVEIS } from '../lib/metodoPagamento'
import type { Barraca, Item } from '../types/database'

function textoPrecoInicial(centavos: number): string {
  return centavos > 0 ? centavosParaReais(centavos).toFixed(2).replace('.', ',') : ''
}

function InputPreco({ item }: { item: Item }) {
  const [texto, setTexto] = useState(() => textoPrecoInicial(item.preco_centavos))
  const [salvo, setSalvo] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const salvoTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
    }
  }, [])

  function aoMudar(valor: string) {
    const limpo = valor.replace(/[^\d.,]/g, '')
    setTexto(limpo)

    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      const centavos = reaisParaCentavos(limpo)
      const { error } = await supabase
        .from('itens')
        .update({ preco_centavos: centavos })
        .eq('id', item.id)

      if (!error) {
        setSalvo(true)
        if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
        salvoTimerRef.current = window.setTimeout(() => setSalvo(false), 1000)
      }
    }, 500)
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <div className="flex h-11 items-center rounded-xl border border-neutral-300 dark:border-neutral-700">
        <span className="pl-2 text-sm text-neutral-500 dark:text-neutral-400">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={texto}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder="0,00"
          aria-label={`Preço de ${item.nome}`}
          className="h-11 w-16 rounded-xl bg-transparent px-2 text-base text-neutral-900 dark:text-neutral-100"
        />
      </div>
      <span className="flex w-4 shrink-0 items-center justify-center">
        {salvo && <Check size={16} className="text-sinal-verde" aria-label="Salvo" />}
      </span>
    </div>
  )
}

function SecaoAjustes({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-neutral-100">{titulo}</h2>
      {children}
    </section>
  )
}

function ModalConfirmacao({
  titulo,
  descricao,
  confirmando,
  onCancelar,
  onConfirmar,
}: {
  titulo: string
  descricao?: string
  confirmando: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-neutral-900">
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{titulo}</p>
        {descricao && (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{descricao}</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="min-h-11 flex-1 rounded-2xl bg-neutral-200 text-base font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={confirmando}
            className="min-h-11 flex-1 rounded-2xl bg-red-600 text-base font-semibold text-white disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

function SecaoItens({ barracaId }: { barracaId: string }) {
  const [itens, setItens] = useState<Item[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [criandoItem, setCriandoItem] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoPreco, setNovoPreco] = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')

  const [itemParaExcluir, setItemParaExcluir] = useState<Item | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const arrastandoIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelado = false

    supabase
      .from('itens')
      .select('*')
      .eq('barraca_id', barracaId)
      .order('ordem')
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) setErro(error.message)
        else setItens((data ?? []) as Item[])
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [barracaId])

  async function persistirOrdem(lista: Item[]) {
    await Promise.all(
      lista.map((item, indice) =>
        supabase.from('itens').update({ ordem: indice + 1 }).eq('id', item.id),
      ),
    )
  }

  function moverItem(id: string, direcao: -1 | 1) {
    const indice = itens.findIndex((i) => i.id === id)
    const novoIndice = indice + direcao
    if (indice === -1 || novoIndice < 0 || novoIndice >= itens.length) return

    const copia = [...itens]
    const [item] = copia.splice(indice, 1)
    copia.splice(novoIndice, 0, item)

    const comOrdem = copia.map((it, i) => ({ ...it, ordem: i + 1 }))
    setItens(comOrdem)
    persistirOrdem(comOrdem)
  }

  function aoSoltar(idAlvo: string) {
    const idOrigem = arrastandoIdRef.current
    arrastandoIdRef.current = null
    if (!idOrigem || idOrigem === idAlvo) return

    const indiceOrigem = itens.findIndex((i) => i.id === idOrigem)
    const indiceAlvo = itens.findIndex((i) => i.id === idAlvo)
    if (indiceOrigem === -1 || indiceAlvo === -1) return

    const copia = [...itens]
    const [movido] = copia.splice(indiceOrigem, 1)
    copia.splice(indiceAlvo, 0, movido)

    const comOrdem = copia.map((item, i) => ({ ...item, ordem: i + 1 }))
    setItens(comOrdem)
    persistirOrdem(comOrdem)
  }

  async function criarItem() {
    const nome = novoNome.trim()
    if (!nome) return

    setSalvandoNovo(true)
    const proximaOrdem = itens.length > 0 ? Math.max(...itens.map((i) => i.ordem)) + 1 : 1
    const precoCentavos = reaisParaCentavos(novoPreco)

    const { data, error } = await supabase
      .from('itens')
      .insert({
        barraca_id: barracaId,
        nome,
        ativo: true,
        ordem: proximaOrdem,
        preco_centavos: precoCentavos,
      })
      .select()
      .single()

    setSalvandoNovo(false)

    if (!error && data) {
      setItens((atual) => [...atual, data as Item])
      setNovoNome('')
      setNovoPreco('')
      setCriandoItem(false)
    }
  }

  function iniciarEdicao(item: Item) {
    setEditandoId(item.id)
    setNomeEdicao(item.nome)
  }

  async function salvarEdicao(item: Item) {
    const nome = nomeEdicao.trim()
    setEditandoId(null)
    if (!nome || nome === item.nome) return

    setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, nome } : i)))
    const { error } = await supabase.from('itens').update({ nome }).eq('id', item.id)

    if (error) {
      setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, nome: item.nome } : i)))
    }
  }

  async function alternarAtivo(item: Item) {
    const novoAtivo = !item.ativo
    setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, ativo: novoAtivo } : i)))
    const { error } = await supabase.from('itens').update({ ativo: novoAtivo }).eq('id', item.id)

    if (error) {
      setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, ativo: item.ativo } : i)))
    }
  }

  async function confirmarExclusao() {
    if (!itemParaExcluir) return
    const item = itemParaExcluir
    setExcluindo(true)

    const { error } = await supabase.from('itens').delete().eq('id', item.id)

    if (!error) {
      setItens((atual) => atual.filter((i) => i.id !== item.id))
      setExcluindo(false)
      setItemParaExcluir(null)
      return
    }

    const { error: erroDesativar } = await supabase
      .from('itens')
      .update({ ativo: false })
      .eq('id', item.id)

    if (!erroDesativar) {
      setItens((atual) => atual.map((i) => (i.id === item.id ? { ...i, ativo: false } : i)))
      setAviso(`"${item.nome}" já foi usado em pedidos e não pode ser excluído — foi desativado.`)
    }

    setExcluindo(false)
    setItemParaExcluir(null)
  }

  return (
    <SecaoAjustes titulo="Itens do cardápio">
      {carregando && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando...</p>
      )}
      {!carregando && erro && (
        <p className="text-sm text-red-600">Não foi possível carregar os itens.</p>
      )}

      {!carregando && !erro && (
        <>
          {aviso && (
            <p className="mb-3 rounded-xl bg-sinal-amarelo/15 p-3 text-sm font-medium text-sinal-amarelo">
              {aviso}
            </p>
          )}

          {itens.length === 0 && (
            <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              Nenhum item cadastrado.
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {itens.map((item, indice) => (
              <li
                key={item.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => aoSoltar(item.id)}
                className={`flex flex-wrap items-center gap-1 rounded-2xl border border-neutral-200 p-2 dark:border-neutral-800 ${
                  item.ativo ? '' : 'opacity-50'
                }`}
              >
                <span
                  draggable
                  onDragStart={() => {
                    arrastandoIdRef.current = item.id
                  }}
                  aria-hidden
                  className="cursor-grab select-none px-1 text-lg text-neutral-400"
                >
                  ⠿
                </span>

                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moverItem(item.id, -1)}
                    disabled={indice === 0}
                    className="flex h-5 w-6 items-center justify-center text-xs text-neutral-400 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moverItem(item.id, 1)}
                    disabled={indice === itens.length - 1}
                    className="flex h-5 w-6 items-center justify-center text-xs text-neutral-400 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {editandoId === item.id ? (
                  <input
                    autoFocus
                    value={nomeEdicao}
                    onChange={(e) => setNomeEdicao(e.target.value)}
                    onBlur={() => salvarEdicao(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                      if (e.key === 'Escape') setEditandoId(null)
                    }}
                    className="h-11 flex-1 rounded-xl border border-neutral-300 px-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(item)}
                    className="min-h-11 flex-1 text-left text-base text-neutral-900 dark:text-neutral-100"
                  >
                    {item.nome}
                  </button>
                )}

                <InputPreco item={item} />

                <button
                  type="button"
                  onClick={() => alternarAtivo(item)}
                  className={`min-h-11 shrink-0 rounded-full px-3 text-xs font-bold ${
                    item.ativo
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {item.ativo ? 'Ativo' : 'Inativo'}
                </button>

                <button
                  type="button"
                  onClick={() => setItemParaExcluir(item)}
                  className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-red-600"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>

          {criandoItem ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                autoFocus
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && criarItem()}
                placeholder="Nome do item"
                className="h-11 flex-1 rounded-2xl border border-neutral-300 px-4 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <div className="flex h-11 items-center rounded-2xl border border-neutral-300 dark:border-neutral-700">
                <span className="pl-3 text-sm text-neutral-500 dark:text-neutral-400">R$</span>
                <input
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value.replace(/[^\d.,]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && criarItem()}
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-label="Preço do novo item"
                  className="h-11 w-20 rounded-2xl bg-transparent px-2 text-base text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <button
                type="button"
                onClick={criarItem}
                disabled={salvandoNovo || !novoNome.trim()}
                className="min-h-11 rounded-2xl bg-marca px-4 text-sm font-semibold text-marca-texto disabled:opacity-40"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCriandoItem(false)
                  setNovoNome('')
                  setNovoPreco('')
                }}
                className="min-h-11 rounded-2xl bg-neutral-200 px-4 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCriandoItem(true)}
              className="mt-3 min-h-11 rounded-2xl bg-marca px-4 text-sm font-semibold text-marca-texto"
            >
              Novo Item
            </button>
          )}
        </>
      )}

      {itemParaExcluir && (
        <ModalConfirmacao
          titulo={`Excluir "${itemParaExcluir.nome}"?`}
          descricao="Essa ação não pode ser desfeita."
          confirmando={excluindo}
          onCancelar={() => setItemParaExcluir(null)}
          onConfirmar={confirmarExclusao}
        />
      )}
    </SecaoAjustes>
  )
}

function SecaoMetodosPagamento({ barraca }: { barraca: Barraca }) {
  const [ativos, setAtivos] = useState<string[]>(
    barraca.metodos_pagamento_ativos ?? ['dinheiro', 'debito', 'credito'],
  )
  const [aviso, setAviso] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const salvoTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
    }
  }, [])

  // useBarraca mostra a barraca em cache (localStorage) na hora e só troca
  // pela versão de verdade quando a busca de rede volta — sem isso, um
  // metodos_pagamento_ativos desatualizado do cache fica preso na tela até
  // um segundo reload. Só resincroniza se não há edição pendente (debounce
  // em voo), pra não sobrescrever um toque recém-feito pelo dono.
  useEffect(() => {
    if (debounceRef.current === null && barraca.metodos_pagamento_ativos) {
      setAtivos(barraca.metodos_pagamento_ativos)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barraca.metodos_pagamento_ativos])

  function persistir(lista: string[]) {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      const { error } = await supabase
        .from('barracas')
        .update({ metodos_pagamento_ativos: lista })
        .eq('id', barraca.id)

      if (!error) {
        setSalvo(true)
        if (salvoTimerRef.current !== null) window.clearTimeout(salvoTimerRef.current)
        salvoTimerRef.current = window.setTimeout(() => setSalvo(false), 1000)
      }
    }, 500)
  }

  function alternar(chave: string) {
    const estaAtivo = ativos.includes(chave)

    if (estaAtivo && ativos.length === 1) {
      setAviso('Você precisa ter ao menos um método de pagamento ativo.')
      return
    }

    setAviso(null)
    const novaLista = estaAtivo ? ativos.filter((m) => m !== chave) : [...ativos, chave]
    setAtivos(novaLista)
    persistir(novaLista)
  }

  return (
    <SecaoAjustes titulo="Métodos de pagamento aceitos">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Marque os métodos que sua barraca aceita. O popup ao enviar pedido só mostra os
        marcados. Se marcar apenas um, o popup pula.
      </p>

      {aviso && (
        <p className="mt-3 rounded-xl bg-sinal-amarelo/15 p-3 text-sm font-medium text-sinal-amarelo">
          {aviso}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {METODOS_DISPONIVEIS.map((metodo) => (
          <div key={metodo.chave} className="flex items-center justify-between gap-3">
            <span className="text-base text-neutral-900 dark:text-neutral-100">
              {metodo.icone} {metodo.label}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={ativos.includes(metodo.chave)}
              aria-label={metodo.label}
              onClick={() => alternar(metodo.chave)}
              className={`relative h-11 w-[72px] shrink-0 rounded-full p-1 transition-colors ${
                ativos.includes(metodo.chave) ? 'bg-marca' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`block h-9 w-9 rounded-full bg-white shadow transition-transform ${
                  ativos.includes(metodo.chave) ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <span className="mt-3 flex h-4 items-center gap-1 text-xs font-medium text-sinal-verde">
        {salvo && (
          <>
            <Check size={14} />
            Salvo
          </>
        )}
      </span>
    </SecaoAjustes>
  )
}

function SecaoFaixas({ barraca }: { barraca: Barraca }) {
  const [verdeAte, setVerdeAte] = useState(String(barraca.verde_ate))
  const [amareloAte, setAmareloAte] = useState(String(barraca.amarelo_ate))
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const verdeNum = Number(verdeAte)
  const amareloNum = Number(amareloAte)
  const valido =
    Number.isFinite(verdeNum) &&
    Number.isFinite(amareloNum) &&
    verdeNum > 0 &&
    amareloNum > verdeNum

  async function salvar() {
    if (!valido) return
    setSalvando(true)
    setErro(null)

    const { error } = await supabase
      .from('barracas')
      .update({ verde_ate: verdeNum, amarelo_ate: amareloNum })
      .eq('id', barraca.id)

    setSalvando(false)

    if (error) {
      setErro('Não foi possível salvar. Tente novamente.')
      return
    }

    setSalvo(true)
    window.setTimeout(() => setSalvo(false), 3000)
  }

  return (
    <SecaoAjustes titulo="Faixas de tempo">
      <div className="flex gap-3">
        <label className="flex-1">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Verde até (min)</span>
          <input
            type="number"
            min={1}
            value={verdeAte}
            onChange={(e) => setVerdeAte(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-neutral-300 px-4 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <label className="flex-1">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Amarelo até (min)
          </span>
          <input
            type="number"
            min={1}
            value={amareloAte}
            onChange={(e) => setAmareloAte(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-neutral-300 px-4 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
      </div>

      {!valido && (
        <p className="mt-2 text-sm text-red-600">
          O tempo do amarelo precisa ser maior que o do verde.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border-2 border-sinal-verde px-3 py-1 font-semibold text-sinal-verde">
          0–{verdeAte || '?'} min
        </span>
        <span className="rounded-full border-2 border-sinal-amarelo px-3 py-1 font-semibold text-sinal-amarelo">
          {verdeAte || '?'}–{amareloAte || '?'} min
        </span>
        <span className="rounded-full border-2 border-sinal-vermelho px-3 py-1 font-semibold text-sinal-vermelho">
          acima de {amareloAte || '?'} min
        </span>
        <span className="rounded-full border-2 border-sinal-pronto px-3 py-1 font-semibold text-sinal-pronto">
          Pronto (congelado)
        </span>
      </div>

      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={!valido || salvando}
        className="mt-4 min-h-11 rounded-2xl bg-marca px-5 text-base font-semibold text-marca-texto disabled:opacity-40"
      >
        {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar Faixas'}
      </button>
    </SecaoAjustes>
  )
}

function SecaoAparencia({ barraca }: { barraca: Barraca }) {
  const [nome, setNome] = useState(barraca.nome)
  const [logoUrl, setLogoUrl] = useState<string | null>(barraca.logo_url)
  const [corPrimaria, setCorPrimaria] = useState(barraca.cor_primaria)
  const [modo, setModo] = useState<'claro' | 'escuro'>(barraca.modo)

  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [erroLogo, setErroLogo] = useState<string | null>(null)

  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvouRef = useRef(false)

  useEffect(() => {
    return () => {
      if (!salvouRef.current) {
        aplicarTema(barraca)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aplicarPreviaCor(cor: string) {
    setCorPrimaria(cor)
    aplicarTema({ ...barraca, cor_primaria: cor, modo })
  }

  function aplicarPreviaModo(novoModo: 'claro' | 'escuro') {
    setModo(novoModo)
    aplicarTema({ ...barraca, cor_primaria: corPrimaria, modo: novoModo })
  }

  async function enviarLogo(arquivo: File) {
    setEnviandoLogo(true)
    setErroLogo(null)

    const extensao = arquivo.name.split('.').pop() ?? 'png'
    const caminho = `${barraca.id}/logo-${Date.now()}.${extensao}`

    const { error: erroUpload } = await supabase.storage
      .from('logos')
      .upload(caminho, arquivo, { upsert: true })

    if (erroUpload) {
      setErroLogo(
        'Não foi possível enviar a logo. Verifique se o bucket "logos" existe e é público no Supabase.',
      )
      setEnviandoLogo(false)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(caminho)
    setLogoUrl(data.publicUrl)
    setEnviandoLogo(false)
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)

    const { error } = await supabase
      .from('barracas')
      .update({ nome, logo_url: logoUrl, cor_primaria: corPrimaria, modo })
      .eq('id', barraca.id)

    setSalvando(false)

    if (error) {
      setErro('Não foi possível salvar. Tente novamente.')
      return
    }

    salvouRef.current = true
    setSalvo(true)
    window.setTimeout(() => setSalvo(false), 3000)
  }

  return (
    <SecaoAjustes titulo="Aparência">
      <label className="block">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Nome exibido</span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-neutral-300 px-4 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </label>

      <div className="mt-4">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Logo</span>
        <div className="mt-2 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-[10px] text-neutral-400 dark:bg-neutral-800">
              sem logo
            </div>
          )}
          <label className="flex min-h-11 cursor-pointer items-center rounded-2xl bg-neutral-200 px-4 text-sm font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
            {enviandoLogo ? 'Enviando...' : 'Escolher imagem'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={enviandoLogo}
              onChange={(e) => {
                const arquivo = e.target.files?.[0]
                if (arquivo) enviarLogo(arquivo)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {erroLogo && <p className="mt-2 text-sm text-red-600">{erroLogo}</p>}
      </div>

      <div className="mt-4">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Cor da marca</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.cor}
              type="button"
              aria-label={preset.nome}
              onClick={() => aplicarPreviaCor(preset.cor)}
              style={{ backgroundColor: preset.cor }}
              className={`h-11 w-11 rounded-xl border-2 ${
                corPrimaria.toLowerCase() === preset.cor.toLowerCase()
                  ? 'border-neutral-900 dark:border-white'
                  : 'border-transparent'
              }`}
            />
          ))}
        </div>

        <label className="mt-3 flex items-center gap-3">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Cor livre (avançado)
          </span>
          <input
            type="color"
            value={corPrimaria}
            onChange={(e) => aplicarPreviaCor(e.target.value)}
            className="h-11 w-16 cursor-pointer rounded-xl border border-neutral-300 dark:border-neutral-700"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Modo escuro</span>
        <button
          type="button"
          role="switch"
          aria-checked={modo === 'escuro'}
          onClick={() => aplicarPreviaModo(modo === 'escuro' ? 'claro' : 'escuro')}
          className={`relative h-11 w-[72px] shrink-0 rounded-full p-1 transition-colors ${
            modo === 'escuro' ? 'bg-marca' : 'bg-neutral-300 dark:bg-neutral-700'
          }`}
        >
          <span
            className={`block h-9 w-9 rounded-full bg-white shadow transition-transform ${
              modo === 'escuro' ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">Prévia</p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="min-h-11 rounded-2xl bg-marca px-5 text-base font-semibold text-marca-texto"
          >
            Botão de exemplo
          </button>

          <div className="flex h-20 w-28 flex-col items-center justify-center rounded-2xl border-4 border-sinal-verde bg-cozinha-fundo">
            <span className="text-2xl font-black text-white">12</span>
            <span className="mt-1 text-[10px] font-medium text-neutral-400">
              cozinha não muda
            </span>
          </div>
        </div>
      </div>

      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="mt-4 min-h-11 rounded-2xl bg-marca px-5 text-base font-semibold text-marca-texto disabled:opacity-40"
      >
        {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar Aparência'}
      </button>
    </SecaoAjustes>
  )
}

function SecaoSair() {
  const navigate = useNavigate()
  const { sair } = useAuth()
  const [confirmando, setConfirmando] = useState(false)

  if (confirmando) {
    return (
      <div className="rounded-2xl bg-neutral-100 p-4 text-center dark:bg-neutral-900">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Tem certeza que deseja sair?
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="min-h-11 flex-1 rounded-2xl bg-neutral-200 text-base font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
          >
            Não
          </button>
          <button
            type="button"
            onClick={async () => {
              await sair()
              navigate('/login')
            }}
            className="min-h-11 flex-1 rounded-2xl bg-neutral-200 text-base font-semibold text-sinal-vermelho/70 dark:bg-neutral-800"
          >
            Sim, sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="min-h-11 w-full rounded-2xl bg-neutral-100 text-base font-medium text-sinal-vermelho/70 dark:bg-neutral-900"
    >
      Sair
    </button>
  )
}

export function Ajustes() {
  const barraca = useBarracaAtual()

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
        <Link
          to={`/${barraca.slug}`}
          className="inline-flex min-h-11 items-center text-sm font-medium text-neutral-500 dark:text-neutral-400"
        >
          ← Lançar Pedido
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ajustes</h1>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <SecaoItens barracaId={barraca.id} />
        <SecaoMetodosPagamento barraca={barraca} />
        <SecaoFaixas barraca={barraca} />
        <SecaoAparencia barraca={barraca} />
        <SecaoSair />
      </div>
    </div>
  )
}
