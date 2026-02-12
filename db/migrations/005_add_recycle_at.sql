-- Migration: Add recycle_at to crm_leads
-- Description: Adds a recycle_at timestamp to handle Smart Recycle feature (auto-restore lost leads).

ALTER TABLE crm_leads 
ADD COLUMN IF NOT EXISTS recycle_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: Index on recycle_at for performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_recycle_at ON crm_leads(recycle_at);
