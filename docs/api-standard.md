# API standard

The public REST prefix is `/api/v1`. Successful responses use `{ "data": ..., "meta": {}, "error": null }`. Errors use `{ "data": null, "meta": { "correlationId": "..." }, "error": { "code": "", "message": "", "details": [] } }`.

DTOs use class-validator and class-transformer. Unknown properties are rejected, transformation and whitelisting are enabled, and list page size is capped at 100. Dates are stored as PostgreSQL timestamps with time zone and serialized as UTC ISO-8601 strings. Swagger is served at `/api/docs` with bearer-auth support and health schemas.
