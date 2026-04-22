# picknbuild Pricing — Down Payment, Price, Cadence

## picknbuild Core Logic

picknbuild must support:
- credit-tiered down payment
- bi-weekly payments
- customization
- build requests / links / files
- "already have a car" estimate flow

## Down Payment by Credit

The down payment percentage is driven directly by the user's credit score. Lower credit = more cash upfront. The full table lives in [01-top-controls.md](01-top-controls.md#picknbuild-down-payment-by-credit).

Summary:

| Band | Score range | Down |
|------|-------------|-----:|
| 🔴 Red | 600–650 | 22% → 20% |
| 🟡 Yellow | 650–700 | 20% → 16% |
| 🟢 Green | 700–800+ | 16% → 12% |

**Floor:** under 600 or No Credit → locks at **22%**.

Interpolate linearly between listed scores. Must update live whenever the credit score or No Credit toggle changes.

## Total Price Formula

```
1. vehicle_price       = base_price + tax + fees
2. customization_total = sum(selected_customizations)
3. total_price         = vehicle_price + customization_total
4. down_percentage     = f(credit_score)   // see table above
5. down_payment        = total_price × down_percentage
6. remaining_balance   = total_price − down_payment
```

Apply rebuilt discount to `vehicle_price` before step 3 if connected.

## Term Selection

Term (1–5 years) controls **only the payment cadence** — not price. The total owed is the same regardless of term.

## Payment Cadence — Bi-Weekly

picknbuild uses bi-weekly payments, **not monthly**.

```
number_of_biweekly_payments = selected_years × 26
biweekly_payment            = remaining_balance / number_of_biweekly_payments
```

| Term | Payments |
|------|---------:|
| 1 year  | 26 |
| 2 years | 52 |
| 3 years | 78 |
| 4 years | 104 |
| 5 years | 130 |

**Hide biweekly payment when Cash selected.**

---

Source: §27 Core Logic, §30 Total Price (revised), §31 Payment Cadence; down-payment table per updated mapping in [01-top-controls.md](01-top-controls.md)
