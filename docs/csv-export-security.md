# CSV export security

CSV is UTF-8 with BOM, RFC-style quoted fields, doubled quotes, and preserved newlines. Spreadsheet-trigger characters (`=`, `+`, `-`, `@`, tab, carriage return) are prefixed with an apostrophe. Money is emitted as its exact decimal string.
