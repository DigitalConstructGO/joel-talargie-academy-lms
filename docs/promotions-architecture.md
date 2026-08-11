# Promotion & Coupon Management System

## Why the engine is data-driven, not type-switched

`PromotionEngineService` (`apps/api/src/modules/promotions/engine/promotion-engine.service.ts`) takes a `PromotionValidationInput` + pre-fetched `PromotionValidationData` and returns a `PromotionValidationResult` - it never touches the database and never branches on `campaign.type`. The 16 promotion types (percentage discount, scholarship, referral reward, flash sale, birthday coupon, ...) are purely descriptive/analytics metadata on the campaign row. Every actual behavior - discount math and eligibility - is driven by generic scalar/array columns already on `promo_campaigns` (`discountType`, `discountValue`, `maxDiscountAmount`, `allowedRoles`, `allowedCountries`, `newStudentsOnly`, `totalSeats`, ...) plus a flat, ordered list of pluggable rule predicates in `engine/rules/eligibility.rules.ts`. Adding a 17th promotion type is a data change (a new enum value, a campaign configured with existing fields); adding a genuinely new eligibility _dimension_ is one new pure function added to the rule list - neither touches the pricing math or any other rule.

Each rule is `(ruleSet, input) => boolean`, independently unit-tested. `engine/rules/pricing.rules.ts` computes the discount (percentage/fixed/free, capped by `maxDiscountAmount`, always clamped to `[0, originalPrice]`). `engine/rules/reward.rules.ts` computes referrer rewards and affiliate commissions from the same pricing result.

## Request flow

`RedemptionService.evaluate()` (`services/redemption.service.ts`) is the only place that talks to both the repository and the engine:

1. Look up the course (404 if missing).
2. If a `code` was supplied, fetch that code + its campaign + its rule sets (`PromotionsRepository.findRuleSetByCode`); otherwise fetch every `ACTIVE`, `isAutomatic` campaign as candidates.
3. Fetch the requesting user's redemption counts and new-student status.
4. Call `PromotionEngineService.evaluate()` - pure, synchronous, fully tested in isolation.

`validate()` always returns `200 { valid, reasonCode, pricing }`, even for an invalid/expired/ineligible coupon - it never throws except for a missing course, matching normal "check a coupon" UX. `redeem()` runs the identical evaluation, then throws `422` with the reason code if invalid, or persists a `promo_redemptions` row via a single DB transaction (`PromotionsRepository.recordRedemption`).

If the campaign has `requiresApproval` (scholarships), the row is inserted as `RESERVED` and campaign/code/affiliate usage counters are **not** applied yet - see "Scholarship approval workflow" below. Otherwise it's inserted as `CONFIRMED` and counters apply immediately.

## Enrollment integration

`POST /enrollments` accepts an optional `redemptionId`. When supplied, `EnrollmentsRepository.create()` - inside its existing transaction, under the same `FOR UPDATE` row lock it already takes on the course - re-fetches and re-validates the redemption itself rather than trusting the caller: it must belong to the requesting student, match the course, be `CONFIRMED` (not `RESERVED` or already spent), and not already be linked to another enrollment. This closes the TOCTOU window between "redemption looked valid" and "redemption gets spent."

The redemption's own `originalPrice`/`finalPrice` become `priceAtEnrollment`/`discountAtEnrollment` (`discountAtEnrollment` holds the _final discounted price_, matching the existing `courses.discountPrice`-as-sale-price convention already used by `PaymentsService.expectedAmount()` - not a subtracted amount). A `finalPrice` of `0` short-circuits the enrollment straight to `ENROLLED`, bypassing `PENDING_PAYMENT`, the same way `accessType: 'FREE'` courses already do. `promo_redemptions.enrollmentId` is set to the new enrollment in the same transaction.

**No changes were needed in `PaymentsService`.** It already reads `expectedAmount` from the enrollment's own `priceSnapshot`/`discountSnapshot`, never from the course directly - so once the enrollment snapshot is correct, the payment flow picks up the discounted amount for free. Verified live: a 25%-off flash-sale redemption used to enroll produced `discountAtEnrollment: "75.00"`, and `GET .../payment-instructions` immediately reported `expectedAmount: "75.00"` with zero payments-module code changes.

## Scholarship approval workflow

Campaigns with `requiresApproval: true` (typically `SCHOLARSHIP` type, paired with `discountType: 'FREE'` and `totalSeats`) produce `RESERVED` redemptions instead of `CONFIRMED` ones. `AdminRedemptionsController` (`promotions.approve_redemptions` permission) exposes:

- `GET /promotions/redemptions/pending` - the review queue.
- `POST /promotions/redemptions/:id/approve` - flips the row to `CONFIRMED` and _only now_ applies campaign/code/affiliate counters (`PromotionsRepository.confirmRedemption`), so a request that's later rejected never permanently consumes a limited-seat scholarship slot.
- `POST /promotions/redemptions/:id/reject` - flips to `CANCELLED` with a stored `rejectionReason`; no counters were ever applied, so none need reverting.

`approvedBy`/`approvalDecisionAt`/`rejectionReason` on `promo_redemptions` give a full audit trail. Verified live: a `RESERVED` scholarship redemption correctly blocks enrollment (`422 REDEMPTION_NOT_AVAILABLE`) until approved, after which enrollment succeeds and lands the student directly in `ENROLLED`; a rejected redemption permanently blocks enrollment.

## Referral and affiliate flows

Referral codes are issued lazily: `GET /promotions/referral-code` looks for the caller's existing `REFERRAL`-type code under the active `REFERRAL_REWARD` campaign and creates one on first request (`RedemptionService.myReferralCode`). On redemption, if the code's `ownerUserId` differs from the redeemer, `computeReferrerReward` credits `referralOwnerId` + `referrerRewardAmount` on the redemption row (self-referral is explicitly excluded).

Affiliates are tracked via `promo_affiliates`, linked to a code via `promoCodes.affiliateId`. Every `validate()` call against an affiliate-linked code increments `totalClicks` (the closest proxy to "affiliate link click" without a dedicated tracking endpoint - see below). Every successful `redeem()` increments `totalEnrollments`/`totalRevenue`/`totalCommission` in the same transaction as the redemption insert.

## Endpoints beyond the original list

Three endpoint groups were added beyond the literal spec because the objectives they serve are otherwise unreachable:

- `GET /promotions/referral-code` (student) - without it, "student receives a referral code" would require an admin to manually mint one per student.
- `POST/GET/PATCH /promotions/affiliates` (admin, `promotions.manage_affiliates`) - without it, there is no way to create the affiliate profile a coupon's `affiliateId` must reference.
- `GET /promotions/redemptions/pending`, `POST /promotions/redemptions/:id/approve`, `POST /promotions/redemptions/:id/reject` (admin, `promotions.approve_redemptions`) - without these, `requiresApproval` scholarship campaigns have no way to ever leave the `RESERVED` state.

## Route registration order (load-bearing)

`AdminCampaignsController` owns `GET/PATCH/DELETE /promotions/:id` - a wildcard at the same path depth as `/promotions/coupons`, `/promotions/analytics`, `/promotions/history`, `/promotions/referral-code`, and `/promotions/affiliates`. Express/Nest match routes in registration order, not by specificity (the certificates module already relies on this same behavior for `certificates/verify/:token` vs `certificates/:certificateId`). `promotions.module.ts` therefore registers every static-path controller before `AdminCampaignsController`; this was verified live (`GET /promotions/coupons` correctly resolves to the coupon list, not campaign-detail with `id="coupons"`).

## Database

Eight additive tables (migration `0017_brave_inertia.sql`), plus a follow-up additive migration (`0018_parallel_starhawk.sql`) adding `affiliateCommissionAmount`, `approvedBy`, `approvalDecisionAt`, and `rejectionReason` to `promo_redemptions` for the approval workflow's audit trail. No existing table's existing columns were modified, and `EnrollmentsRepository`/`EnrollmentsService` gained one new optional parameter (`redemptionId`) with fully backward-compatible behavior when omitted.

A partial unique index (`promo_redemptions_active_code_student_uq` on `(code_id, student_id)` where `status IN ('RESERVED','CONFIRMED')`) backstops duplicate-redemption prevention at the database level, independent of the engine's own check.

## Deliberately out of scope

**Bundle checkout**: true multi-course "Bundle Discount" semantics (a discount contingent on purchasing several courses together) needs a cart concept this app doesn't have anywhere in the existing catalog/enrollments/payments flow, which is strictly single-course. Building a cart subsystem is its own project, not a promotions-module change. The current `promo_course_rules` many-to-many table still models "this campaign applies to any course in this set," just evaluated per-course rather than as an atomic multi-item purchase.

**Payment→redemption linking**: `promo_redemptions.paymentId` exists but is never written. It would let analytics distinguish "discount granted" from "discount actually converted to a completed payment," but isn't required for the discount itself to take effect (that already works via the enrollment snapshot, see above) - left for a future analytics pass.
