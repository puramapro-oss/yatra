-- YATRA — Fix migration P5 (slug unique constraint full + retry seed)

SET search_path = yatra, public;

-- Drop l'index partiel et recrée en contrainte unique full sur slug NOT NULL
DROP INDEX IF EXISTS yatra.uniq_aides_slug;

-- Mettre à jour les NULL slug en valeur uniqie (au cas où)
UPDATE yatra.aides SET slug = 'legacy-' || id::text WHERE slug IS NULL;

ALTER TABLE yatra.aides
  ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint si pas existante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'aides_slug_key' AND conrelid = 'yatra.aides'::regclass
  ) THEN
    ALTER TABLE yatra.aides ADD CONSTRAINT aides_slug_key UNIQUE (slug);
  END IF;
END $$;
