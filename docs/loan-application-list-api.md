# Loan Application List — Backend API Guide

Screen: `/los/applications`. Browser → Next.js BFF `GET /api/los/applications` → Laravel `GET /api/LoanApplicationList` → `USP_LOAN_APPLICATION_LIST`.

Frontend already sends the filter query params below. The SP in `priomicro_basundhara.sql` already accepts them. Use this doc to confirm Laravel validation/mapping and the small keyword gaps below.

| BFF (Next.js) | Laravel | Method | Stored procedure |
| --- | --- | --- | --- |
| `GET /api/los/applications?...` | `/api/LoanApplicationList` | GET | `USP_LOAN_APPLICATION_LIST` |

---

## 1. Query parameters (combine with AND)

All filters are optional. Empty / omitted = no constraint. Branch isolation is enforced on the BFF for non–head-office users (`resolveBranchFilter`).

| Param | Type | Rule | SP arg |
| --- | --- | --- | --- |
| `page` | int | default `1`, min `1` | `p_page` |
| `per_page` | int | default `50`, max `200` | `p_per_page` |
| `keyword` | string ≤ 150 | trim; search application / borrower | `p_keyword` |
| `stage` | string | one of: `field_verification`, `assessment`, `approval`, `sanctioned`, `disbursed`, `rejected` | `p_stage` |
| `scheme_id` | int | active loan scheme | `p_scheme_id` |
| `branch_id` | int | head office may pass any; others forced to session branch | `p_branch_id` |
| `cust_type_cd` | int | `mst_appl_options` grp **34** (1 = group / JLG, 2 = individual) | `p_cust_type_cd` |
| `appl_status_cd` | int | grp **37** (1 submitted, 2 approved, 3 rejected, 4 resubmission) | `p_appl_status_cd` |
| `fo_id` | int | field officer staff id | `p_fo_id` |
| `member_id` | int | individual primary/joint or bulk member | `p_member_id` |
| `group_id` | int | group primary customer | `p_group_id` |
| `application_id` | bigint | exact id | `p_application_id` |
| `from_date` | date `Y-m-d` | `Application_Date >= from_date` | `p_from_date` |
| `to_date` | date `Y-m-d` | `Application_Date <= to_date`; require `from_date <= to_date` | `p_to_date` |

Example:

```http
GET /api/LoanApplicationList?page=1&per_page=20&keyword=SEED&stage=disbursed&cust_type_cd=2&scheme_id=1&branch_id=1&from_date=2026-01-01&to_date=2026-11-04
Authorization: Bearer {token}
Accept: application/json
```

---

## 2. Laravel controller checklist

```php
$rules = [
    'page'            => ['nullable', 'integer', 'min:1'],
    'per_page'        => ['nullable', 'integer', 'min:1', 'max:200'],
    'keyword'         => ['nullable', 'string', 'max:150'],
    'stage'           => ['nullable', 'string', 'in:field_verification,assessment,approval,sanctioned,disbursed,rejected,draft'],
    'scheme_id'       => ['nullable', 'integer', 'min:1'],
    'branch_id'       => ['nullable', 'integer', 'min:1'],
    'cust_type_cd'    => ['nullable', 'integer'],
    'appl_status_cd'  => ['nullable', 'integer'],
    'fo_id'           => ['nullable', 'integer', 'min:1'],
    'member_id'       => ['nullable', 'integer', 'min:1'],
    'group_id'        => ['nullable', 'integer', 'min:1'],
    'application_id'  => ['nullable', 'integer', 'min:1'],
    'from_date'       => ['nullable', 'date_format:Y-m-d'],
    'to_date'         => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
];
```

Pass every validated value into `USP_LOAN_APPLICATION_LIST` in the same order as the SP signature. Do **not** drop unused params — the UI now sends `stage`, `scheme_id`, `branch_id`, `cust_type_cd`, `from_date`, and `to_date` together.

Non–head-office users: ignore client `branch_id` and use the session branch (same rule as Dashboard / deposits).

Result sets from the SP (in order):

1. Pagination meta row → `meta.total`, `meta.page`, `meta.per_page`, `meta.last_page`
2. Page of application rows → `data` (snake_case JSON fields the portal already maps)
3. Summary aggregates → `meta.summary`

```json
{
  "success": true,
  "message": "Loan applications retrieved successfully",
  "data": [ /* rows */ ],
  "meta": {
    "total": 5,
    "page": 1,
    "per_page": 20,
    "last_page": 1,
    "has_more": false,
    "summary": {
      "total_count": 5,
      "field_verification_count": 0,
      "approval_count": 0,
      "sanctioned_count": 0,
      "disbursed_count": 5,
      "rejected_count": 0,
      "total_requested": 65000,
      "total_sanctioned": 65000
    }
  }
}
```

**Summary behaviour (keep as-is):** counts/amounts in `meta.summary` respect keyword / scheme / branch / cust type / dates / FO / member / group, but **not** `stage`. Stage only filters the paged row set. That lets KPI cards stay meaningful while the table is narrowed by stage.

---

## 3. Recommended SP keyword upgrades

UI placeholder searches “Account, application, borrower, scheme”. Current `p_keyword` matches:

- `Application_No`, `Beneficiary_Name`
- Individual: `Member_Name`, `Ref_Code`, `Mobile_No`
- Group: `Group_Name` + bulk member name/ref

**Missing vs UI copy — add inside the keyword OR block:**

```sql
OR IFNULL(s.Scheme_Code, '') LIKE CONCAT('%', p_keyword, '%')
OR IFNULL(s.Scheme_Name, '') LIKE CONCAT('%', p_keyword, '%')
OR EXISTS (
  SELECT 1 FROM mst_loan_account la2
  WHERE la2.Application_Id = a.Application_Id
    AND (
      IFNULL(la2.Ref_Account_No, '') LIKE CONCAT('%', p_keyword, '%')
      OR IFNULL(la2.Loan_Account_No, '') LIKE CONCAT('%', p_keyword, '%')
    )
)
```

Join `mst_loan_scheme s` in the filter `INSERT` if it is not already available there (list SELECT already joins it). Use the real loan account number column name from your schema.

Optional: also match `Application_Id` when `p_keyword` is numeric.

---

## 4. Stage values

Stage is computed by `FN_LOAN_APPL_STAGE(Application_Id)`. Filter with exact match:

| `stage` | Meaning |
| --- | --- |
| `field_verification` | Pending / in field verification |
| `assessment` | Credit assessment |
| `approval` | Pending committee / approval |
| `sanctioned` | Approved, not yet disbursed |
| `disbursed` | Loan account disbursed |
| `rejected` | Rejected |

Do not invent alternate codes on the API; the portal sends these snake_case values.

---

## 5. Quick verification

1. No filters → same totals as today; summary matches KPI cards.
2. `stage=disbursed` → table only disbursed; summary stage buckets still show full filtered population.
3. `cust_type_cd=2&scheme_id={id}&from_date=&to_date=` → AND semantics.
4. Branch user → cannot widen to another branch via `branch_id`.
5. After keyword SP change → searching a loan account no. / scheme code returns the row.
