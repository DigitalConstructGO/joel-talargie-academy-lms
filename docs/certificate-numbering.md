# Certificate numbering

Numbers use `JTA-{UTC year}-{128-bit random hexadecimal suffix}`. They contain no user identifier or email and are database-unique. Verification tokens use 256 random bits encoded as URL-safe Base64 and are independently unique.
