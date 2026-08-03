# Manual payment workflow

Phase 8 implements private manual bank-transfer receipt submission and Administrator review. It does not implement an online gateway, refunds, certificates, or frontend pages.

The expected amount comes exclusively from the immutable enrollment snapshot. A positive discount snapshot is the payable amount; otherwise the original price snapshot is used. Money is normalized as an exact two-decimal string without floating-point calculations.

Submission accepts one JPEG, PNG, WebP, or PDF up to 12 MB. The declared MIME type, extension, and magic signature must agree; double extensions and empty files are rejected. The backend generates a random private key and SHA-256 checksum. Storage keys are never returned. Receipt access uses an ownership- or permission-protected URL that expires in five minutes.

Receipt upload does not grant course access. The locked workflow is:

`PENDING_PAYMENT → receipt submitted → WAITING_APPROVAL → Administrator approval → ENROLLED`

Decline returns the enrollment to `PENDING_PAYMENT`, preserving the declined attempt and receipt. Resubmission creates the next attempt number. A partial unique index permits only one pending attempt per enrollment.

Approval of an amount mismatch requires `payments.approve_amount_mismatch` and a reason. Duplicate transaction references are warnings rather than automatic rejection, and must be acknowledged during approval. Approve and decline lock both payment and enrollment rows, so only one terminal decision succeeds.
