# Module structure

Implemented reusable modules are App, Config, Database, Health, Auth boundary, Users boundary, Roles boundary, Permissions boundary, Storage contract, Mail contract/foundation, Audit, and Jobs. Audit and Jobs have service/repository separation. Database and Mail reuse the completed Phase 2/Phase 1 foundations.

`categories`, `courses`, `lessons`, `enrollments`, `progress`, `payments`, `certificates`, `notifications`, `reports`, and `settings` are empty future-module directories only. No controller, service, repository, or business behavior has been implemented for them.
