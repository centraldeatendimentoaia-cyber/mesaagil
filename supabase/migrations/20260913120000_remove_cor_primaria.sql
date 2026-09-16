-- Cor de marca do MesaAgil agora é fixa no produto (laranja #F58B00
-- para comando, teal #00B894 para confirmação) — personalização por
-- barraca fica restrita a logo, nome e modo claro/escuro.
-- Ver docs/design-system/MESAAGIL_DESIGN_SYSTEM.md seção 2.1.1.

alter table public.barracas drop column if exists cor_primaria;
