# Certificate background worker

The worker is enabled only with `CERTIFICATE_WORKER_ENABLED=true`. It claims a bounded batch using `FOR UPDATE SKIP LOCKED`, commits the claim, then renders and uploads without holding row locks. Locks record worker identity and are recovered after the configured timeout. Attempts and retry delays are bounded.
