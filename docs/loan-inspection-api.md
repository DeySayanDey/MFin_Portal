# Loan Field Verification (Inspection) — Backend API Guide

Screen: `/los/field-verification`.

Browser → Next.js BFF `GET|POST /api/los/inspections` → Laravel:

| Action | Laravel | Stored procedure |
| --- | --- | --- |
| List | `GET /api/LoanInspectionList` | `USP_LOAN_INSPECTION_LIST` |
| Add | `POST /api/LoanInspectionAdd` | `USP_LOAN_INSPECTION_ADD_EDIT` (`ADD`) |
| Edit | `POST /api/LoanInspectionEdit` | `USP_LOAN_INSPECTION_ADD_EDIT` (`EDIT`) |

**Frontend + BFF are already wired.** Confirm Laravel validates/maps the params below and calls the SPs. No new SP is required.

Result codes use `mst_appl_options` group **38**: `1` Positive, `2` Negative, `3` Re-Inspection.

---

## 1. List query parameters

| Param | Type | Rule | SP arg |
| --- | --- | --- | --- |
| `page` | int | default `1` | `p_page` |
| `per_page` | int | default `50`, max `200` | `p_per_page` |
| `pending_only` | `0`/`1` | `1` = apps waiting for visit; omit/`0` = saved inspection history | `p_pending_only` |
| `keyword` | string ≤ 150 | application no / borrower / group | `p_keyword` |
| `branch_id` | int | head office optional; others forced to session branch | `p_branch_id` |
| `fo_id` | int | field officer | `p_fo_id` |
| `inspection_result_cd` | int | group **38**; only applies when `pending_only` ≠ 1 | `p_result_cd` |
| `application_id` | bigint | exact application | `p_application_id` |
| `inspection_id` | bigint | exact inspection | `p_inspection_id` |
| `from_date` / `to_date` | `Y-m-d` | pending uses application date; history uses inspection date | `p_from_date` / `p_to_date` |

### Pending vs history (important)

`USP_LOAN_INSPECTION_LIST` has two modes:

1. **`pending_only = 1`**  
   Applications with status Submitted/Resubmission (`Appl_Status_Cd` 1 or 4), **not** yet a loan account, whose **latest** inspection result is missing or `3` (Re-Inspection).

2. **Otherwise**  
   Rows from `mst_loan_application_inspection` (visit history), filterable by result / FO / dates.

The portal filter **Verification status**:

- Pending field verification → `pending_only=1`
- Verified / history → no `pending_only` (or `0`), optional `inspection_result_cd`

Example:

```http
GET /api/LoanInspectionList?pending_only=1&page=1&per_page=20&keyword=SEED&branch_id=1
Authorization: Bearer {token}
Accept: application/json
```

```http
GET /api/LoanInspectionList?page=1&per_page=20&inspection_result_cd=1&from_date=2026-01-01&to_date=2026-11-04
```

---

## 2. Laravel list checklist

```php
$rules = [
    'page'                  => ['nullable', 'integer', 'min:1'],
    'per_page'              => ['nullable', 'integer', 'min:1', 'max:200'],
    'pending_only'          => ['nullable', 'boolean'], // or in:0,1
    'keyword'               => ['nullable', 'string', 'max:150'],
    'branch_id'             => ['nullable', 'integer', 'min:1'],
    'fo_id'                 => ['nullable', 'integer', 'min:1'],
    'inspection_result_cd'  => ['nullable', 'integer'], // alias: result_cd
    'application_id'        => ['nullable', 'integer', 'min:1'],
    'inspection_id'         => ['nullable', 'integer', 'min:1'],
    'from_date'             => ['nullable', 'date_format:Y-m-d'],
    'to_date'               => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
];
```

Pass every validated value into `USP_LOAN_INSPECTION_LIST` in SP argument order. Do **not** drop `pending_only`.

Non–head-office: ignore client `branch_id`, use session branch.

Result sets:

1. Pagination meta → `meta.total`, `meta.page`, `meta.per_page`, `meta.last_page`
2. Page rows → `data` (snake_case preferred)

Portal expects fields such as:

`inspection_id`, `loan_application_id`, `application_no`, `appl_amount`, `member_name`, `scheme_name`, `inspection_date`, `fo_id`, `fo_name`, `recommended_amount`, `inspection_result_cd`, `inspection_result` (or `inspection_result_desc`), `branch_id`, `branch_name`, GPS / photo / notes.

Pending rows may have `inspection_id = null`.

---

## 3. Add / Edit body

| Field | Required | Notes |
| --- | --- | --- |
| `loan_application_id` | ADD yes | |
| `inspection_id` | EDIT yes | |
| `inspection_date` | yes | ≤ today, ≥ application date |
| `fo_id` | yes | active staff |
| `inspection_result_cd` | yes | 1 / 2 / 3 (group 38) |
| `all_verified` | no | default 1 |
| `recommended_amount` | no | &gt; 0 and ≤ applied amount |
| `inspection_notes` / `notes` | no | |
| `latitude` / `longitude` | no | valid ranges |
| `photo_path` | no | |
| `customer_id` | no | individual/joint or group bulk member |

SP rejects if application is not Submitted/Resubmission, already sanctioned, or FO inactive.

---

## 4. Acceptance checklist

- [ ] `pending_only=1` returns only apps needing a visit (or re-inspection)
- [ ] History mode returns saved inspections; `inspection_result_cd` filters work
- [ ] Branch isolation for non–head-office users
- [ ] ADD creates `mst_loan_application_inspection` and portal toast succeeds
- [ ] Empty pending list returns `success: true`, `data: []`, `meta.total: 0` (not an error)
- [ ] Portal `/los/field-verification` loads pending + history via the status filter

---

## 5. If the UI shows empty pending

Usually **not** a missing API. Check:

1. Applications exist with `Appl_Status_Cd` in (1, 4) and no loan account yet
2. Latest inspection is null or result `3`
3. Laravel actually forwards `pending_only=1` into the SP
4. Branch filter is not excluding the apps
