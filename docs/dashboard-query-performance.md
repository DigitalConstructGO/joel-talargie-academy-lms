# Dashboard query performance

The dashboard uses fixed PostgreSQL aggregates, joins, grouping, and bounded limits. It avoids dashboard caches and N+1 loops. Existing status/date and course/enrollment indexes are reused; production EXPLAIN ANALYZE review remains deployment-data dependent.
