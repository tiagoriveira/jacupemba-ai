# Configuração do Stripe - Jacupemba AI

## Por que mudamos para price_data?

O sistema agora usa `price_data` dinâmico em vez de Price IDs fixos do Stripe. Isso simplifica a configuração e permite:
- Preços diferentes por categoria sem criar múltiplos produtos no Stripe
- Descrições personalizadas para cada pagamento
- Mais flexibilidade para ajustar preços

## Valores Atuais

- **Produto**: R$ 15,00
- **Serviço**: R$ 15,00
- **Comunicado**: R$ 20,00
- **Vaga**: Grátis
- **Informativo**: Grátis

## Configuração Necessária

### 1. Variáveis de Ambiente Obrigatórias

Adicione no painel Vercel (Settings > Environment Variables):

```bash
# Obrigatório - Chave secreta do Stripe
STRIPE_SECRET_KEY=sk_live_...

# Opcional - URL do webhook (automático no Vercel)
STRIPE_WEBHOOK_SECRET=whsec_...

# Opcional - URL base da aplicação
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
```

### 2. Configurar Webhook no Stripe

1. Acesse [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.com.br/api/stripe/webhook`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copie o "Signing secret" e adicione como `STRIPE_WEBHOOK_SECRET`

### 3. Ativar Métodos de Pagamento

No Stripe Dashboard > Settings > Payment methods:
- ✅ Cartão de crédito/débito
- ✅ Boleto (Boleto Bancário)

### 4. Configurar Modo de Teste

Para desenvolvimento local:

```bash
# Use chaves de teste
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

## Como Funciona Agora

### Fluxo de Pagamento

1. Usuário cria post e seleciona categoria
2. Se não for primeiro post E categoria for paga → API cria checkout
3. Stripe Checkout abre com preço correto da categoria
4. Após pagamento → Webhook cria post automaticamente
5. Post fica "pendente" aguardando aprovação do admin

### Preços Dinâmicos

O sistema calcula o preço em tempo real:

```typescript
// lib/stripe.ts
export function getStripePriceForCategory(category: string) {
  switch (category) {
    case 'produto':
      return { amount: 1500 } // R$ 15,00
    case 'servico':
      return { amount: 1500 } // R$ 15,00
    case 'comunicado':
      return { amount: 2000 } // R$ 20,00
    default:
      return { amount: 1500 }
  }
}
```

### Metadata Enviada ao Stripe

Cada pagamento inclui:
- `user_phone`: Telefone do usuário
- `category`: Categoria do post
- `post_data`: JSON com todos os dados do post
- `type`: "vitrine_post"

## Troubleshooting

### Erro: "No such price: 'price_xxx'"

✅ **RESOLVIDO**: Agora usamos `price_data` dinâmico. Não é mais necessário criar Price IDs fixos no Stripe.

### Erro: "Invalid API Key"

Verifique:
1. `STRIPE_SECRET_KEY` está definida nas variáveis de ambiente
2. Chave começa com `sk_live_` (produção) ou `sk_test_` (teste)
3. Chave foi copiada corretamente (sem espaços)

### Webhook não funciona

Verifique:
1. URL do webhook está correta no Stripe Dashboard
2. `STRIPE_WEBHOOK_SECRET` está definida
3. Eventos corretos estão selecionados
4. Aplicação está deployada (webhooks não funcionam em localhost sem túnel)

### Boleto não aparece

1. Ative Boleto no Stripe Dashboard > Payment methods
2. Conta Stripe deve estar configurada para Brasil
3. Moeda deve ser BRL

## Testes Recomendados

### Cartões de Teste

Sucesso: `4242 4242 4242 4242`
- CVV: qualquer 3 dígitos
- Data: qualquer data futura
- CEP: qualquer válido

Falha: `4000 0000 0000 0002`

### Testar Fluxo Completo

1. Criar primeiro post (grátis) ✅
2. Criar segundo post categoria "produto" (R$ 15) ✅
3. Criar post categoria "comunicado" (R$ 20) ✅
4. Verificar webhook criou post no banco ✅
5. Republicar post (cobrar novamente) ✅

## Monitoramento

### Logs do Stripe

Acesse: [Stripe Dashboard > Developers > Logs](https://dashboard.stripe.com/logs)

Procure por:
- Checkout sessions criados
- Pagamentos completados
- Webhooks recebidos
- Erros de API

### Logs da Aplicação

No Vercel:
```bash
[Stripe] Erro ao criar checkout: ...
[Stripe Webhook] Pagamento confirmado: session_xxx
```

## Suporte

- Documentação Stripe: https://stripe.com/docs
- Suporte Stripe: https://support.stripe.com
- Status do Stripe: https://status.stripe.com
