# Database performance

Catalog, course, and lesson queries target p95 below 300 ms; My Courses below 400 ms; student dashboard, progress updates, and pending-payment queue below 500 ms; certificate verification below 250 ms under representative MVP staging load.

No Neon performance credentials or representative dataset were available during schema implementation. Therefore no query timing, index-use, buffer, row-scan, or p95 claim is made. The gate is: migrate an empty isolated database, run static seeds, explicitly run the performance seed on a separate branch, execute the documented plan suite, review plans, remove redundant indexes, and record planning/execution time, rows scanned/returned, buffers, index used, optimization, and final result here.

Suggested full dataset: 10,000 users, 100 categories, 1,000 courses, 10 sections/course, 20–50 lessons/course, 50,000 enrollments, 500,000 progress records, 50,000 payments, 25,000 certificates, 250,000 notifications, 500,000 activity logs, and 50,000 jobs. Materialized views and caching are not introduced.
