# Email worker

After building, run `npm run worker:email`. It claims bounded, priority-ordered batches with `FOR UPDATE SKIP LOCKED`, commits, calls the pooled SMTP transport, then records outcomes separately.
