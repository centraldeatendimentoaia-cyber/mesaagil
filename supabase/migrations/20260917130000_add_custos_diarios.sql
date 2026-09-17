-- Custo do dia + lucro líquido: o dono lança um valor único de custo
-- operacional por dia (gás, ingredientes etc.) — não é controle de estoque,
-- só um número pra comparar contra a receita e mostrar o lucro líquido nos
-- relatórios. RLS espelha o padrão já usado em itens/pedidos/categorias.
create table if not exists public.custos_diarios (
  id uuid primary key default gen_random_uuid(),
  barraca_id uuid not null references public.barracas(id) on delete cascade,
  data date not null,
  valor_centavos integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (barraca_id, data)
);

alter table public.custos_diarios enable row level security;

create policy "usuarios veem custos de suas barracas"
on public.custos_diarios for select
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios inserem custos em suas barracas"
on public.custos_diarios for insert
to authenticated
with check (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios editam custos de suas barracas"
on public.custos_diarios for update
to authenticated
using (usuario_tem_acesso_barraca(barraca_id))
with check (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios deletam custos de suas barracas"
on public.custos_diarios for delete
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));
