-- Emissão de verdade da NFC-e via FocusNFe — CLAUDE.md, roadmap de
-- 2026-09-26 (a migração 20260926150000_add_fiscal.sql só guardou a
-- configuração; esta guarda o resultado de cada tentativa de emissão).
alter table public.pedidos
  add column nfce_status text,
  add column nfce_chave text,
  add column nfce_numero text,
  add column nfce_mensagem text,
  add column nfce_emitida_em timestamptz;

-- `cnpj_emitente` é campo obrigatório no payload de emissão da FocusNFe
-- e não existia em barracas até agora (a configuração fiscal anterior
-- guardou token/regime/ambiente, mas não o CNPJ do emitente). Nullable
-- de propósito: cadastro pela UI (Ajustes) fica pra uma rodada seguinte,
-- a Edge Function valida a presença antes de chamar a API.
alter table public.barracas
  add column cnpj text;
