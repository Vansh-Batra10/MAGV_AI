# Growth metrics (what /admin shows and why)

All metrics come from first-party `events` + `orders` (no third-party dependency).

| Metric | Definition | Early target (assumption to validate) |
|---|---|---|
| Funnel | landing_view → template_view → preview_shown → checkout_started → payment_success, with step conversion | first-preview → paid ≥ 8–12% |
| Time to first preview | median `time_to_first_preview_ms` on `preview_shown` | < 90 s on phones |
| Question drop-off | count of `question_step` per step id | no single step losing > 25% |
| Viral coefficient k | new creators who came from a gift / contributor page / story card ÷ gifts sent | k ≥ 0.3 |
| Free → forever | paid `upgrade` orders, split by sender vs recipient | ≥ 5% of free gifts |
| Group | contributors per group gift; % of group gifts paid | ≥ 6 contributors; ≥ 60% paid |
| Unit economics | gross − GST (INR) − gateway fee (incl. 18% GST on fee) − messaging cost = contribution / order | contribution/order ≥ CAC ceiling |
| Repeat | % of buyers with >1 paid order in 90 days; reminders sent → gifts created | ≥ 15% |

**CAC ceiling** = average contribution per order. Don't scale paid acquisition beyond it until repeat rate is known.

Knobs live in `src/config/pricing.ts` (`ECONOMICS`, `EXPERIMENTS`, `REFERRAL`). Price experiments bucket visitors via the `hilo_ab` cookie and log the bucket on each order.
