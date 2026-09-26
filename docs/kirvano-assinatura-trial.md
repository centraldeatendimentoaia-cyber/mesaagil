# Contexto: assinatura Kirvano + teste grátis de 3 dias (Sai aê)

> Cole este arquivo como contexto na IA/dev que vai implementar. Ele descreve **o que** o sistema precisa fazer. A stack do app (banco, auth, onde roda o backend) deve ser adaptada ao que o Sai aê já usa hoje.

## 1. Visão geral

- **Produto:** Sai aê, uma comanda digital (caixa, cozinha e chamada de senha). O app roda em `https://saiae.com.br` e tem versão Android.
- **Cobrança:** Kirvano, com um produto de assinatura e 4 ofertas.
- **Teste grátis:** 3 dias, controlado **pelo app** (sem cartão e sem nada na Kirvano).
- **Fonte da verdade do acesso:** o banco do app. A Kirvano só avisa por **webhook**, e o app atualiza o status da conta.

```
LP ──► Cadastro no app ──► TRIAL (3 dias, acesso total ao plano Pro)
                               │
                               ├─ assina no checkout Kirvano ─► webhook SALE_APPROVED ─► ATIVA
                               └─ 3 dias passam sem pagar ───────────────────────────► EXPIRADA (paywall)
```

## 2. Planos e ofertas

| Chave (`plan`/`cycle`) | Oferta Kirvano | Preço | Cobrança |
|---|---|---|---|
| `essencial` / `mensal` | Essencial Mensal | R$ 57,90 | a cada 1 mês |
| `essencial` / `anual` | Essencial Anual | R$ 590,58 | a cada 12 meses |
| `pro` / `mensal` | Pro Mensal | R$ 87,90 | a cada 1 mês |
| `pro` / `anual` | Pro Anual | R$ 843,84 | a cada 12 meses |

Guarde o mapa `offer_id → {plan, cycle}` e o `checkout_url` de cada oferta em **configuração** (env ou tabela), nunca fixos no código. Os IDs saem do painel da Kirvano depois que as ofertas forem criadas.

### Limites por plano (o app precisa respeitar)

| Recurso | Essencial | Pro |
|---|---|---|
| Barracas | 1 | ilimitadas |
| Histórico | últimos 7 dias | completo + filtro por período |
| Exportar relatórios | não | sim |
| Custo do dia, lucro e taxas da maquininha | não | sim |
| Mais vendidos, ritmo, pontos de atenção | não | sim |
| Senha de operador + senha administrativa | não | sim |
| Suporte prioritário WhatsApp | não | sim |
| Lançar pedido, cozinha, senha com logo, formas de pagamento, relatório do dia, tema claro/escuro | sim | sim |

**No trial, a conta usa os recursos do Pro**, para a pessoa ver tudo. Ao assinar o Essencial, os recursos do Pro somem. Nada é apagado: barracas extras ficam só leitura e o histórico antigo fica oculto.

## 3. Modelo de dados (sugestão)

```
accounts
  id                    uuid (PK)
  owner_email           text  (único, minúsculo)
  owner_phone           text
  created_at            timestamptz

subscriptions            (1 por account)
  account_id            uuid (FK, único)
  status                enum: trialing | active | past_due | canceled | expired
  plan                  enum: essencial | pro        (no trial = 'pro')
  cycle                 enum: mensal | anual | null  (no trial = null)
  trial_ends_at         timestamptz
  current_period_end    timestamptz | null   (até quando está pago)
  grace_until           timestamptz | null   (fim da tolerância quando past_due)
  kirvano_customer_email text | null
  kirvano_sale_id       text | null   (última venda aprovada)
  kirvano_offer_id      text | null
  canceled_at           timestamptz | null
  updated_at            timestamptz

webhook_events           (log + idempotência)
  id                    uuid
  event                 text           (ex.: SALE_APPROVED)
  sale_id               text
  dedupe_key            text UNIQUE    (event + ':' + sale_id + ':' + created_at do payload)
  payload               jsonb          (payload bruto, sempre guardar)
  processed_at          timestamptz | null
  error                 text | null
  received_at           timestamptz
```

## 4. Regras do teste grátis

1. No **cadastro**: `status = trialing`, `plan = pro`, `trial_ends_at = agora + 72h`.
2. **Um trial por pessoa**: bloqueie um novo trial se o e-mail **ou** o telefone já tiver tido conta. Se tiver, a conta nasce `expired` e cai direto no paywall.
3. **Durante o trial**: banner fixo "Faltam X dias do seu teste grátis · Assinar agora". No último dia, destacar em laranja.
4. **Quando `trial_ends_at` passar sem pagamento**: `status = expired`.
5. O app **nunca** confia no relógio do celular. O status e os dias restantes vêm do servidor.

## 5. Quem tem acesso (função única, usada em todo o app)

```
hasAccess(sub, now):
  trialing  → now < trial_ends_at
  active    → true
  past_due  → now < grace_until            (tolerância de 3 dias)
  canceled  → now < current_period_end     (usa até o fim do que pagou)
  expired   → false

effectivePlan(sub) → sub.plan se hasAccess, senão null
```

**Sem acesso (paywall):** a pessoa entra no app e vê só a tela de planos. Os dados ficam guardados e ela pode ver o **relatório do dia anterior em modo leitura**, mas não pode lançar pedidos. Nada é apagado.

Faça a checagem **no servidor** (API/regras do banco), não só na interface.

## 6. Fluxo de compra (ligar a venda à conta certa)

O jeito mais seguro é o cliente **sempre ter conta antes do checkout**.

1. Os botões de plano na LP levam para `https://saiae.com.br/assinar?plano=pro&ciclo=anual` (o `signupUrl` da LP já monta esses parâmetros).
2. A rota `/assinar` funciona assim:
   - sem login → cadastro/login e depois volta para `/assinar` com os mesmos parâmetros;
   - com login → redireciona para o `checkout_url` da oferta com:
     - `?src=<account_id>` (a Kirvano devolve `utm.src` no webhook, e é assim que o app acha a conta);
     - o e-mail preenchido, se a Kirvano aceitar parâmetro de e-mail no checkout (**confirmar no painel**).
3. O botão "Teste grátis" da LP (`trialUrl`) leva para `https://saiae.com.br/cadastro`.
4. Depois do pagamento, a página de obrigado da Kirvano leva para `https://saiae.com.br/assinatura?status=processando`. Essa tela consulta o servidor a cada poucos segundos até o webhook chegar. O acesso **nunca** é liberado só pelo redirecionamento.

**Como achar a conta no webhook, em ordem:** `utm.src` (account_id) → `customer.email` igual a `owner_email` ou `kirvano_customer_email`. Se não achar, grave o evento com `error = 'conta_nao_encontrada'` e alerte o admin. Não crie uma conta automaticamente.

## 7. Webhook da Kirvano

**Endpoint:** `POST /api/webhooks/kirvano`, configurado em Kirvano → Integrações → Webhook, com um **token** secreto.

**Segurança:**
- Rejeite (401) se o token não bater. A doc da Kirvano diz que o token é "usado para autenticação das mensagens", mas não diz onde ele chega. Registre os headers e o body do primeiro evento de teste e descubra se ele vem em header ou em campo do JSON.
- Grave o payload bruto **antes** de processar.
- Responda **200 rápido**. Evento duplicado (`dedupe_key` já existe) também recebe 200, sem processar de novo.

**Campos do payload (doc Kirvano):**
- `event`, `event_description`, `sale_id`, `checkout_id`, `payment_method`, `total_price`, `type` (`ONE_TIME` | `RECURRING`), `status`, `created_at`
- `customer { name, document, email, phone_number }`
- `products[] { id, name, offer_id, offer_name, price, is_order_bump }`
- `plan { name, charge_frequency, next_charge_date }` (só em assinatura)
- `utm { src, utm_source, utm_medium, utm_campaign, utm_term, utm_content }`

**O que cada evento faz:**

| Evento | Ação na `subscriptions` |
|---|---|
| `SALE_APPROVED` (1ª compra ou renovação) | `status = active`; `plan/cycle` pelo `offer_id`; `current_period_end = plan.next_charge_date` (sem esse campo: +1 mês ou +12 meses a partir de agora); guardar `sale_id`, `offer_id` e e-mail; limpar `grace_until` e `canceled_at`. Se ainda estava em trial, o trial acaba na hora. |
| `SALE_REFUSED` com `type = RECURRING` e conta `active` | `status = past_due`, `grace_until = agora + 3 dias`, avisar o cliente para atualizar o cartão |
| `SALE_REFUSED` na 1ª compra | nada muda (continua em trial ou expired) |
| Reembolso | `status = expired` na hora |
| `SALE_CHARGEBACK` | `status = expired` na hora + marcar a conta para revisão |
| Assinatura cancelada | `status = canceled`, `canceled_at = agora`; o acesso continua até `current_period_end` |
| `PIX_GENERATED` / `PIX_EXPIRED` / `BANK_SLIP_*` | só registrar (opcional: lembrete de pagamento) |

⚠️ **A confirmar no painel da Kirvano:** os nomes exatos dos eventos de **reembolso**, **assinatura cancelada** e **assinatura atrasada/renovada**. A doc pública só mostra com clareza `SALE_APPROVED`, `SALE_REFUSED`, `SALE_CHARGEBACK`, `PIX_*` e `BANK_SLIP_*`. Deixe o mapeamento `evento → ação` numa tabela/config fácil de ajustar, e ignore (logando) qualquer evento desconhecido.

**Idempotência e ordem:** se chegar um evento mais antigo (`created_at` menor que o `updated_at` salvo) que rebaixaria o status, apenas registre e não aplique.

## 8. Rotina diária (cron, 1x por hora já basta)

- `trialing` com `trial_ends_at < agora` → `expired`
- `past_due` com `grace_until < agora` → `expired`
- `canceled` com `current_period_end < agora` → `expired`
- `active` com `current_period_end < agora - 2 dias` e sem renovação recebida → `past_due` (rede de segurança se um webhook se perder)
- E-mails/WhatsApp: trial acabando (faltando 24h), trial acabou, pagamento recusado, acesso encerrado

## 9. Troca de plano e cancelamento

- A Kirvano não faz proporcional. A **troca** gera um novo checkout da oferta nova. Quando o `SALE_APPROVED` novo chegar, o app passa a valer o plano novo, e a assinatura antiga precisa ser cancelada na Kirvano (manualmente no painel, na v1). Mostre esse aviso na tela.
- **Cancelar:** a tela "Minha assinatura" mostra o plano, o próximo vencimento e o botão "Cancelar", que leva para a área do cliente da Kirvano ou para o WhatsApp de suporte. Na LP a mensagem é "sem fidelidade no mensal".

## 10. Telas do app

1. **Banner de trial:** dias restantes + "Assinar agora".
2. **Paywall `/planos`:** os 2 planos, com toggle Mensal/Anual igual ao da LP (mesmos textos e preços do `MA_PLANS`). O botão leva a `/assinar?plano=&ciclo=`.
3. **`/assinatura`:** status, plano, ciclo, próxima cobrança, trocar ou cancelar e estado "processando pagamento".
4. **Bloqueios de Pro no Essencial:** mostrar o recurso com um cadeado e "Disponível no Pro", em vez de esconder.

## 11. Casos de teste mínimos

- Cadastro novo → `trialing`, com 3 dias, recursos Pro
- Mesmo e-mail ou telefone tenta um 2º trial → nasce `expired`
- Trial vence → paywall, sem lançar pedido, dados preservados
- Compra no trial → `active` na hora e o trial acaba
- Webhook duplicado → processado uma vez só
- Webhook sem `utm.src` → a conta é achada pelo e-mail
- Webhook com token errado → 401
- Renovação recusada → `past_due` com 3 dias de tolerância e depois `expired`
- Cancelamento → acesso até o `current_period_end`
- Essencial com 2 barracas vindas do trial → a 2ª fica só leitura
- Chargeback → `expired` na hora

## 12. Mudanças na landing page (`MA_ASSETS`)

```js
trialUrl:  'https://saiae.com.br/cadastro',
signupUrl: 'https://saiae.com.br/assinar',   // a LP já adiciona ?plano=&ciclo=
emBreve:   false                                    // só quando o fluxo estiver no ar
```
