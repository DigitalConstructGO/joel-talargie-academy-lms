# Security foundation

bcrypt performs one-way password hashing: `bcrypt.hash()` creates the stored salted hash and `bcrypt.compare()` verifies a candidate. Passwords are never encrypted or decrypted. Salt rounds default to 12 and validation permits only integers from 10 to 14. Neither passwords nor hashes may be logged or returned by APIs. Registration, login, JWT issuance, and other authentication workflows are scheduled for later phases.
