-- Extensions (available on Neon and Supabase Postgres)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Full-text expression indexes. Queries must use the SAME expressions to benefit.
CREATE INDEX IF NOT EXISTS post_fts_idx ON "Post"
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')));

CREATE INDEX IF NOT EXISTS post_title_trgm_idx ON "Post" USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS experience_fts_idx ON "Experience"
  USING GIN (to_tsvector('english', coalesce(role,'') || ' ' || coalesce(tips,'') || ' ' || rounds::text));

CREATE INDEX IF NOT EXISTS user_fts_idx ON "User"
  USING GIN (to_tsvector('simple', coalesce("fullName",'') || ' ' || coalesce(company,'') || ' ' || coalesce("jobTitle",'') || ' ' || coalesce(bio,'')));

CREATE INDEX IF NOT EXISTS team_fts_idx ON "Team"
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX IF NOT EXISTS story_fts_idx ON "Story"
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(body,'')));

CREATE INDEX IF NOT EXISTS company_name_trgm_idx ON "Company" USING GIN (name gin_trgm_ops);
