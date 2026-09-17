-- Fase 5: categorias de cardápio (agrupar itens pra facilitar o caixa).
-- RLS espelha exatamente o padrão já usado em `itens`/`pedidos`
-- (usuario_tem_acesso_barraca), pra manter as mesmas garantias de
-- multi-tenant.
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  barraca_id uuid not null references public.barracas(id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  criada_em timestamptz not null default now()
);

alter table public.categorias enable row level security;

create policy "usuarios veem categorias de suas barracas"
on public.categorias for select
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios inserem categorias em suas barracas"
on public.categorias for insert
to authenticated
with check (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios editam categorias de suas barracas"
on public.categorias for update
to authenticated
using (usuario_tem_acesso_barraca(barraca_id))
with check (usuario_tem_acesso_barraca(barraca_id));

create policy "usuarios deletam categorias de suas barracas"
on public.categorias for delete
to authenticated
using (usuario_tem_acesso_barraca(barraca_id));

alter table public.itens
  add column if not exists categoria_id uuid references public.categorias(id) on delete set null;
