# Excel export security

XLSX uses ExcelJS without macros or formulas. Database values are written as strings, worksheet names are sanitized and limited to 31 characters, and the header row is frozen. Formula-like user values are neutralized before insertion.
