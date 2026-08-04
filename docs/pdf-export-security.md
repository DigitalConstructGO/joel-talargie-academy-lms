# PDF export security

PDF reports are generated server-side with PDFKit and stored through private storage. Values are written only as plain text; control characters are removed and field length is bounded. PDFs contain no JavaScript, forms, macros, attachments, or external links. Existing export permissions, sensitive-column rules, ownership checks, retention, and five-minute signed downloads apply.
