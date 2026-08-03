# Transactional email

Approved system templates create immutable subject, HTML, and text snapshots. Feature modules never invoke Nodemailer, and SMTP never runs inside a business transaction.
