import { useState, type ReactNode } from 'react'
import { Plus, Sun, Moon, Utensils, ClipboardCheck } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Toggle } from './Toggle'
import { Checkbox } from './Checkbox'
import { Radio } from './Radio'
import { Card } from './Card'
import { Badge } from './Badge'
import { Chip } from './Chip'
import { SegmentedControl } from './SegmentedControl'
import { BottomSheet } from './BottomSheet'

/**
 * Vitrine manual dos primitivos do design system v2.
 * Não é roteada — importar e renderizar ad-hoc para inspeção visual.
 */
export default function Playground() {
  const [dark, setDark] = useState(false)
  const [viagem, setViagem] = useState(true)
  const [aceite, setAceite] = useState(true)
  const [entregue, setEntregue] = useState(false)
  const [metodo, setMetodo] = useState('pix')
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [texto, setTexto] = useState('sem cebola no yakisoba')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-mesa-bg-base p-8 text-mesa-text-primary">
        <div className="mx-auto flex max-w-4xl flex-col gap-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Playground — Design System v2</h1>
            <Button
              variant="outline"
              size="sm"
              icon={dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              onClick={() => setDark((v) => !v)}
            >
              {dark ? 'Claro' : 'Escuro'}
            </Button>
          </div>

          <Section title="Button">
            <Row>
              <Button variant="primary">Enviar Pedido</Button>
              <Button variant="confirm">Confirmar entrega</Button>
              <Button variant="destructive">Cancelar comanda</Button>
              <Button variant="outline">Voltar</Button>
              <Button variant="ghost">Cancelar</Button>
              <Button variant="textDanger">Sair</Button>
            </Row>
            <Row>
              <Button size="sm">sm</Button>
              <Button size="md">md</Button>
              <Button size="lg">lg</Button>
              <Button size="xl">xl</Button>
            </Row>
            <Row>
              <Button icon={<Plus className="size-4" />}>Adicionar</Button>
              <Button icon={<Plus className="size-4" />} iconPosition="right">
                Adicionar
              </Button>
              <Button loading={loading} onClick={() => setLoading((v) => !v)}>
                {loading ? 'Carregando' : 'Alternar loading'}
              </Button>
              <Button disabled>Desabilitado</Button>
            </Row>
          </Section>

          <Section title="Input">
            <Row>
              <Input label="E-mail" type="email" placeholder="voce@exemplo.com" />
              <Input label="Senha" type="password" placeholder="••••••••" />
              <Input label="Buscar" type="search" placeholder="Buscar pedido" />
            </Row>
            <Row>
              <Input label="Preço" type="currency" placeholder="0,00" />
              <Input label="Taxa" type="percentage" placeholder="10" />
              <Input label="Mesa" type="number" placeholder="Opcional" helpText="Campo opcional" />
            </Row>
            <Row>
              <Input label="Com erro" error="Este campo é obrigatório" />
              <Input label="Desabilitado" disabled value="Não editável" />
            </Row>
          </Section>

          <Section title="Textarea">
            <Textarea
              label="Observação"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={140}
              helpText="Visível para a cozinha"
            />
          </Section>

          <Section title="Toggle / Checkbox / Radio">
            <Row>
              <Toggle checked={viagem} onChange={setViagem} label="Viagem" />
              <Checkbox checked={aceite} onChange={setAceite} label="Entregar direto sem passar na cozinha" />
              <Checkbox
                checked={entregue}
                onChange={setEntregue}
                size="lg"
                strikeThroughWhenChecked
                label="2× Yakisoba"
              />
            </Row>
            <Row>
              <Radio checked={metodo === 'dinheiro'} onChange={setMetodo} value="dinheiro" label="Dinheiro" name="pagamento" />
              <Radio checked={metodo === 'pix'} onChange={setMetodo} value="pix" label="Pix" name="pagamento" />
            </Row>
          </Section>

          <Section title="Card">
            <Row>
              <Card className="w-56">Card padrão</Card>
              <Card className="w-56" interactive onClick={() => {}}>
                Card interativo (hover)
              </Card>
            </Row>
          </Section>

          <Section title="Badge">
            <Row>
              <Badge variant="neutral">Mesa 4</Badge>
              <Badge variant="success" dot>
                Online
              </Badge>
              <Badge variant="successOutline" dot>
                Tempo real
              </Badge>
              <Badge variant="warning">09:47 em preparo</Badge>
              <Badge variant="danger">CANCELADO</Badge>
              <Badge variant="info">Dica</Badge>
              <Badge variant="highlight">NOVO</Badge>
            </Row>
          </Section>

          <Section title="Chip">
            <Row>
              <Chip checked>2× Yakisoba</Chip>
              <Chip variant="plain">1× Refrigerante</Chip>
              <Chip checked onClick={() => {}}>
                Selecionável
              </Chip>
            </Row>
          </Section>

          <Section title="SegmentedControl">
            <SegmentedControl
              aria-label="Colunas da cozinha"
              items={[
                { label: 'A Fazer', count: 3, icon: <Utensils className="size-4" /> },
                { label: 'Pronto', count: 1, icon: <ClipboardCheck className="size-4" /> },
              ]}
              activeIndex={segmentIndex}
              onChange={setSegmentIndex}
            />
          </Section>

          <Section title="BottomSheet">
            <Button onClick={() => setSheetOpen(true)}>Abrir bottom sheet</Button>
            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} aria-label="Exemplo de bottom sheet">
              <h2 className="text-lg font-semibold">Confirmar cancelamento</h2>
              <p className="mt-1 text-sm text-mesa-text-secondary">Você quer mesmo cancelar essa comanda?</p>
              <div className="mt-6 flex flex-col gap-3">
                <Button variant="destructive" size="xl" onClick={() => setSheetOpen(false)}>
                  Cancelar comanda
                </Button>
                <Button variant="ghost" size="md" onClick={() => setSheetOpen(false)}>
                  Voltar
                </Button>
              </div>
            </BottomSheet>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-mesa-text-secondary">{title}</h2>
      {children}
    </section>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-4">{children}</div>
}
