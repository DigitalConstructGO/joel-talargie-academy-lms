# Report storage

Files use the shared `StorageService` abstraction (see [file-storage-architecture.md](./file-storage-architecture.md)) and keys shaped as `exports/{environment}/{requesterId}/{exportId}/{uuid}.{extension}`, landing under `/storage/exports` with the local driver. Keys contain no email or filter data and are never presented by APIs. Downloads use five-minute signed URLs.
