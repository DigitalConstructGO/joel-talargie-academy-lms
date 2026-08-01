# Error handling

The global exception filter maps validation, bad-request, conflict, unauthorized, forbidden, not-found, and unexpected failures into the standard envelope. Validation messages become structured details. HTTP status determines the stable code, while unexpected and database failures return only `Internal server error`.

Stack traces, SQL, provider errors, environment variables, database URLs, tokens, and passwords are never included. The correlation ID is copied into error metadata for support investigation.
