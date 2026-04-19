-- Refresh-token blacklist. Replaces the planned Cloudflare KV store.
-- Entries are indexed by JTI (JWT ID) and carry an explicit expiry so
-- reads can filter out rows whose original token already expired on its
-- own. Expired rows are cleaned lazily (via a periodic DELETE or just
-- left until the next vacuum — storage is cheap).
CREATE TABLE IF NOT EXISTS refresh_blacklist (
    jti TEXT PRIMARY KEY,
    exp TIMESTAMPTZ NOT NULL
);

-- Cleanup helper: lets a periodic job delete expired rows fast.
CREATE INDEX IF NOT EXISTS idx_refresh_blacklist_exp ON refresh_blacklist (exp);
