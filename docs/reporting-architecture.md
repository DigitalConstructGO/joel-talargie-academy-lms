# Reporting architecture

Reports use fixed backend queries over normalized PostgreSQL tables. Clients may provide only DTO-approved filters, paging, grouping, and sorting. No SQL, table name, expression, or arbitrary column is accepted. Sensitive fields require enhanced permissions and are masked by default.
