# Loan Repayment Schedule — Backend API Guide

Screen: `/lms/repayment-schedule`.

Browser → Next.js BFF `GET /api/lms/repayment-schedule` → Laravel `GET /api/LoanScheduleList` → **`USP_LOAN_SCHEDULE_LIST`** (already in `priomicro_basundhara.sql`).

Loan sidebar / KPI header use the existing **`LoanAccountList`** API (no change required there).

| Layer | Path | Status |
| --- | --- | --- |
| BFF (Next.js) | `GET /api/lms/repayment-schedule?loan_account_id=&as_on=` | **Done** in portal |
| Laravel | `GET /api/LoanScheduleList` | **Required** — thin wrapper |
| Stored procedure | `USP_LOAN_SCHEDULE_LIST(p_loan_account_id, p_as_on)` | **Exists** |

---

## 1. Why Laravel work is needed

The SP already returns installment rows with paid/due/overdue status. There is **no** Laravel route for it yet. The portal BFF calls `/api/LoanScheduleList` and will show an error until that endpoint exists.

---

## 2. Query parameters

| Param | Type | Rule | SP arg |
| --- | --- | --- | --- |
| `loan_account_id` | bigint | **required**, min 1 | `p_loan_account_id` |
| `as_on` | date `Y-m-d` | optional; default `CURDATE()` in SP | `p_as_on` |

Example:

```http
GET /api/LoanScheduleList?loan_account_id=120&as_on=2026-11-04
Authorization: Bearer {token}
Accept: application/json
```

---

## 3. Laravel controller checklist

```php
$rules = [
    'loan_account_id' => ['required', 'integer', 'min:1'],
    'as_on'           => ['nullable', 'date_format:Y-m-d'],
];
```

Call:

```sql
CALL USP_LOAN_SCHEDULE_LIST(?, ?);
-- bind: loan_account_id, as_on (NULL → SP uses CURDATE())
```

**Authorization:** only return the schedule if the loan account is in the caller’s branch scope (same rule as `LoanAccountList` / Dashboard). Reject with `404` or `403` when the account is out of scope — do not leak another branch’s schedule.

Return a standard envelope:

```json
{
  "success": true,
  "message": "Repayment schedule retrieved successfully",
  "data": [
    {
      "schedule_id": 501,
      "loan_account_id": 120,
      "installment_no": 1,
      "due_date": "2026-09-12",
      "principal_due": 3771.87,
      "interest_due": 895.83,
      "total_due": 4667.7,
      "principal_waived": 0,
      "interest_waived": 0,
      "advance_paid": 0,
      "principal_paid": 3771.87,
      "interest_paid": 895.83,
      "paid_amount": 4667.7,
      "balance_due": 0,
      "outs_principal": 46228.13,
      "collection_id": 88,
      "collection_trans_no": "COL-00088",
      "status": "Paid"
    }
  ],
  "meta": {
    "as_on": "2026-11-04",
    "total": 12
  }
}
```

Field names may be PascalCase from the SP result set; either snake_case them in Laravel or leave as returned — the portal mapper accepts **both**.

### Status values from the SP (do not remap)

| `Status` | Meaning |
| --- | --- |
| `Paid` | Principal + interest fully paid |
| `Due` | Next unpaid installment (as-on) |
| `Overdue` | Due date before as-on and not fully paid |
| `Partly Paid` | Partial collection applied |
| `Upcoming` | Future unpaid |
| `Closed` | Loan account not active (`Ln_Status_Cd <> 1`) |

---

## 4. Suggested Laravel skeleton

```php
public function list(Request $request)
{
    $data = $request->validate([
        'loan_account_id' => ['required', 'integer', 'min:1'],
        'as_on'           => ['nullable', 'date_format:Y-m-d'],
    ]);

    // enforce branch / tenant scope on loan_account_id here

    $rows = DB::select('CALL USP_LOAN_SCHEDULE_LIST(?, ?)', [
        $data['loan_account_id'],
        $data['as_on'] ?? null,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Repayment schedule retrieved successfully',
        'data'    => $rows,
        'meta'    => [
            'as_on' => $data['as_on'] ?? now()->toDateString(),
            'total' => count($rows),
        ],
    ]);
}
```

Register route (same auth middleware as other LMS list APIs):

```php
Route::get('/LoanScheduleList', [LoanScheduleController::class, 'list']);
```

---

## 5. Schedule generation (related, not this screen)

Rows appear in `trans_loanac_schedule` after disbursement posts via `USP_LOAN_SCHEDULE_GENERATE` / `USP_LOAN_SCHEDULE_SYNC`. If the list returns empty for a disbursed loan, check that generation ran for that `Loan_Account_Id` and `Is_Active = 1`.

---

## 6. Frontend wiring (already done)

| UI section | Source |
| --- | --- |
| Select loan sidebar + search | `GET /api/lms/loan-accounts` → `LoanAccountList` |
| KPI cards | Selected loan account + schedule aggregates |
| Schedule table | `GET /api/lms/repayment-schedule` → `LoanScheduleList` |
| Export / Print | Client-side CSV / browser print (no backend export API) |

---

## 7. Acceptance checklist

- [ ] `GET /api/LoanScheduleList?loan_account_id={id}` returns `success: true` and an array of installment rows
- [ ] Out-of-branch `loan_account_id` is rejected
- [ ] Missing `loan_account_id` → `422`
- [ ] Paid / Due / Overdue / Upcoming badges match SP `Status`
- [ ] Portal `/lms/repayment-schedule` loads real rows after selecting a loan
- [ ] Empty schedule shows empty state (not a crash) when no `trans_loanac_schedule` rows exist
