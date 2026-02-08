-- Add new fields to local_businesses table
ALTER TABLE local_businesses ADD COLUMN IF NOT EXISTS diferencial text;
ALTER TABLE local_businesses ADD COLUMN IF NOT EXISTS promocao text;
ALTER TABLE local_businesses ADD COLUMN IF NOT EXISTS tempo_entrega text;
ALTER TABLE local_businesses ADD COLUMN IF NOT EXISTS formas_pagamento text;
ALTER TABLE local_businesses ADD COLUMN IF NOT EXISTS link_social text;

-- Add parent_id to report_comments for thread replies
ALTER TABLE report_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES report_comments(id) ON DELETE CASCADE;
