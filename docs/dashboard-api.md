# Executive Dashboard — Backend API Guide

Source of truth: `priomicro_basundhara.sql` (tenant schema). Screen: `/dashboard` with a **from / to date** and an optional **branch** (head office only).

**Implementation order:** section 3 (SQL) → section 4 (Laravel) → section 5 (checks) → section 6 (tests).

The browser only calls the Next.js BFF. The BFF binds the branch to the session and calls Laravel with the user's Bearer token.

| BFF route (Next.js) | Laravel endpoint | Method | Stored procedure | Status |
| --- | --- | --- | --- | --- |
| `GET /api/dashboard?from_date=&to_date=&branch_id=` | `/api/DashboardGet` | GET | `USP_DASHBOARD_GET` | **new** |

Frontend: `src/features/dashboard/`. Endpoint constants: `endpoints.dashboard.get` and `endpoints.bff.dashboard` in `src/lib/api/endpoints.ts`.

Default period on the screen: first day of the current month through today. Non-head users always get their own branch, whatever `branch_id` says.

---

## 1. What the figures mean

Stock figures (GLP, NPA, groups, members, savings, cash, bank, live loans) are **as at `to_date`**. Flow figures (disbursed, collections, demand, wallets, pending applications) are **inside `from_date` … `to_date`**.

| Card / table | Source | Rule |
| --- | --- | --- |
| Gross loan portfolio | `mst_loan_account.Principal_Outstanding` | Active loans (`Ln_Status_Cd = 1`) in scope |
| Disbursed in period | `mst_loan_account_disbursement.Gross_Amount` | `Disbursement_Date` in range, loan in scope |
| PAR 90 | outstanding of loans whose oldest unpaid installment is ≥ 90 days overdue as at `to_date` | Unpaid = `trans_loanac_schedule.Collection_Id IS NULL` and `Is_Active = 1` and `Due_Date <= to_date` |
| NPA | outstanding where `Is_NPA = 1` | Active loans |
| Active groups | `mst_group` | `Current_Status_Cd = 1` (or `Appl_Status_Cd = 1` if current is null) |
| Active members | `mst_member` | `Current_Status_Cd = 1` (or `Appl_Status_Cd = 1` if current is null) |
| Savings book | `mst_deposit_account_sb.Current_Balance` | Latest SB row, open savings accounts (`Deposit_Type_Cd = 1`, `Closing_Date IS NULL`) |
| Pending applications | `mst_loan_application` | `Appl_Status_Cd IN (1, 4)` (submitted / resubmission) and `Application_Date` in range |
| Collection | `trans_loan_collection.Total_Collected` | `DATE(Collection_Date)` in range, `Tr_Status_Cd IN (1, 2)` |
| Cash in hand | voucher lines on cash ledgers | Approved vouchers (`Vou_Status_Cd = 2`), `Voucher_Date <= to_date`. Cash ledger: `Ledger_Code = 'SYS-CASH'` or name like `%Cash in Hand%` |
| Bank balances | same, other ledgers under head `SYS-CASH-BANK` | Asset: debit − credit; if your bank ledgers are liabilities, swap the sign |
| Field officer demand | sum of `Total_Due` on unpaid schedule rows due in the range, grouped by `mst_loan_application.FO_Id` | |
| Field officer collected | collections in the range for that FO | |
| Open wallet | collections in the range with `Voucher_Id IS NULL` | Not yet handed into the branch voucher |
| Branch loan book / collection / vault | same as GLP / collection / cash, grouped by branch | |
| Recovery % | collection in range ÷ demand in range × 100 | `NULL` when demand is 0 |
| Live loans | up to 50 active accounts, highest outstanding first | DPD = days from oldest unpaid due date to `to_date` |

**Branch isolation:** every loan, group, member, deposit, collection and voucher is limited to `p_branch_id` when it is not NULL. Non-head users must receive their session branch (section 4). Join loans to `mst_loan_application` for `Branch_Id`.

---

## 2. Request and response

`GET /api/DashboardGet`

| Param | Type | Rule |
| --- | --- | --- |
| `from_date` | date `Y-m-d` | required, `before_or_equal:to_date` |
| `to_date` | date `Y-m-d` | required, `before_or_equal:today` |
| `branch_id` | int | optional for head office; ignored (forced) for other users |

Envelope:

```json
{
  "success": true,
  "message": "Dashboard loaded",
  "data": {
    "from_date": "2026-11-01",
    "to_date": "2026-11-03",
    "branch_id": 1,
    "kpis": {
      "glp": 33814.66,
      "disbursed": 15400.00,
      "par90_amount": 0.00,
      "par90_percent": 0.00,
      "npa_amount": 0.00,
      "npa_percent": 0.00,
      "active_groups": 1,
      "active_members": 4,
      "savings_balance": 500.00,
      "pending_applications": 2,
      "collection": 8400.00
    },
    "funds": { "cash": 28450.00, "bank": 49902.63, "total": 78352.63 },
    "agents": [
      {
        "staff_id": 2,
        "staff_name": "Anita Desai",
        "group_count": 2,
        "target": 12000.00,
        "collected": 11450.00,
        "wallet": 3200.00,
        "in_field": 1
      }
    ],
    "branches": [
      {
        "branch_id": 1,
        "branch_name": "Head Office",
        "loan_book": 28000.00,
        "collection": 8400.00,
        "vault": 12200.00,
        "recovery_percent": 99.2
      }
    ],
    "loans": [
      {
        "loan_account_id": 12,
        "loan_account_no": "LN-00012",
        "borrower": "Rina Das",
        "group_name": "Kendra 01",
        "disbursed": 15000.00,
        "principal_paid": 1200.00,
        "outstanding": 13800.00,
        "dpd": 0,
        "status_cd": 1,
        "status_desc": "Active"
      }
    ]
  }
}
```

Keep messages short; the screen shows them in a toast/error card. Auth: `auth:sanctum` (or the existing guard). Tenant schema from the token, never from the request.

---

## 3. SQL — `USP_DASHBOARD_GET`

Procedure name must match `USP_[A-Z_]+` (the `StoredProcedure` helper). Result sets: **0** status, **1** kpis (one row), **2** funds (one row), **3** agents, **4** branches, **5** loans.

```sql
DROP PROCEDURE IF EXISTS USP_DASHBOARD_GET;
DELIMITER ;;
CREATE PROCEDURE USP_DASHBOARD_GET(
    IN p_from DATE,
    IN p_to DATE,
    IN p_branch_id INT          -- NULL = all branches (head office only)
)
proc: BEGIN
    IF p_from IS NULL OR p_to IS NULL OR p_from > p_to OR p_to > CURDATE() THEN
        SELECT 'ERROR' AS status, 'Check the date range' AS message;
        LEAVE proc;
    END IF;

    -- scope: loans in branch
    DROP TEMPORARY TABLE IF EXISTS tmp_dash_loan;
    CREATE TEMPORARY TABLE tmp_dash_loan (
        loan_account_id BIGINT PRIMARY KEY,
        branch_id SMALLINT NOT NULL,
        fo_id SMALLINT NULL,
        outstanding DECIMAL(14, 2) NOT NULL DEFAULT 0,
        disbursed DECIMAL(14, 2) NOT NULL DEFAULT 0,
        is_npa TINYINT NOT NULL DEFAULT 0,
        dpd INT NOT NULL DEFAULT 0
    );

    INSERT INTO tmp_dash_loan (loan_account_id, branch_id, fo_id, outstanding, disbursed, is_npa)
    SELECT la.Loan_Account_Id, a.Branch_Id, a.FO_Id,
           IFNULL(la.Principal_Outstanding, 0), IFNULL(la.Disbursed_Amount, 0),
           IFNULL(la.Is_NPA, 0)
    FROM mst_loan_account la
    JOIN mst_loan_application a ON a.Application_Id = la.Application_Id
    WHERE la.Ln_Status_Cd = 1
      AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id);

    UPDATE tmp_dash_loan t
    SET t.dpd = IFNULL((
        SELECT GREATEST(DATEDIFF(p_to, MIN(s.Due_Date)), 0)
        FROM trans_loanac_schedule s
        WHERE s.Loan_Account_Id = t.loan_account_id
          AND s.Is_Active = 1
          AND s.Collection_Id IS NULL
          AND s.Due_Date <= p_to
    ), 0);

    SELECT 'SUCCESS' AS status, 'Dashboard loaded' AS message;

    -- 1. kpis
    SELECT
        IFNULL((SELECT SUM(outstanding) FROM tmp_dash_loan), 0) AS glp,
        IFNULL((
            SELECT SUM(d.Gross_Amount)
            FROM mst_loan_account_disbursement d
            JOIN tmp_dash_loan t ON t.loan_account_id = d.Loan_Account_Id
            WHERE d.Disbursement_Date BETWEEN p_from AND p_to
        ), 0) AS disbursed,
        IFNULL((SELECT SUM(outstanding) FROM tmp_dash_loan WHERE dpd >= 90), 0) AS par90_amount,
        ROUND(IFNULL((SELECT SUM(outstanding) FROM tmp_dash_loan WHERE dpd >= 90), 0)
            / NULLIF((SELECT SUM(outstanding) FROM tmp_dash_loan), 0) * 100, 2) AS par90_percent,
        IFNULL((SELECT SUM(outstanding) FROM tmp_dash_loan WHERE is_npa = 1), 0) AS npa_amount,
        ROUND(IFNULL((SELECT SUM(outstanding) FROM tmp_dash_loan WHERE is_npa = 1), 0)
            / NULLIF((SELECT SUM(outstanding) FROM tmp_dash_loan), 0) * 100, 2) AS npa_percent,
        (
            SELECT COUNT(*) FROM mst_group g
            WHERE IFNULL(g.Current_Status_Cd, g.Appl_Status_Cd) = 1
              AND (p_branch_id IS NULL OR g.Branch_Id = p_branch_id)
        ) AS active_groups,
        (
            SELECT COUNT(*) FROM mst_member m
            WHERE IFNULL(m.Current_Status_Cd, m.Appl_Status_Cd) = 1
              AND (p_branch_id IS NULL OR m.Branch_Id = p_branch_id)
        ) AS active_members,
        IFNULL((
            SELECT SUM(sb.Current_Balance)
            FROM mst_deposit_account da
            JOIN mst_deposit_account_sb sb
              ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = da.Account_Id)
            WHERE da.Deposit_Type_Cd = 1 AND da.Closing_Date IS NULL
              AND (p_branch_id IS NULL OR da.Branch_Id = p_branch_id)
        ), 0) AS savings_balance,
        (
            SELECT COUNT(*) FROM mst_loan_application a
            WHERE a.Appl_Status_Cd IN (1, 4)
              AND a.Application_Date BETWEEN p_from AND p_to
              AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id)
        ) AS pending_applications,
        IFNULL((
            SELECT SUM(c.Total_Collected)
            FROM trans_loan_collection c
            WHERE c.Tr_Status_Cd IN (1, 2)
              AND DATE(c.Collection_Date) BETWEEN p_from AND p_to
              AND (p_branch_id IS NULL OR c.Branch_Id = p_branch_id)
        ), 0) AS collection;

    -- 2. funds (approved vouchers up to to_date)
    SELECT
        IFNULL(SUM(IF(l.Ledger_Code = 'SYS-CASH' OR l.Ledger_Name LIKE '%Cash in Hand%',
                      vd.Debit_Amount - vd.Credit_Amount, 0)), 0) AS cash,
        IFNULL(SUM(IF(h.MainHd_Code = 'SYS-CASH-BANK'
                      AND NOT (l.Ledger_Code = 'SYS-CASH' OR l.Ledger_Name LIKE '%Cash in Hand%'),
                      vd.Debit_Amount - vd.Credit_Amount, 0)), 0) AS bank,
        IFNULL(SUM(IF(h.MainHd_Code = 'SYS-CASH-BANK' OR l.Ledger_Code = 'SYS-CASH',
                      vd.Debit_Amount - vd.Credit_Amount, 0)), 0) AS total
    FROM trans_voucher_details vd
    JOIN trans_vouchers v ON v.Voucher_Id = vd.Voucher_Id AND v.Vou_Status_Cd = 2 AND v.Voucher_Date <= p_to
    JOIN mst_acct_ledger l ON l.Ledger_Id = vd.GL_Account_Id
    LEFT JOIN mst_acct_head h ON h.MainHd_Id = l.MainHd_Id
    WHERE p_branch_id IS NULL OR v.Branch_Id = p_branch_id;

    -- 3. agents
    SELECT
        s.Staff_Id AS staff_id,
        s.Full_Name AS staff_name,
        (
            SELECT COUNT(*) FROM mst_group g
            WHERE g.FO_Id = s.Staff_Id AND IFNULL(g.Current_Status_Cd, g.Appl_Status_Cd) = 1
              AND (p_branch_id IS NULL OR g.Branch_Id = p_branch_id)
        ) AS group_count,
        IFNULL((
            SELECT SUM(sch.Total_Due)
            FROM trans_loanac_schedule sch
            JOIN tmp_dash_loan t ON t.loan_account_id = sch.Loan_Account_Id
            WHERE t.fo_id = s.Staff_Id AND sch.Is_Active = 1
              AND sch.Due_Date BETWEEN p_from AND p_to
        ), 0) AS target,
        IFNULL((
            SELECT SUM(c.Total_Collected)
            FROM trans_loan_collection c
            WHERE c.FO_Id = s.Staff_Id AND c.Tr_Status_Cd IN (1, 2)
              AND DATE(c.Collection_Date) BETWEEN p_from AND p_to
              AND (p_branch_id IS NULL OR c.Branch_Id = p_branch_id)
        ), 0) AS collected,
        IFNULL((
            SELECT SUM(c.Total_Collected)
            FROM trans_loan_collection c
            WHERE c.FO_Id = s.Staff_Id AND c.Tr_Status_Cd IN (1, 2) AND c.Voucher_Id IS NULL
              AND DATE(c.Collection_Date) BETWEEN p_from AND p_to
              AND (p_branch_id IS NULL OR c.Branch_Id = p_branch_id)
        ), 0) AS wallet,
        IF(
            IFNULL((
                SELECT SUM(c.Total_Collected)
                FROM trans_loan_collection c
                WHERE c.FO_Id = s.Staff_Id AND c.Tr_Status_Cd IN (1, 2) AND c.Voucher_Id IS NULL
                  AND DATE(c.Collection_Date) BETWEEN p_from AND p_to
                  AND (p_branch_id IS NULL OR c.Branch_Id = p_branch_id)
            ), 0) > 0, 1, 0
        ) AS in_field
    FROM mst_staff s
    WHERE s.Status = 1
      AND (p_branch_id IS NULL OR s.Branch_Id = p_branch_id)
      AND (
          EXISTS (SELECT 1 FROM mst_group g WHERE g.FO_Id = s.Staff_Id)
          OR EXISTS (SELECT 1 FROM trans_loan_collection c WHERE c.FO_Id = s.Staff_Id AND DATE(c.Collection_Date) BETWEEN p_from AND p_to)
      )
    ORDER BY s.Full_Name;

    -- 4. branches
    SELECT
        b.Branch_Id AS branch_id,
        b.Branch_Name AS branch_name,
        IFNULL((SELECT SUM(t.outstanding) FROM tmp_dash_loan t WHERE t.branch_id = b.Branch_Id), 0) AS loan_book,
        IFNULL((
            SELECT SUM(c.Total_Collected)
            FROM trans_loan_collection c
            WHERE c.Branch_Id = b.Branch_Id AND c.Tr_Status_Cd IN (1, 2)
              AND DATE(c.Collection_Date) BETWEEN p_from AND p_to
        ), 0) AS collection,
        IFNULL((
            SELECT SUM(vd.Debit_Amount - vd.Credit_Amount)
            FROM trans_voucher_details vd
            JOIN trans_vouchers v ON v.Voucher_Id = vd.Voucher_Id AND v.Vou_Status_Cd = 2 AND v.Voucher_Date <= p_to
            JOIN mst_acct_ledger l ON l.Ledger_Id = vd.GL_Account_Id
            WHERE v.Branch_Id = b.Branch_Id
              AND (l.Ledger_Code = 'SYS-CASH' OR l.Ledger_Name LIKE '%Cash in Hand%')
        ), 0) AS vault,
        ROUND(
            IFNULL((
                SELECT SUM(c.Total_Collected)
                FROM trans_loan_collection c
                WHERE c.Branch_Id = b.Branch_Id AND c.Tr_Status_Cd IN (1, 2)
                  AND DATE(c.Collection_Date) BETWEEN p_from AND p_to
            ), 0)
            / NULLIF((
                SELECT SUM(sch.Total_Due)
                FROM trans_loanac_schedule sch
                JOIN tmp_dash_loan t ON t.loan_account_id = sch.Loan_Account_Id
                WHERE t.branch_id = b.Branch_Id AND sch.Is_Active = 1
                  AND sch.Due_Date BETWEEN p_from AND p_to
            ), 0) * 100
        , 2) AS recovery_percent
    FROM priomicro_core.mst_org_branch b
    WHERE p_branch_id IS NULL OR b.Branch_Id = p_branch_id
    ORDER BY b.Branch_Name;

    -- 5. loans (cap 50)
    SELECT
        la.Loan_Account_Id AS loan_account_id,
        COALESCE(NULLIF(la.Ref_Account_No, ''), CAST(la.Loan_Account_No AS CHAR)) AS loan_account_no,
        COALESCE(NULLIF(a.Beneficiary_Name, ''), m.Member_Name, g.Group_Name) AS borrower,
        g.Group_Name AS group_name,
        t.disbursed,
        GREATEST(t.disbursed - t.outstanding, 0) AS principal_paid,
        t.outstanding,
        t.dpd,
        la.Ln_Status_Cd AS status_cd,
        st.Opt_Description AS status_desc
    FROM tmp_dash_loan t
    JOIN mst_loan_account la ON la.Loan_Account_Id = t.loan_account_id
    JOIN mst_loan_application a ON a.Application_Id = la.Application_Id
    LEFT JOIN mst_member m ON a.Cust_Type_Cd = 2 AND m.Member_Id = a.Cust_Id_Primay
    LEFT JOIN mst_group g ON a.Cust_Type_Cd = 1 AND g.Group_Id = a.Cust_Id_Primay
    LEFT JOIN mst_appl_options st ON st.Opt_Grp_Id = 40 AND st.Opt_Code = la.Ln_Status_Cd
    ORDER BY t.outstanding DESC, la.Loan_Account_Id
    LIMIT 50;

    DROP TEMPORARY TABLE IF EXISTS tmp_dash_loan;
END ;;
DELIMITER ;
```

> Member name is `mst_member.Member_Name`. Active members/groups use `Current_Status_Cd` (fallback `Appl_Status_Cd`). `priomicro_core.mst_org_branch` is the same join as the FD settlement guide. If `LoanAccountList` uses a different account-number expression, match that for `loan_account_no`.

MySQL cannot read a TEMPORARY table twice in one statement. The KPI SELECT above uses several subqueries against `tmp_dash_loan`. If that errors, split GLP / PAR / NPA into scalar variables first (`SELECT SUM(...) INTO v_glp FROM tmp_dash_loan`) and then `SELECT v_glp AS glp, …`.

---

## 4. Laravel 12

Reuse `App\Support\StoredProcedure` and `App\Exceptions\ProcedureException` from `docs/fd-settlement-api.md`.

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\StoredProcedure as Sp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private function branch(Request $request): ?int
    {
        $user = $request->user();
        if ($user->is_head) {
            return $request->filled('branch_id') ? (int) $request->input('branch_id') : null;
        }

        return (int) $user->branch_id;
    }

    public function show(Request $request): JsonResponse
    {
        $input = $request->validate([
            'from_date' => ['required', 'date_format:Y-m-d'],
            'to_date'   => ['required', 'date_format:Y-m-d', 'after_or_equal:from_date', 'before_or_equal:today'],
            'branch_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $sets = Sp::call('USP_DASHBOARD_GET', [
            $input['from_date'],
            $input['to_date'],
            $this->branch($request),
        ]);
        Sp::expectSuccess($sets[0] ?? []);

        $kpis = $sets[1][0] ?? [];
        $funds = $sets[2][0] ?? ['cash' => 0, 'bank' => 0, 'total' => 0];

        return response()->json([
            'success' => true,
            'message' => 'Dashboard loaded',
            'data' => [
                'from_date'  => $input['from_date'],
                'to_date'    => $input['to_date'],
                'branch_id'  => $this->branch($request),
                'kpis'       => $kpis,
                'funds'      => $funds,
                'agents'     => $sets[3] ?? [],
                'branches'   => $sets[4] ?? [],
                'loans'      => $sets[5] ?? [],
            ],
        ]);
    }
}
```

```php
use App\Http\Controllers\Api\DashboardController;

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::get('DashboardGet', [DashboardController::class, 'show'])->middleware('throttle:60,1');
});
```

Cast numeric fields to floats/ints in PHP if PDO returns strings. The BFF mapper accepts both.

---

## 5. Quick check

```bash
curl -s "$API/api/DashboardGet?from_date=2026-11-01&to_date=2026-11-03" \
  -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"
```

A branch user sending another `branch_id` must still only see their branch (or HTTP 403).

---

## 6. Test checklist

- [ ] Opening `/dashboard` after login; `/` redirects here.
- [ ] Default range is month-start → today; Apply / Reset reloads once (no duplicate calls in Strict Mode).
- [ ] Head-office user can pick a branch or all branches; other users have no branch control and cannot forge `branch_id`.
- [ ] GLP equals the sum of active `Principal_Outstanding` in scope.
- [ ] Disbursed and collection change when the date range changes; GLP does not jump just because `from_date` moved.
- [ ] PAR 90 uses unpaid schedule due dates, not only `Is_NPA`.
- [ ] Cash + bank = total liquid funds; cash matches the SYS-CASH ledger.
- [ ] Officer wallet drops to 0 after those collections are vouchered.
- [ ] Loan table is empty when the branch has no active loans; search filters locally.
- [ ] Workflow tiles open member registration, LOS applications, LMS disbursement, and collections.
