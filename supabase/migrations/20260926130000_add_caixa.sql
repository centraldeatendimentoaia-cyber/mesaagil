-- Caixa (abrir/fechar + sangria/suprimento) — fundação do hub desktop
-- (ver CLAUDE.md, roadmap de 2026-09-26). Pode haver várias sessões de
-- caixa no mesmo dia (reabrir depois de um erro, ou dois turnos) —
-- por isso `data` não é unique, e o app sempre pega a mais recente por
-- `aberto_em`. RLS espelha o padrão já usado em custos_diarios/categorias
-- (usuario_tem_acesso_barraca).
create table public.caixas (
  id uuid primary key default gen_random_uuid(),
  barraca_id uuid not null references public.barracas(id) on delete cascade,
  data date not null,
  status text not null default 'aberto' check (status in ('aberto', 'fechado')),
  valor_abertura_centavos integer not null default 0,
  observacao_abertura text,
  aberto_em timestamptz not null default now(),
  valor_fechamento_centavos integer,
  valor_esperado_centavos integer,
  diferenca_centavos integer,
  observacao_fechamento text,
  fechado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index caixas_barraca_data_idx on public.caixas (barraca_id, data);

alter table public.caixas enable row level security;

create policy "usuarios veem caixas de suas barracas"
on public.caixas for select
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios abrem caixas em suas barracas"
on public.caixas for insert
to authenticated
with check (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios fecham caixas de suas barracas"
on public.caixas for update
to authenticated
using (usuario_tem_acesso_barraca(barraca_id))
with check (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios apagam caixas de suas barracas"
on public.caixas for delete
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));

-- Sangria (retirada) e suprimento (reforço) durante o caixa aberto — log
-- de movimentação, sem update: corrige um lançamento errado apagando e
-- lançando de novo.
create table public.movimentos_caixa (
  id uuid primary key default gen_random_uuid(),
  barraca_id uuid not null references public.barracas(id) on delete cascade,
  caixa_id uuid not null references public.caixas(id) on delete cascade,
  tipo text not null check (tipo in ('sangria', 'suprimento')),
  valor_centavos integer not null,
  motivo text,
  criado_em timestamptz not null default now()
);

create index movimentos_caixa_caixa_idx on public.movimentos_caixa (caixa_id);

alter table public.movimentos_caixa enable row level security;

create policy "usuarios veem movimentos de suas barracas"
on public.movimentos_caixa for select
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios lancam movimentos em suas barracas"
on public.movimentos_caixa for insert
to authenticated
with check (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios apagam movimentos de suas barracas"
on public.movimentos_caixa for delete
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));
