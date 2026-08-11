# Repository pattern

Repositories are the only application layer permitted to access Drizzle. `BaseRepository` establishes typed CRUD contracts and reusable bounded pagination, allowed-field sorting, timestamp, and soft-delete conventions. Concrete repositories implement table-specific projections, filters, transactions, and locks.

Repositories select explicit columns, paginate inside PostgreSQL, use deterministic ordering, avoid N+1 loops, and make archived-record behavior explicit. Multi-table decisions use short database transactions; email, storage, PDFs, and other external work starts only after commit.
