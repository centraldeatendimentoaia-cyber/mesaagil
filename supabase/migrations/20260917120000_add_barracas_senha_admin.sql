-- Fase 5: senha administrativa em Ajustes.
--
-- Tabela separada de `barracas` de propósito: `barracas` é buscada com
-- select('*') em useBarraca.ts e cacheada em localStorage (para abrir
-- offline) — um hash de senha nessa linha vazaria pro cache do navegador.
-- Aqui, RLS fica sem NENHUMA policy: a linha só é lida/escrita pelas
-- funções SECURITY DEFINER (definir_senha_admin, verificar_senha_admin,
-- senha_admin_configurada), nunca por select direto do client.
create extension if not exists pgcrypto;

create table if not exists public.barracas_senha_admin (
  barraca_id uuid primary key references public.barracas(id) on delete cascade,
  senha_hash text not null,
  atualizado_em timestamptz not null default now()
);

alter table public.barracas_senha_admin enable row level security;
