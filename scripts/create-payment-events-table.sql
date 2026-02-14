-- Tabela para registrar eventos de pagamento do Asaas
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  status TEXT,
  value DECIMAL(10, 2),
  customer_id TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at DESC);

-- Comentários
COMMENT ON TABLE payment_events IS 'Registra todos os eventos de pagamento recebidos via webhook do Asaas';
COMMENT ON COLUMN payment_events.event_type IS 'Tipo do evento (PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc.)';
COMMENT ON COLUMN payment_events.payment_id IS 'ID da cobrança no Asaas';
COMMENT ON COLUMN payment_events.payload IS 'Payload completo do webhook para auditoria';
