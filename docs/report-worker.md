# Report worker

Run `npm run worker:reports`. Claims use a bounded PostgreSQL CTE with `FOR UPDATE SKIP LOCKED`; the status transition commits before generation and upload. Completion updates require PROCESSING status, preventing completion from overwriting cancellation. Cleanup deletes expired private objects and preserves metadata.
