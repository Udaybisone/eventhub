-- Full-text search over events using a maintained tsvector column + GIN index,
-- plus a trigram index on title for fuzzy matching. Keeps search well under the
-- 500ms target without a separate search engine.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE events ADD COLUMN search_vector tsvector;

-- Weighted vector: title (A) ranks above organizer/location (B) and description (C).
CREATE OR REPLACE FUNCTION events_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.organizer, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_search_vector_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION events_search_vector_update();

-- Backfill existing rows (the trigger only fires on future writes).
UPDATE events SET title = title;

CREATE INDEX idx_events_search_vector ON events USING GIN (search_vector);
CREATE INDEX idx_events_title_trgm ON events USING GIN (title gin_trgm_ops);
