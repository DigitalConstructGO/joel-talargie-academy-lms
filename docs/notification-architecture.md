# Notification architecture

Phase 10 centralizes `IN_APP` and `EMAIL` requests in `NotificationsService`. Business services commit first; email snapshots are delivered asynchronously by a PostgreSQL worker. Redis and BullMQ are not used.
