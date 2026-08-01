# Course search

Course search uses PostgreSQL built-in full-text search, so no Neon extension is required. A stored generated `tsvector` weights title as A, short description and presenter as B, and slug as C. A GIN index supports `websearch_to_tsquery` or `plainto_tsquery`; results should use `ts_rank` and add `published_at DESC, id DESC` as deterministic tie-breakers. Category text remains normalized and is joined as an exact slug/name filter.

Fallback behavior is prefix matching on normalized input with strict page-size limits; unrestricted `LOWER(column) LIKE '%term%'` is not permitted for a large catalog. Search relevance, partial-term expectations, and plan selection still require measurement on an isolated Neon performance branch.
