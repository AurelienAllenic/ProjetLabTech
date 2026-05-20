CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  display_name  TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('userLabo', 'labo')),
  created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_assignments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id    TEXT        NOT NULL,
  document_title TEXT        NOT NULL,
  -- Chemin dans le bucket Supabase (SUPABASE_ASSIGNMENTS_BUCKET). NULL = document d'exemple sans fichier.
  storage_path   TEXT,
  assigned_by    UUID        NOT NULL REFERENCES users(id),
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analyses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  elements   JSONB       NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX ON users (email);
CREATE INDEX ON document_assignments (user_id);
CREATE INDEX ON document_assignments (assigned_by);
CREATE INDEX ON analyses (user_id);

-- Désactiver RLS (le backend utilise la service role key)
ALTER TABLE users                DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses             DISABLE ROW LEVEL SECURITY;

-- Si la base existait avant l’ajout du stockage des PDF attribués :
-- ALTER TABLE document_assignments ADD COLUMN IF NOT EXISTS storage_path TEXT;
