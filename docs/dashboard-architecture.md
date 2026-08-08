# Dashboard architecture

Phase 12 provides bounded, permission-aware operational APIs backed directly by normalized PostgreSQL tables. It does not add dashboard snapshot tables, Redis, BullMQ, in-memory caching, exports, or frontend components. The overview composes fixed KPI, trend, preview, course-performance, activity, and health queries using one validated date-range context.
