# Savings Charges — Backend API Guide

Source of truth: `priomicro_basundhara.sql` (tenant schema). Screen: `/deposits/charges` with two tabs, **Single** (all scheme charges for one savings account) and **Bulk** (one charge across many savings accounts).

**Implementation order for the backend:** section 3 (tables) → section 6 (SQL) → section 7 (Laravel) → section 8 (checks) → section 10 (tests).

The browser only calls the Next.js BFF. The BFF validates the input, binds the branch to the session, and calls these Laravel endpoints with the user's Bearer token.

| BFF route (Next.js) | Laravel endpoint | Method | Stored procedure | Status |
| --- | --- | --- | --- | --- |
| `GET /api/deposits/charges?mode=single&account_id=&charge_date=` | `/api/SavingsChargeCalculate` | GET | `USP_SAVINGS_CHARGE_CALC` | **new** |
| `GET /api/deposits/charges?mode=bulk&charge_id=&scheme_id=&branch_id=&keyword=&charge_date=` | `/api/SavingsChargeCalculate` | GET | `USP_SAVINGS_CHARGE_CALC` | **new** |
| `POST /api/deposits/charges` | `/api/SavingsChargePost` | POST (JSON) | `USP_SAVINGS_CHARGE_POST` | **new** |
| Single tab account search | existing `/api/SavingsCustomerList` | GET | existing | existing |
| Bulk tab charge list | existing deposit charges list (`/api/master/deposit-charges`) | GET | existing | existing |
| Bulk tab scheme list | existing deposit product schemes (`deposit_type_cd=1`) | GET | existing | existing |

Frontend files: `src/features/deposits/charge-posting/` (types, schemas, mapper, rules, services, components). Endpoint constants: `endpoints.savingsCharges` and `endpoints.bff.savingsCharges` in `src/lib/api/endpoints.ts`.

Both procedures share one calculation routine, `USP_SAVINGS_CHARGE_PREPARE`, so the amount shown on screen and the amount re-checked at posting time come from the same SQL.

---

## 1. Workflow

1. The user picks the **Charge date** (today or earlier).
2. **Single:** the user picks one savings account. Calculate returns **every active charge attached to that account's scheme** (`mst_deposit_scheme_charges`), one row per charge.
   **Bulk:** the user picks **one charge** (required), plus scheme / branch / keyword filters, and clicks *Load accounts*. Calculate returns every open savings account whose scheme carries that charge, up to 500.
3. Each row shows the calculated charge, tax and total, when it was last deducted, and whether it was **already deducted in the current period** (by the charge's *Charges During* setting).
4. Rows with an amount and not yet charged this period are ticked by default. Accounts without enough available balance are not ticked.
5. The user can change any amount. A changed amount, or a repeat charge in the same period, requires **Remarks**.
6. *Deduct charges* → confirm → POST. `USP_SAVINGS_CHARGE_POST` locks the accounts, **recalculates**, checks balance and duplicates, debits each account and writes the charge history.
7. Laravel posts the vouchers for the new transactions (section 7.3).

---

## 2. Code values used

| Code | Source | Values |
| --- | --- | --- |
| `Deposit_Type_Cd` | group 3 | 1 Savings. Only savings accounts are charged here. |
| `Trans_Type_Cd` | group 36 | **4 Charges** |
| `Figure_Cd` (charge) | group 16 | 1 Fixed, 2 Percentage (%) |
| `Charges_During_Cd` (charge) | group 15 | 1 Each Transaction, 2 Day End, 3 Month End, 4 Quarter End, 5 Half Year End, 6 Year End, 7 Specified Date |
| `Tr_Status_Cd` (savings transaction) | — | 1 = posted |

---

## 3. Tables

### 3.1 Existing tables used

| Table | Used for |
| --- | --- |
| `mst_deposit_charges` | `Charge_Name`, `Charge_Rate`, `Figure_Cd`, `Max_Amount`, `Tax_Prcent`, `Charges_During_Cd`, `Charges_Gl`, `Is_Active` |
| `mst_deposit_scheme_charges` | Which charges apply to which scheme (`Scheme_Id`, `Charges_Id`, `Is_Active`) |
| `mst_deposit_account` | Eligibility, branch, holder, scheme |
| `mst_deposit_account_sb` (latest row by `MAX(Id)`) | `Current_Balance`, `Available_Balance`, account number |
| `mst_deposit_scheme` | `Prn_Ledger` (savings deposit ledger for the voucher) |
| `trans_savings_transaction` | The new charge debit rows |
| `USP_CODE_SERIES_GENERATE` | `savings_charge` (batch no.) and `savings_transaction` (transaction no.) |

Add a `savings_charge` row in the Code Series master (for example prefix `SC/`) before going live.

### 3.2 New table `trans_savings_charge_batch`

```sql
CREATE TABLE `trans_savings_charge_batch` (
  `Batch_Id` int NOT NULL AUTO_INCREMENT,
  `Batch_No` varchar(30) NOT NULL,
  `Posting_Mode` tinyint NOT NULL COMMENT '1 single, 2 bulk',
  `Charge_Date` date NOT NULL,
  `Branch_Id` smallint DEFAULT NULL,
  `Row_Count` int NOT NULL DEFAULT '0',
  `Charge_Total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `Tax_Total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `Remarks` varchar(250) DEFAULT NULL,
  `Created_By` smallint NOT NULL,
  `Created_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Batch_Id`),
  UNIQUE KEY `uq_scb_batch_no` (`Batch_No`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
```

### 3.3 New table `trans_savings_charge`

One row per account per charge deducted. This is the **charge history** used for "last charged" and the per-period duplicate check, and it carries the charge/tax split for the voucher.

```sql
CREATE TABLE `trans_savings_charge` (
  `Account_Charge_Id` bigint NOT NULL AUTO_INCREMENT,
  `Batch_Id` int NOT NULL,
  `Account_Id` int NOT NULL,
  `Charge_Id` smallint unsigned NOT NULL,
  `Charge_Date` date NOT NULL,
  `Calculated_Amount` decimal(14,2) NOT NULL,
  `Charge_Amount` decimal(14,2) NOT NULL,
  `Tax_Percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `Tax_Amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `Total_Amount` decimal(14,2) NOT NULL,
  `Sav_Trans_Id` int NOT NULL,
  `Is_Reversed` tinyint(1) NOT NULL DEFAULT '0',
  `Created_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Account_Charge_Id`),
  KEY `idx_sc_account_charge` (`Account_Id`, `Charge_Id`, `Charge_Date`),
  KEY `idx_sc_batch` (`Batch_Id`),
  KEY `idx_sc_trans` (`Sav_Trans_Id`),
  CONSTRAINT `fk_sc_batch` FOREIGN KEY (`Batch_Id`) REFERENCES `trans_savings_charge_batch` (`Batch_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
```

> When a charge transaction is reversed (savings reversal, `Trans_Type_Cd = 5`), set `Is_Reversed = 1` on its row here so the account can be charged again for that period.

---

## 4. Calculation rules

| `Figure_Cd` | Charge amount |
| --- | --- |
| 2 Percentage | `ROUND(GREATEST(Current_Balance, 0) × Charge_Rate ÷ 100, 2)`, capped at `Max_Amount` when `Max_Amount > 0` |
| 1 Fixed, or not set | `COALESCE(Charge_Rate, Max_Amount, 0)` |

- **Tax:** `ROUND(charge × Tax_Prcent ÷ 100, 2)`. **Total** = charge + tax. The account is debited the total in **one** savings transaction; the split is kept in `trans_savings_charge`.
- A charge with no amount set up calculates as 0. The screen shows "No amount set up — enter it" and the user types the amount (remarks then required).
- **Period (for "already charged this period")**, from `Charges_During_Cd`, using the Indian financial year (April–March):

| `Charges_During_Cd` | Same period means |
| --- | --- |
| 2 Day End | same date |
| 3 Month End | same calendar month |
| 4 Quarter End | same quarter (Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar) |
| 5 Half Year End | same half of the financial year (Apr–Sep, Oct–Mar) |
| 6 Year End | same financial year |
| 1 Each Transaction, 7 Specified Date, NULL | no period check |

- **Balance:** the total for all selected charges on an account must not exceed `Available_Balance`.
- **Eligible accounts:** `Deposit_Type_Cd = 1`, `Closing_Date IS NULL`. Account status is not filtered (an *Inoperative Charges* charge must reach inoperative accounts). If your rules block debits on *Freezed* (status 4) accounts, add `AND IFNULL(a.Appl_Status_Cd, 1) <> 4` in `USP_SAVINGS_CHARGE_CALC` and in the eligibility check of `USP_SAVINGS_CHARGE_POST`.
- **Eligible charges:** `mst_deposit_scheme_charges.Is_Active = 1` and `mst_deposit_charges.Is_Active = 1` for the account's scheme.

---

## 5. API contract

Common rules are the same as `docs/savings-interest-api.md` section 5: tenant from the token, **non-head users forced to their own branch**, `p_user_id` from the logged-in user, `ERROR` → HTTP 422 with a short message (shown in a toast), menu-permission middleware for `/deposits/charges`, `throttle:30,1` on Post, one `trans_audit_log` row (module `SavingsCharges`) per batch.

### 5.1 GET `/api/SavingsChargeCalculate`

| Param | Type | Rule |
| --- | --- | --- |
| `charge_date` | date `Y-m-d` | required, `before_or_equal:today` |
| `account_id` | int | Single: required. 422 if not an open savings account in scope. |
| `charge_id` | int | Bulk: required |
| `scheme_id` | int | Bulk: optional |
| `keyword` | string | Bulk: optional, max 60 (account no., ref account no., holder, member code / ref code) |
| `branch_id` | int | Ignored for non-head users |
| `page`, `per_page` | int | default 1 / 500, `per_page` max 500 |

Row shape (`data[]`), one per account × charge:

```json
{
  "account_id": 19,
  "full_account_no": "HO0001/DS-0004/00001",
  "appl_no": "DA-2026-00004",
  "holder_name": "NEW",
  "scheme_id": 2,
  "scheme_code": "DS-0004",
  "scheme_name": "test 2",
  "branch_name": "Head Office",
  "current_balance": 500.00,
  "available_balance": 500.00,
  "charge_id": 4,
  "charge_name": "SMS Alert Charge",
  "figure_cd": 1,
  "charge_rate": 15.00,
  "max_amount": null,
  "tax_percent": 18.00,
  "charges_during_desc": "Quater End",
  "last_charged_date": "2026-09-30",
  "charged_this_period": 0,
  "calculated_amount": 15.00
}
```

`meta`: `{ "total": 812, "page": 1, "per_page": 500, "last_page": 2 }`.

### 5.2 POST `/api/SavingsChargePost`

```json
{
  "mode": "bulk",
  "charge_date": "2026-11-03",
  "remarks": "Q3 SMS charges",
  "branch_id": 1,
  "rows": [
    { "account_id": 19, "charge_id": 4, "calculated_amount": 15.00, "charge_amount": 15.00 },
    { "account_id": 11, "charge_id": 4, "calculated_amount": 15.00, "charge_amount": 10.00 }
  ]
}
```

| Rule | Error |
| --- | --- |
| `charge_date` after today | 422 `Charge date can't be in the future` |
| 1–500 rows, no duplicate account + charge | 422 |
| Single: all rows for one account. Bulk: all rows for one charge. | 422 |
| `charge_amount` must be > 0 | 422 |
| Account not an open savings account, outside the user's branch, or charge not attached (active) to the account's scheme | 422 `One or more charges don't apply to these accounts` |
| `calculated_amount` differs from a fresh recalculation | 422 `Charges have changed for {n} row(s). Load again.` |
| Changed amount, or already charged this period, without `remarks` | 422 `Add a reason for the changed amount or repeat charge` |
| Account total (charge + tax) > `Available_Balance` | 422 `Not enough balance in {n} account(s)` |

Success `data`:

```json
{ "batch_id": 7, "batch_no": "SC/2026/0007", "posted_count": 2, "total_charge": 25.00, "total_tax": 4.50, "voucher_pending": 0 }
```

---

## 6. SQL

### 6.1 Period key function

```sql
DROP FUNCTION IF EXISTS UFN_CHARGE_PERIOD_KEY;
DELIMITER ;;
CREATE FUNCTION UFN_CHARGE_PERIOD_KEY(p_during TINYINT, p_date DATE)
RETURNS VARCHAR(12)
DETERMINISTIC NO SQL
BEGIN
    DECLARE v_fy INT DEFAULT IF(MONTH(p_date) >= 4, YEAR(p_date), YEAR(p_date) - 1);
    RETURN CASE p_during
        WHEN 2 THEN DATE_FORMAT(p_date, '%Y%m%d')
        WHEN 3 THEN DATE_FORMAT(p_date, '%Y%m')
        WHEN 4 THEN CONCAT(YEAR(p_date), 'Q', QUARTER(p_date))
        WHEN 5 THEN CONCAT(v_fy, 'H', IF(MONTH(p_date) BETWEEN 4 AND 9, 1, 2))
        WHEN 6 THEN CONCAT('FY', v_fy)
        ELSE NULL
    END;
END ;;
DELIMITER ;
```

### 6.2 `USP_SAVINGS_CHARGE_PREPARE` (shared calculation)

Expects a temporary table `tmp_sc` with `account_id` and `charge_id` filled in. Fills in the amounts and the period flags. Every statement reads `tmp_sc` only once (MySQL temporary-table limit).

```sql
-- definition used by both procedures below
CREATE TEMPORARY TABLE tmp_sc (
    account_id INT NOT NULL,
    charge_id INT NOT NULL,
    during_cd TINYINT NULL,
    current_balance DECIMAL(14, 2) NULL,
    available_balance DECIMAL(14, 2) NULL,
    tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    calculated_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    last_charged DATE NULL,
    charged_this_period TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (account_id, charge_id)
);
```

```sql
DROP PROCEDURE IF EXISTS USP_SAVINGS_CHARGE_PREPARE;
DELIMITER ;;
CREATE PROCEDURE USP_SAVINGS_CHARGE_PREPARE(IN p_charge_date DATE)
BEGIN
    UPDATE tmp_sc t
    JOIN mst_deposit_charges c ON c.Charge_Id = t.charge_id
    JOIN mst_deposit_account_sb sb
      ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = t.account_id)
    SET t.during_cd         = c.Charges_During_Cd,
        t.current_balance   = IFNULL(sb.Current_Balance, 0),
        t.available_balance = IFNULL(sb.Available_Balance, IFNULL(sb.Current_Balance, 0)),
        t.tax_percent       = IFNULL(c.Tax_Prcent, 0),
        t.calculated_amount = CASE
            WHEN c.Figure_Cd = 2 THEN
                IF(IFNULL(c.Max_Amount, 0) > 0,
                   LEAST(ROUND(GREATEST(IFNULL(sb.Current_Balance, 0), 0) * IFNULL(c.Charge_Rate, 0) / 100, 2), c.Max_Amount),
                   ROUND(GREATEST(IFNULL(sb.Current_Balance, 0), 0) * IFNULL(c.Charge_Rate, 0) / 100, 2))
            ELSE COALESCE(c.Charge_Rate, c.Max_Amount, 0)
        END,
        t.last_charged = (SELECT MAX(h.Charge_Date) FROM trans_savings_charge h
                           WHERE h.Account_Id = t.account_id AND h.Charge_Id = t.charge_id AND h.Is_Reversed = 0),
        t.charged_this_period = IF(c.Charges_During_Cd BETWEEN 2 AND 6 AND EXISTS (
            SELECT 1 FROM trans_savings_charge h
            WHERE h.Account_Id = t.account_id AND h.Charge_Id = t.charge_id AND h.Is_Reversed = 0
              AND UFN_CHARGE_PERIOD_KEY(c.Charges_During_Cd, h.Charge_Date)
                = UFN_CHARGE_PERIOD_KEY(c.Charges_During_Cd, p_charge_date)
        ), 1, 0);
END ;;
DELIMITER ;
```

### 6.3 `USP_SAVINGS_CHARGE_CALC`

Result sets: **0** status, **1** total, **2** rows.

```sql
DROP PROCEDURE IF EXISTS USP_SAVINGS_CHARGE_CALC;
DELIMITER ;;
CREATE PROCEDURE USP_SAVINGS_CHARGE_CALC(
    IN p_charge_date DATE,
    IN p_account_id INT,
    IN p_charge_id INT,
    IN p_scheme_id INT,
    IN p_branch_id INT,        -- forced to the user's branch for non-head users
    IN p_keyword VARCHAR(60),
    IN p_page INT,
    IN p_per_page INT
)
proc: BEGIN
    DECLARE v_kw VARCHAR(70) DEFAULT NULL;
    DECLARE v_per_page INT DEFAULT LEAST(GREATEST(IFNULL(p_per_page, 500), 1), 500);
    DECLARE v_offset INT DEFAULT (GREATEST(IFNULL(p_page, 1), 1) - 1) * LEAST(GREATEST(IFNULL(p_per_page, 500), 1), 500);

    IF p_charge_date IS NULL OR p_charge_date > CURDATE() THEN
        SELECT 'ERROR' AS status, 'Charge date can''t be in the future' AS message;
        LEAVE proc;
    END IF;
    IF p_account_id IS NULL AND p_charge_id IS NULL THEN
        SELECT 'ERROR' AS status, 'Select an account or a charge' AS message;
        LEAVE proc;
    END IF;
    IF NULLIF(TRIM(p_keyword), '') IS NOT NULL THEN
        SET v_kw = CONCAT('%', TRIM(p_keyword), '%');
    END IF;

    IF p_account_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM mst_deposit_account a
        WHERE a.Account_Id = p_account_id AND a.Deposit_Type_Cd = 1 AND a.Closing_Date IS NULL
          AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id)
    ) THEN
        SELECT 'ERROR' AS status, 'This account is not an open savings account in your branch' AS message;
        LEAVE proc;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_sc;
    CREATE TEMPORARY TABLE tmp_sc ( /* definition from 6.2 */ );

    INSERT INTO tmp_sc (account_id, charge_id)
    SELECT a.Account_Id, c.Charge_Id
    FROM mst_deposit_account a
    JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
    JOIN mst_deposit_scheme_charges sc ON sc.Scheme_Id = a.Scheme_Id AND sc.Is_Active = 1
    JOIN mst_deposit_charges c ON c.Charge_Id = sc.Charges_Id AND c.Is_Active = 1
    JOIN mst_deposit_account_sb sb
      ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = a.Account_Id)
    LEFT JOIN mst_member m ON a.Cust_Type_Cd = 2 AND m.Member_Id = a.Cust_Id_Primay
    WHERE a.Deposit_Type_Cd = 1
      AND a.Closing_Date IS NULL
      AND (p_account_id IS NULL OR a.Account_Id = p_account_id)
      AND (p_charge_id IS NULL OR c.Charge_Id = p_charge_id)
      AND (p_scheme_id IS NULL OR a.Scheme_Id = p_scheme_id)
      AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id)
      AND (v_kw IS NULL
           OR sb.Ref_AcNo LIKE v_kw OR CAST(sb.Account_No AS CHAR) LIKE v_kw
           OR a.Holder_Name LIKE v_kw OR m.Member_Code LIKE v_kw OR m.Ref_Code LIKE v_kw);

    CALL USP_SAVINGS_CHARGE_PREPARE(p_charge_date);

    SELECT 'SUCCESS' AS status, 'Charges calculated' AS message;

    SELECT COUNT(*) AS total FROM tmp_sc;

    SELECT
        t.account_id,
        COALESCE(NULLIF(sb.Ref_AcNo, ''), CONCAT(s.Scheme_Code, '/', LPAD(sb.Account_No, 5, '0'))) AS full_account_no,
        a.Appl_No AS appl_no,
        a.Holder_Name AS holder_name,
        s.Scheme_Id AS scheme_id,
        s.Scheme_Code AS scheme_code,
        s.Scheme_Name AS scheme_name,
        b.Branch_Name AS branch_name,
        t.current_balance,
        t.available_balance,
        c.Charge_Id AS charge_id,
        c.Charge_Name AS charge_name,
        c.Figure_Cd AS figure_cd,
        c.Charge_Rate AS charge_rate,
        c.Max_Amount AS max_amount,
        t.tax_percent,
        dur.Opt_Description AS charges_during_desc,
        DATE_FORMAT(t.last_charged, '%Y-%m-%d') AS last_charged_date,
        t.charged_this_period,
        t.calculated_amount
    FROM tmp_sc t
    JOIN mst_deposit_account a ON a.Account_Id = t.account_id
    JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
    JOIN mst_deposit_charges c ON c.Charge_Id = t.charge_id
    JOIN mst_deposit_account_sb sb
      ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = a.Account_Id)
    LEFT JOIN mst_appl_options dur ON dur.Opt_Grp_Id = 15 AND dur.Opt_Code = c.Charges_During_Cd
    LEFT JOIN priomicro_core.mst_org_branch b ON b.Branch_Id = a.Branch_Id
    ORDER BY s.Scheme_Code, sb.Account_No, c.Charge_Name
    LIMIT v_offset, v_per_page;

    DROP TEMPORARY TABLE IF EXISTS tmp_sc;
END ;;
DELIMITER ;
```

> `full_account_no` must use the same expression as `DepositAccountList` / `SavingsTransactionList`; the `CONCAT` above is only a fallback.

### 6.4 `USP_SAVINGS_CHARGE_POST`

```sql
DROP PROCEDURE IF EXISTS USP_SAVINGS_CHARGE_POST;
DELIMITER ;;
CREATE PROCEDURE USP_SAVINGS_CHARGE_POST(
    IN p_rows JSON,
    IN p_charge_date DATE,
    IN p_remarks VARCHAR(250),
    IN p_mode TINYINT,         -- 1 single, 2 bulk
    IN p_branch_id INT,        -- NULL only for head-office users
    IN p_user_id INT
)
proc: BEGIN
    DECLARE v_req INT DEFAULT 0;
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_accounts INT DEFAULT 0;
    DECLARE v_charges INT DEFAULT 0;
    DECLARE v_done TINYINT DEFAULT 0;
    DECLARE v_acc INT;
    DECLARE v_charge INT;
    DECLARE v_charge_name VARCHAR(100);
    DECLARE v_calc DECIMAL(14, 2);
    DECLARE v_amount DECIMAL(14, 2);
    DECLARE v_tax_pct DECIMAL(5, 2);
    DECLARE v_tax DECIMAL(14, 2);
    DECLARE v_total DECIMAL(14, 2);
    DECLARE v_sb_id INT;
    DECLARE v_branch INT;
    DECLARE v_balance DECIMAL(14, 2);
    DECLARE v_trans_id INT;
    DECLARE v_trans_no VARCHAR(40);
    DECLARE v_batch_id INT;
    DECLARE v_batch_no VARCHAR(30);
    DECLARE v_gen_status VARCHAR(10);
    DECLARE v_gen_msg VARCHAR(255);
    DECLARE v_sum_charge DECIMAL(14, 2) DEFAULT 0;
    DECLARE v_sum_tax DECIMAL(14, 2) DEFAULT 0;
    DECLARE v_remarks VARCHAR(250) DEFAULT NULLIF(TRIM(IFNULL(p_remarks, '')), '');

    DECLARE cur CURSOR FOR
        SELECT r.account_id, r.charge_id, c.Charge_Name, r.calculated, r.amount, t.tax_percent
        FROM tmp_sc_req r
        JOIN tmp_sc t ON t.account_id = r.account_id AND t.charge_id = r.charge_id
        JOIN mst_deposit_charges c ON c.Charge_Id = r.charge_id
        ORDER BY r.account_id, r.charge_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_charge_date IS NULL OR p_charge_date > CURDATE() THEN
        SELECT 'ERROR' AS status, 'Charge date can''t be in the future' AS message;
        LEAVE proc;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_sc_req;
    CREATE TEMPORARY TABLE tmp_sc_req (
        account_id INT NOT NULL,
        charge_id INT NOT NULL,
        calculated DECIMAL(14, 2) NOT NULL,
        amount DECIMAL(14, 2) NOT NULL,
        PRIMARY KEY (account_id, charge_id)
    );

    SET v_req = JSON_LENGTH(p_rows);
    INSERT IGNORE INTO tmp_sc_req (account_id, charge_id, calculated, amount)
    SELECT j.account_id, j.charge_id, j.calculated, j.amount
    FROM JSON_TABLE(p_rows, '$[*]' COLUMNS (
        account_id INT PATH '$.account_id',
        charge_id INT PATH '$.charge_id',
        calculated DECIMAL(14, 2) PATH '$.calculated_amount',
        amount DECIMAL(14, 2) PATH '$.charge_amount'
    )) j;

    SELECT COUNT(*) INTO v_cnt FROM tmp_sc_req;
    SELECT COUNT(DISTINCT account_id) INTO v_accounts FROM tmp_sc_req;
    SELECT COUNT(DISTINCT charge_id) INTO v_charges FROM tmp_sc_req;
    IF v_req = 0 OR v_cnt <> v_req OR v_cnt > 500
       OR (p_mode = 1 AND v_accounts <> 1)
       OR (p_mode = 2 AND v_charges <> 1) THEN
        SELECT 'ERROR' AS status, 'Check the selected charges and try again' AS message;
        LEAVE proc;
    END IF;

    SELECT COUNT(*) INTO v_cnt FROM tmp_sc_req WHERE amount <= 0;
    IF v_cnt > 0 THEN
        SELECT 'ERROR' AS status, 'Charge amount must be more than 0' AS message;
        LEAVE proc;
    END IF;

    START TRANSACTION;

    -- lock the accounts' savings rows
    SELECT COUNT(*) INTO v_cnt
    FROM mst_deposit_account_sb sb
    JOIN (SELECT DISTINCT account_id FROM tmp_sc_req) r ON r.account_id = sb.Account_Id
    FOR UPDATE;

    -- scope and eligibility: open savings account in branch, charge active on its scheme
    SELECT COUNT(*) INTO v_cnt
    FROM tmp_sc_req r
    JOIN mst_deposit_account a ON a.Account_Id = r.account_id
    JOIN mst_deposit_scheme_charges sc ON sc.Scheme_Id = a.Scheme_Id AND sc.Charges_Id = r.charge_id AND sc.Is_Active = 1
    JOIN mst_deposit_charges c ON c.Charge_Id = r.charge_id AND c.Is_Active = 1
    WHERE a.Deposit_Type_Cd = 1 AND a.Closing_Date IS NULL
      AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id);
    IF v_cnt <> v_req THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, 'One or more charges don''t apply to these accounts' AS message;
        LEAVE proc;
    END IF;

    -- recalculate with the same routine the screen used
    DROP TEMPORARY TABLE IF EXISTS tmp_sc;
    CREATE TEMPORARY TABLE tmp_sc ( /* definition from 6.2 */ );
    INSERT INTO tmp_sc (account_id, charge_id) SELECT account_id, charge_id FROM tmp_sc_req;
    CALL USP_SAVINGS_CHARGE_PREPARE(p_charge_date);

    SELECT COUNT(*) INTO v_cnt
    FROM tmp_sc_req r
    JOIN tmp_sc t ON t.account_id = r.account_id AND t.charge_id = r.charge_id
    WHERE ABS(t.calculated_amount - r.calculated) > 0.01;
    IF v_cnt > 0 THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, CONCAT('Charges have changed for ', v_cnt, ' row(s). Load again.') AS message;
        LEAVE proc;
    END IF;

    -- changed amount or repeat in the same period needs a reason
    SELECT COUNT(*) INTO v_cnt
    FROM tmp_sc_req r
    JOIN tmp_sc t ON t.account_id = r.account_id AND t.charge_id = r.charge_id
    WHERE ABS(r.amount - r.calculated) >= 0.005 OR t.charged_this_period = 1;
    IF v_cnt > 0 AND v_remarks IS NULL THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, 'Add a reason for the changed amount or repeat charge' AS message;
        LEAVE proc;
    END IF;

    -- balance: Σ (charge + tax) per account must fit the available balance
    SELECT COUNT(*) INTO v_cnt
    FROM (
        SELECT r.account_id, MAX(t.available_balance) AS available,
               SUM(r.amount + ROUND(r.amount * t.tax_percent / 100, 2)) AS needed
        FROM tmp_sc_req r
        JOIN tmp_sc t ON t.account_id = r.account_id AND t.charge_id = r.charge_id
        GROUP BY r.account_id
    ) x
    WHERE x.needed > x.available;
    IF v_cnt > 0 THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, CONCAT('Not enough balance in ', v_cnt, ' account(s)') AS message;
        LEAVE proc;
    END IF;

    CALL USP_CODE_SERIES_GENERATE('savings_charge', v_batch_no, v_gen_status, v_gen_msg);
    IF v_gen_status <> 'SUCCESS' THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, IFNULL(v_gen_msg, 'Batch number could not be generated') AS message;
        LEAVE proc;
    END IF;

    INSERT INTO trans_savings_charge_batch (Batch_No, Posting_Mode, Charge_Date, Branch_Id, Remarks, Created_By, Created_At)
    VALUES (v_batch_no, p_mode, p_charge_date, p_branch_id, v_remarks, p_user_id, NOW());
    SET v_batch_id = LAST_INSERT_ID();

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_acc, v_charge, v_charge_name, v_calc, v_amount, v_tax_pct;
        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_tax = ROUND(v_amount * v_tax_pct / 100, 2);
        SET v_total = v_amount + v_tax;

        SELECT sb.Id, sb.Current_Balance, a.Branch_Id INTO v_sb_id, v_balance, v_branch
        FROM mst_deposit_account a
        JOIN mst_deposit_account_sb sb
          ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = a.Account_Id)
        WHERE a.Account_Id = v_acc;

        CALL USP_CODE_SERIES_GENERATE('savings_transaction', v_trans_no, v_gen_status, v_gen_msg);
        IF v_gen_status <> 'SUCCESS' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Transaction number could not be generated';
        END IF;

        INSERT INTO trans_savings_transaction
            (Account_Id, Trans_No, Trans_Date, Effect_Date, Trans_Mode, Trans_Type_Cd, Trans_Amount,
             Balance_After, Ledger_Narration, Branch_Id, Remarks, Voucher_Id, Tr_Status_Cd,
             Created_By, Created_At, Approved_By, Approved_At)
        VALUES
            (v_acc, LEFT(v_trans_no, 40), p_charge_date, p_charge_date, 'TR', 4, v_total,
             IFNULL(v_balance, 0) - v_total,
             LEFT(IF(v_tax > 0, CONCAT(v_charge_name, ' incl. tax'), v_charge_name), 75),
             v_branch, LEFT(CONCAT('Batch ', v_batch_no, IFNULL(CONCAT(' · ', v_remarks), '')), 250), NULL, 1,
             p_user_id, NOW(), p_user_id, NOW());
        SET v_trans_id = LAST_INSERT_ID();

        UPDATE mst_deposit_account_sb
        SET Current_Balance = IFNULL(Current_Balance, 0) - v_total,
            Available_Balance = IFNULL(Available_Balance, 0) - v_total
        WHERE Id = v_sb_id;

        INSERT INTO trans_savings_charge
            (Batch_Id, Account_Id, Charge_Id, Charge_Date, Calculated_Amount, Charge_Amount,
             Tax_Percent, Tax_Amount, Total_Amount, Sav_Trans_Id)
        VALUES
            (v_batch_id, v_acc, v_charge, p_charge_date, v_calc, v_amount, v_tax_pct, v_tax, v_total, v_trans_id);

        SET v_sum_charge = v_sum_charge + v_amount;
        SET v_sum_tax = v_sum_tax + v_tax;
    END LOOP;
    CLOSE cur;

    UPDATE trans_savings_charge_batch
    SET Row_Count = v_req, Charge_Total = v_sum_charge, Tax_Total = v_sum_tax
    WHERE Batch_Id = v_batch_id;

    COMMIT;

    SELECT 'SUCCESS' AS status, 'Charges deducted' AS message,
           v_batch_id AS batch_id, v_batch_no AS batch_no, v_req AS posted_count,
           v_sum_charge AS total_charge, v_sum_tax AS total_tax;

    DROP TEMPORARY TABLE IF EXISTS tmp_sc;
    DROP TEMPORARY TABLE IF EXISTS tmp_sc_req;
END ;;
DELIMITER ;
```

> Check the `USP_CODE_SERIES_GENERATE` OUT-parameter order and success value against the existing definition, as noted in the interest guide.

---

## 7. Laravel 12 implementation

Reuse `App\Support\StoredProcedure` and `App\Exceptions\ProcedureException` from `docs/fd-settlement-api.md` (sections 15.2–15.3), and the same `branch()` helper as `SavingsInterestController` (non-head users always get their own branch).

### 7.1 Controller — `app/Http/Controllers/Api/SavingsChargeController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SavingsChargePostRequest;
use App\Services\SavingsVoucherService;
use App\Support\StoredProcedure as Sp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class SavingsChargeController extends Controller
{
    private function branch(Request $request): ?int
    {
        $user = $request->user();
        if ($user->is_head) {
            return $request->filled('branch_id') ? (int) $request->input('branch_id') : null;
        }

        return (int) $user->branch_id;
    }

    public function calculate(Request $request): JsonResponse
    {
        $input = $request->validate([
            'charge_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'account_id'  => ['nullable', 'integer', 'min:1', 'required_without:charge_id'],
            'charge_id'   => ['nullable', 'integer', 'min:1', 'required_without:account_id'],
            'scheme_id'   => ['nullable', 'integer', 'min:1'],
            'branch_id'   => ['nullable', 'integer', 'min:1'],
            'keyword'     => ['nullable', 'string', 'max:60'],
            'page'        => ['nullable', 'integer', 'min:1'],
            'per_page'    => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $page = (int) ($input['page'] ?? 1);
        $perPage = (int) ($input['per_page'] ?? 500);

        $sets = Sp::call('USP_SAVINGS_CHARGE_CALC', [
            $input['charge_date'],
            $input['account_id'] ?? null,
            $input['charge_id'] ?? null,
            $input['scheme_id'] ?? null,
            $this->branch($request),
            $input['keyword'] ?? null,
            $page,
            $perPage,
        ]);
        Sp::expectSuccess($sets[0] ?? []);

        $total = (int) ($sets[1][0]['total'] ?? 0);

        return response()->json([
            'success' => true,
            'message' => 'Charges calculated',
            'data'    => $sets[2] ?? [],
            'meta'    => [
                'total'     => $total,
                'page'      => $page,
                'per_page'  => $perPage,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    public function post(SavingsChargePostRequest $request, SavingsVoucherService $vouchers): JsonResponse
    {
        $input = $request->validated();

        $sets = Sp::call('USP_SAVINGS_CHARGE_POST', [
            json_encode($input['rows'], JSON_THROW_ON_ERROR),
            $input['charge_date'],
            $input['remarks'] ?? null,
            $input['mode'] === 'bulk' ? 2 : 1,
            $this->branch($request),
            (int) $request->user()->id,
        ]);
        $row = Sp::expectSuccess($sets[0] ?? []);

        $pending = 0;
        foreach (array_unique(array_column($input['rows'], 'account_id')) as $accountId) {
            try {
                $vouchers->postMissing((int) $accountId);
            } catch (Throwable $e) {
                $pending++;
                Log::warning('Savings charge voucher failed', ['account_id' => $accountId, 'batch_id' => $row['batch_id'], 'error' => $e->getMessage()]);
            }
        }

        // trans_audit_log: module SavingsCharges, batch_id, user, ip, now

        return response()->json([
            'success' => true,
            'message' => $pending > 0
                ? "Charges deducted. Vouchers for {$pending} account(s) are pending."
                : 'Charges deducted',
            'data' => [
                'batch_id'        => (int) $row['batch_id'],
                'batch_no'        => (string) $row['batch_no'],
                'posted_count'    => (int) $row['posted_count'],
                'total_charge'    => (float) $row['total_charge'],
                'total_tax'       => (float) $row['total_tax'],
                'voucher_pending' => $pending,
            ],
        ], 201);
    }
}
```

### 7.2 Request — `app/Http/Requests/SavingsChargePostRequest.php`

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SavingsChargePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'mode'                     => ['required', Rule::in(['single', 'bulk'])],
            'charge_date'              => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'remarks'                  => ['nullable', 'string', 'max:250'],
            'branch_id'                => ['nullable', 'integer', 'min:1'],
            'rows'                     => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.account_id'        => ['required', 'integer', 'min:1'],
            'rows.*.charge_id'         => ['required', 'integer', 'min:1'],
            'rows.*.calculated_amount' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'rows.*.charge_amount'     => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:99999999.99'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $rows = collect((array) $this->input('rows'));
                $keys = $rows->map(fn ($r) => ($r['account_id'] ?? '') . ':' . ($r['charge_id'] ?? ''));
                if ($keys->count() !== $keys->unique()->count()) {
                    $validator->errors()->add('rows', 'Duplicate charge for an account');
                }
                if ($this->input('mode') === 'single' && $rows->pluck('account_id')->unique()->count() !== 1) {
                    $validator->errors()->add('rows', 'Single posting takes one account');
                }
                if ($this->input('mode') === 'bulk' && $rows->pluck('charge_id')->unique()->count() !== 1) {
                    $validator->errors()->add('rows', 'Bulk posting takes one charge');
                }
            },
        ];
    }
}
```

### 7.3 Vouchers

Use the same `SavingsVoucherService::postMissing()` as interest posting (it posts every transaction of the account with `Voucher_Id IS NULL`). For `Trans_Type_Cd = 4`, build the voucher from `trans_savings_charge` (join on `Sav_Trans_Id`) so the split is right:

| Line | Ledger | Amount |
| --- | --- | --- |
| Debit | Savings deposit — `mst_deposit_scheme.Prn_Ledger` (sub-ledger = account) | `Total_Amount` |
| Credit | Charge income — `mst_deposit_charges.Charges_Gl` | `Charge_Amount` |
| Credit | Tax payable (GST output ledger) | `Tax_Amount` (skip when 0) |

The tax payable ledger isn't stored on the charge. Read it from your GL settings (the same ledger loan-charge tax uses, if one exists), or add a setting for it. A charge with no `Charges_Gl` should be blocked in Charges Setup, or the voucher will fail and stay pending.

### 7.4 Routes — `routes/api.php`

```php
use App\Http\Controllers\Api\SavingsChargeController;

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::get('SavingsChargeCalculate', [SavingsChargeController::class, 'calculate']);
    Route::post('SavingsChargePost', [SavingsChargeController::class, 'post'])->middleware('throttle:30,1');
});
```

---

## 8. Quick API checks

```bash
# Single: all charges on account 19's scheme
curl -s "$API/api/SavingsChargeCalculate?charge_date=2026-11-03&account_id=19" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"

# Bulk: SMS Alert Charge (4) on every account whose scheme carries it
curl -s "$API/api/SavingsChargeCalculate?charge_date=2026-11-03&charge_id=4" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"

# Post (use calculated_amount from above)
curl -s -X POST "$API/api/SavingsChargePost" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"mode":"single","charge_date":"2026-11-03","rows":[{"account_id":19,"charge_id":4,"calculated_amount":15,"charge_amount":15}]}'

# Post the same body again for a Quarter End charge — must fail with "Add a reason …" (already charged this period)
```

---

## 9. What the screen does with each response

| Response | Screen |
| --- | --- |
| Calculate 200 (single) | One row per scheme charge; rows with an amount and not charged this period are ticked |
| Calculate 200, no rows (single) | "No charges on this scheme" — attach them in Deposit Schemes |
| Calculate 200 (bulk) | One row per account for the chosen charge; short-balance and already-charged rows unticked |
| `charged_this_period = 1` | Amber "Already charged this period" badge; ticking it requires remarks |
| Selected total > `available_balance` | Row total in red "Not enough balance"; Deduct disabled |
| `meta.total` > rows returned | Amber note: deduct these, then load again or narrow the filters |
| Post 201 | Success toast with count, total and batch no.; the list recalculates |
| 422 | Error toast with the message |

---

## 10. Test checklist

- [ ] Fixed charge (`Figure_Cd = 1`, rate 15, tax 18%): charge 15.00, tax 2.70, total 17.70; balance drops by 17.70.
- [ ] Percentage charge (2% of ₹10,000, max ₹100): 100.00 (capped); with max 0: 200.00.
- [ ] Charge with no rate and no max: calculates 0; posting needs an amount > 0 and remarks.
- [ ] Charge not attached to the scheme, or inactive on the scheme or in Charges Setup: not listed, and posting it directly → 422.
- [ ] Month End charge posted on 3 Nov: on 20 Nov it shows "Already charged this period"; on 1 Dec it doesn't.
- [ ] Quarter / half-year / year periods follow the April–March financial year.
- [ ] Repeat charge in the same period without remarks → 422; with remarks → posted.
- [ ] Changed amount without remarks → 422.
- [ ] Two charges on one account totalling more than the available balance → 422; the screen blocks it first.
- [ ] Two users deduct the same rows at once: the second gets "Add a reason …" (now a repeat) or a balance error, never a silent double charge.
- [ ] Reversing a charge transaction sets `Is_Reversed = 1` and the charge can be taken again.
- [ ] Non-head user can't load or post another branch's account, even with a forged `branch_id`.
- [ ] Voucher: Dr savings deposit total, Cr charge income charge, Cr tax payable tax.
