# Architecture overview

The system is a TypeScript npm-workspace modular monolith. Next.js owns the browser interface, NestJS exposes a versioned REST API, and `@joel-academy/contracts` is the single source for wire contracts. Feature-based Nest modules will preserve clean boundaries. Phase 1 has no persistence layer.
