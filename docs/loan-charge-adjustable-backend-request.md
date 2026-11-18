# Loan charge Adjustable flag: backend request

> Status: The backend developer confirmed deployment of `adjustable_eligible`
> and `is_adjustable`. The frontend now uses those fields. The proposal below
> records the original request and is not the current API specification.

## Requested behavior

On the loan charge form, show an **Adjustable** checkbox when the selected
`charges_gl` matches a configured loan principal GL, deposit product GL, or
share product GL. The charge name remains independent of the GL and flag.

Please confirm whether matching should consider all products in the tenant or
only active products, and identify the authoritative share product GL. The
existing frontend models expose loan scheme `loan_ledger` and deposit scheme
`prn_ledger`. The share subscription documentation mentions share capital and
receivable ledgers in global settings (IDs 106 and 107), but does not establish
which is the requested share product GL or expose it in the current settings API.

## Proposed API contract (requires backend confirmation)

1. Expose eligibility for each ledger used by the charge form, for example as
   an `adjustable_eligible` boolean on the existing ledger list response. Derive
   it on the authenticated tenant from the authoritative product mappings;
   do not rely on ledger names or client-supplied tenant identifiers.
2. Add a boolean field such as `is_adjustable` to `LoanChargesAdd` and
   `LoanChargesEdit`, and return it from `LoanChargesList`, Add, Edit, and
   Status responses. Confirm the final field name, default, and whether omitted
   values on edit preserve the existing value.
3. Validate the GL and eligibility on the server when the flag is true, in the
   same transaction as the charge save. Return a clear `422` error for an
   ineligible GL or stale configuration. Define what happens to an existing
   true flag when the GL changes or a product mapping is removed.
4. Persist and audit the flag using the application's existing tenant and
   transaction conventions. Confirm whether this change applies only to loan
   charges (as pictured) or also to deposit charges.

Example proposed request fragment (field names and response shape are not yet
part of the documented API):

```json
{
  "charges_gl": 123,
  "is_adjustable": true
}
```

The frontend should keep an existing saved value on edit, clear or reject it
when an ineligible GL is chosen according to the agreed contract, and handle
eligibility lookup failure without silently submitting an incorrect value.
