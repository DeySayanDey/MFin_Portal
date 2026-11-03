# Savings Interest Posting — Backend API Guide

Source of truth: `priomicro_basundhara.sql` (tenant schema). Screen: `/deposits/interest` with two tabs, **Single** (one savings account) and **Bulk** (many savings accounts).

**Implementation order for the backend:** section 3 (tables) → section 6 (procedures) → section 7 (Laravel) → section 8 (checks) → section 10 (tests).

The browser only calls the Next.js BFF. The BFF validates the input, binds the branch to the session, and calls these Laravel endpoints with the user's Bearer token.

| BFF route (Next.js) | Laravel endpoint | Method | Stored procedure | Status |
| --- | --- | --- | --- | --- |
| `GET /api/deposits/interest?mode=single&account_id=&as_on_date=` | `/api/SavingsInterestCalculate` | GET | `USP_SAVINGS_INTEREST_CALC` | **new** |
| `GET /api/deposits/interest?mode=bulk&scheme_id=&branch_id=&keyword=&as_on_date=` | `/api/SavingsInterestCalculate` | GET | `USP_SAVINGS_INTEREST_CALC` | **new** |
| `POST /api/deposits/interest` | `/api/SavingsInterestPost` | POST (JSON) | `USP_SAVINGS_INTEREST_POST` | **new** |
| Single tab account search | existing `/api/SavingsCustomerList` | GET | existing | existing |
| Bulk tab scheme list | existing deposit product schemes (`deposit_type_cd=1`) | GET | existing | existing |

Frontend files: `src/features/deposits/interest-posting/` (types, schemas, mapper, services, components). Endpoint constants: `endpoints.savingsInterest` and `endpoints.bff.savingsInterest` in `src/lib/api/endpoints.ts`.

Both procedures share one calculation routine, `USP_SAVINGS_INTEREST_PREPARE`, so the amount shown on screen and the amount re-checked at posting time always come from the same SQL.

---

## 1. Workflow

1. The user picks **Interest up to** (`as_on_date`, not in the future) and a **Posting date** (between `as_on_date` and today).
2. **Single:** the user searches and selects one savings account. The screen calls Calculate with `account_id`.
   **Bulk:** the user picks a scheme (optional), a branch (head office only) and a keyword, then clicks *Load accounts*. The screen calls Calculate without `account_id`. Only accounts with days due are returned, up to 500.
3. For each account the period runs from **the day after the last posted interest** (or the account start date) to `as_on_date`. Interest is calculated on the daily product (section 4).
4. The user can change the interest amount on any row. A changed amount requires **Remarks**.
5. The user clicks *Post interest* and confirms. The screen sends the selected rows with both the calculated and the final amount.
6. `USP_SAVINGS_INTEREST_POST` locks the accounts, **recalculates**, and rejects the whole batch if any row is stale (someone posted or a transaction changed the balance). Otherwise it credits each account, writes the interest history, and returns the batch.
7. Laravel posts the vouchers for the new transactions with the existing savings voucher logic (section 7.3).

---

## 2. Code values used

| Code | Source | Values |
| --- | --- | --- |
| `Deposit_Type_Cd` | group 3 | 1 Savings, 2 Term deposit. Only 1 is used here. |
| `Trans_Type_Cd` | group 36 | **3 Interest** (also 1 Deposit, 2 Withdrawal, 4 Charges, 5 Reversal, 6 Transfer, 7 Closing) |
| `Appl_Status_Cd` (deposit account) | group 14 | 6 *Stop Interest* is excluded. Closed accounts (`Closing_Date IS NOT NULL`) are excluded. |
| `Intt_Type_Cd` (scheme) | group 12 | 1 Daily product, 2 Monthly product. See section 4 for 2. |
| `Tr_Status_Cd` (savings transaction) | — | 1 = posted. Only posted rows count towards the balance. |

---

## 3. Tables

### 3.1 New table `trans_savings_interest_batch`

One row per *Post interest* click.

```sql
CREATE TABLE `trans_savings_interest_batch` (
  `Batch_Id` int NOT NULL AUTO_INCREMENT,
  `Batch_No` varchar(30) NOT NULL,
  `Posting_Mode` tinyint NOT NULL COMMENT '1 single, 2 bulk',
  `As_On_Date` date NOT NULL,
  `Posting_Date` date NOT NULL,
  `Branch_Id` smallint DEFAULT NULL,
  `Account_Count` int NOT NULL DEFAULT '0',
  `Calculated_Total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `Posted_Total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `Remarks` varchar(250) DEFAULT NULL,
  `Created_By` smallint NOT NULL,
  `Created_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Batch_Id`),
  UNIQUE KEY `uq_sib_batch_no` (`Batch_No`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
```

### 3.2 New table `trans_savings_interest`

One row per account per posting. This is the **interest history**: `MAX(To_Date)` per account is the last posted date. The unique key makes a double posting for the same period impossible.

```sql
CREATE TABLE `trans_savings_interest` (
  `Interest_Id` bigint NOT NULL AUTO_INCREMENT,
  `Batch_Id` int NOT NULL,
  `Account_Id` int NOT NULL,
  `From_Date` date NOT NULL,
  `To_Date` date NOT NULL,
  `Days` smallint NOT NULL,
  `Product_Amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `RoI` decimal(6,3) NOT NULL,
  `Calculated_Amount` decimal(14,2) NOT NULL,
  `Posted_Amount` decimal(14,2) NOT NULL,
  `Sav_Trans_Id` int DEFAULT NULL COMMENT 'NULL when the posted amount is 0',
  `Created_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Interest_Id`),
  UNIQUE KEY `uq_si_account_to` (`Account_Id`, `To_Date`),
  KEY `idx_si_batch` (`Batch_Id`),
  CONSTRAINT `fk_si_batch` FOREIGN KEY (`Batch_Id`) REFERENCES `trans_savings_interest_batch` (`Batch_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
```

### 3.3 Existing tables used

| Table | Used for |
| --- | --- |
| `mst_deposit_account` | Eligibility, branch, holder, scheme |
| `mst_deposit_account_sb` (latest row by `MAX(Id)`) | `Account_No`, `Ref_AcNo`, `Start_Date`, `RoI`, `Current_Balance`, `Available_Balance` |
| `mst_deposit_scheme` | `Scheme_Code`, `Scheme_Name`, `RoI_Percent` (fallback rate), `Intt_Type_Cd`, `Min_Balance` |
| `trans_savings_transaction` | Balance history (`Balance_After`) and the new interest credit rows |
| `USP_CODE_SERIES_GENERATE` | `savings_interest` (batch no.) and `savings_transaction` (transaction no.) |

Add a `savings_interest` row in the Code Series master (for example prefix `SI/`) before going live.

### 3.4 Indexes

```sql
CREATE INDEX idx_sav_trans_acc_date ON trans_savings_transaction (Account_Id, Tr_Status_Cd, Trans_Date, Sav_Trans_Id);
```

---

## 4. Calculation rules

Interest follows the **scheme's interest type** (`mst_deposit_scheme.Intt_Type_Cd`, option group 12). The calculated amount is returned as `calculated_interest`; the screen fills it into the editable amount box by default and the user can change it (a changed amount needs remarks).

- **Start:** `from_date = MAX(trans_savings_interest.To_Date) + 1 day`, or `mst_deposit_account_sb.Start_Date` if interest was never posted.
- **Rate:** `mst_deposit_account_sb.RoI`, or `mst_deposit_scheme.RoI_Percent` when the account rate is 0 or NULL.
- **Balance on a day:** `Balance_After` of the last posted transaction (`Tr_Status_Cd = 1`) on or before that day. Negative balances count as 0.

| `Intt_Type_Cd` | Period end (`to_date`) | Product | Interest |
| --- | --- | --- | --- |
| **1 Daily Product** (also 3 Simple and any other code) | `as_on_date` | Σ day-end balance × days held | `ROUND(product × rate ÷ 36500, 2)` |
| **2 Monthly Product** | Last **complete** month end on or before `as_on_date` (as on 3 Nov → 31 Oct; as on 30 Nov → 30 Nov) | Σ for each month of the lowest balance from the 10th (or `from_date` if later) to the month end | `ROUND(product × rate ÷ 1200, 2)` |

`days = to_date − from_date + 1`. When `days ≤ 0` nothing is due yet (for Monthly Product this means the current month isn't complete).

Example — scheme `test 2` (Monthly Product, 12%), account opened 12 Oct with ₹500, as on 3 Nov: period 12 Oct – 31 Oct, product = 500, interest = 500 × 12 ÷ 1200 = **₹5.00**. The same account on Daily Product would get 500 × 20 × 12 ÷ 36500 = ₹3.29.

- **Minimum balance:** by default it does **not** stop interest (`Min_Balance` is a withdrawal limit). If your rules say "no interest below minimum balance", set `v_min_rule = 1` in `USP_SAVINGS_INTEREST_PREPARE`. Daily Product then pays nothing for days below the minimum; Monthly Product pays nothing for a month whose lowest balance is below it.
- **Rounding:** to round to whole rupees, change `ROUND(…, 2)` to `ROUND(…, 0)` in the last step of `USP_SAVINGS_INTEREST_PREPARE`.
- **Interest credit date:** the credit transaction is dated `posting_date` with `Effect_Date = to_date`. The next period starts at `to_date + 1`, and the interest only earns from its own transaction date, which is correct.

> Backdated savings transactions entered **after** a period was posted change `Balance_After` for days that were already paid. Block backdating before the last posted `To_Date` in `USP_SAVINGS_TRANSACTION_ADD`, or accept that the next period won't revisit it.

---

## 5. Common rules

- Auth: `auth:sanctum` (or the existing guard). Resolve the tenant schema from the token, never from the request.
- **Branch isolation:** non-head users only see and post accounts where `mst_deposit_account.Branch_Id = user branch`, whatever `branch_id` says. The BFF sends the user's branch; Laravel must still enforce it (section 7.1 `branch()`).
- Pass `p_user_id` from the logged-in user, never from the body.
- Limits: Calculate returns at most 500 rows (`per_page` max 500). Post accepts 1–500 rows; Single accepts exactly 1.
- Procedures return `status` = `SUCCESS` / `ERROR` and `message`. Map `ERROR` to HTTP 422. Messages are shown in a toast, so keep them short and plain.
- Apply the menu-permission middleware for `/deposits/interest` and `throttle:30,1` on Post.
- Write a `trans_audit_log` row (module `SavingsInterest`) per batch.

Envelope:

```json
{ "success": true, "message": "Interest calculated", "data": [ ], "meta": { "total": 812, "page": 1, "per_page": 500, "last_page": 2 } }
```

```json
{ "success": false, "message": "Interest has changed for 2 accounts. Calculate again.", "errors": null, "data": null }
```

---

## 5.1 GET `/api/SavingsInterestCalculate`

| Param | Type | Rule |
| --- | --- | --- |
| `as_on_date` | date `Y-m-d` | required, `before_or_equal:today` |
| `account_id` | int | Single tab: required. Returns the row even when up to date (`days = 0`) so the screen can say "Posted up to …". Returns 422 if the account is not an eligible savings account in scope. |
| `scheme_id` | int | Bulk: optional |
| `keyword` | string | Bulk: optional, max 60. Matches account no., ref account no., holder name, member code / ref code. |
| `branch_id` | int | Ignored for non-head users |
| `page`, `per_page` | int | default 1 / 500, `per_page` max 500 |

Bulk returns only accounts with `days > 0`, ordered by scheme then account number.

Row shape (`data[]`):

```json
{
  "account_id": 501,
  "full_account_no": "SB01/00501",
  "appl_no": "DA-2024-0501",
  "holder_name": "Rina Das",
  "scheme_id": 3,
  "scheme_code": "SB01",
  "scheme_name": "Regular Savings",
  "branch_name": "Basundhara",
  "current_balance": 4520.50,
  "roi": 4.0,
  "intt_type_desc": "Daily Product Basic",
  "last_posted_date": "2026-06-30",
  "from_date": "2026-07-01",
  "to_date": "2026-09-30",
  "days": 92,
  "product_amount": 412560.00,
  "calculated_interest": 45.21
}
```

> `full_account_no` must use the same expression as `DepositAccountList` / `SavingsTransactionList`. The `CONCAT(Scheme_Code, '/', LPAD(Account_No, 5, '0'))` in section 6 is only a fallback.

## 5.2 POST `/api/SavingsInterestPost`

```json
{
  "mode": "bulk",
  "as_on_date": "2026-09-30",
  "posting_date": "2026-10-01",
  "remarks": "Q2 interest",
  "branch_id": 3,
  "rows": [
    { "account_id": 501, "from_date": "2026-07-01", "to_date": "2026-09-30", "calculated_interest": 45.21, "interest_amount": 45.21 },
    { "account_id": 502, "from_date": "2026-07-01", "to_date": "2026-09-30", "calculated_interest": 12.40, "interest_amount": 12.00 }
  ]
}
```

Validation (Laravel, section 7.2) plus the procedure:

| Rule | Error |
| --- | --- |
| `posting_date` between `as_on_date` and today | 422 `Posting date can't be before the interest date` |
| Single mode with more than one row | 422 |
| Duplicate `account_id` | 422 |
| Account not an open savings account, *Stop Interest*, or outside the user's branch | 422 `One or more accounts are not eligible or not in your branch` |
| `from_date` / `to_date` / `calculated_interest` differ from a fresh recalculation | 422 `Interest has changed for {n} accounts. Calculate again.` |
| `interest_amount` ≠ `calculated_interest` and no `remarks` | 422 `Add a reason for the changed interest` |
| Same account + `to_date` already posted (unique key) | 422 via the stale check above |

Success `data`:

```json
{ "batch_id": 41, "batch_no": "SI/2026/0041", "posted_count": 2, "total_interest": 57.21, "voucher_pending": 0 }
```

---

## 6. SQL

### 6.1 `USP_SAVINGS_INTEREST_PREPARE` (shared calculation)

Expects a temporary table `tmp_si_acc` with `account_id` filled in. Fills in period, rate, product and interest **by scheme interest type** (section 4). MySQL can't read a TEMPORARY table twice in one statement, so each step touches `tmp_si_acc` once and the helper tables carry the values they need.

If an account has no posted transaction on or before a date (for example the opening deposit was never written to `trans_savings_transaction`), the balance falls back to `mst_deposit_account_sb.Opening_Deposit`. Without this, such accounts calculate as ₹0.

```sql
DROP PROCEDURE IF EXISTS USP_SAVINGS_INTEREST_PREPARE;
DELIMITER ;;
CREATE PROCEDURE USP_SAVINGS_INTEREST_PREPARE(IN p_as_on DATE)
BEGIN
    -- 1 = no interest below the scheme minimum balance (section 4)
    DECLARE v_min_rule TINYINT DEFAULT 0;
    -- Monthly Product only pays complete months
    DECLARE v_month_end DATE DEFAULT IF(p_as_on = LAST_DAY(p_as_on), p_as_on,
                                        LAST_DAY(DATE_SUB(p_as_on, INTERVAL 1 MONTH)));

    UPDATE tmp_si_acc t
    JOIN mst_deposit_account a ON a.Account_Id = t.account_id
    JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
    JOIN mst_deposit_account_sb sb
      ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = a.Account_Id)
    SET t.scheme_id       = s.Scheme_Id,
        t.intt_type_cd    = IFNULL(s.Intt_Type_Cd, 1),
        t.roi             = COALESCE(NULLIF(sb.RoI, 0), s.RoI_Percent, 0),
        t.min_balance     = IFNULL(s.Min_Balance, 0),
        t.start_date      = sb.Start_Date,
        t.opening_deposit = IFNULL(sb.Opening_Deposit, 0),
        t.current_balance = sb.Current_Balance,
        t.last_posted     = (SELECT MAX(i.To_Date) FROM trans_savings_interest i WHERE i.Account_Id = a.Account_Id);

    UPDATE tmp_si_acc
    SET from_date           = IF(last_posted IS NULL, start_date, DATE_ADD(last_posted, INTERVAL 1 DAY)),
        to_date             = IF(intt_type_cd = 2, v_month_end, p_as_on),
        product_amount      = 0,
        calculated_interest = 0;

    UPDATE tmp_si_acc
    SET days = IF(from_date IS NULL, 0, GREATEST(DATEDIFF(to_date, from_date) + 1, 0));

    -- ===== Daily Product: every interest type except 2 =====
    DROP TEMPORARY TABLE IF EXISTS tmp_si_evt;
    CREATE TEMPORARY TABLE tmp_si_evt (
        account_id INT NOT NULL,
        evt_date DATE NOT NULL,
        balance DECIMAL(14, 2) NOT NULL,
        period_end DATE NOT NULL,
        min_balance DECIMAL(14, 2) NOT NULL,
        PRIMARY KEY (account_id, evt_date)
    );

    -- opening balance: day-end balance of the day before the period
    INSERT INTO tmp_si_evt (account_id, evt_date, balance, period_end, min_balance)
    SELECT t.account_id, t.from_date,
           IFNULL((SELECT x.Balance_After FROM trans_savings_transaction x
                    WHERE x.Account_Id = t.account_id AND x.Tr_Status_Cd = 1 AND x.Trans_Date < t.from_date
                    ORDER BY x.Trans_Date DESC, x.Sav_Trans_Id DESC LIMIT 1), t.opening_deposit),
           t.to_date, t.min_balance
    FROM tmp_si_acc t
    WHERE t.days > 0 AND t.intt_type_cd <> 2;

    -- day-end balance on every day inside the period that has transactions
    INSERT INTO tmp_si_evt (account_id, evt_date, balance, period_end, min_balance)
    SELECT r.Account_Id, r.Trans_Date, r.Balance_After, r.to_date, r.min_balance
    FROM (
        SELECT x.Account_Id, x.Trans_Date, x.Balance_After, t.to_date, t.min_balance,
               ROW_NUMBER() OVER (PARTITION BY x.Account_Id, x.Trans_Date ORDER BY x.Sav_Trans_Id DESC) AS rn
        FROM trans_savings_transaction x
        JOIN tmp_si_acc t ON t.account_id = x.Account_Id
        WHERE t.days > 0 AND t.intt_type_cd <> 2
          AND x.Tr_Status_Cd = 1 AND x.Trans_Date BETWEEN t.from_date AND t.to_date
    ) r
    WHERE r.rn = 1
    ON DUPLICATE KEY UPDATE balance = VALUES(balance);

    -- product = Σ day-end balance × days held
    UPDATE tmp_si_acc t
    JOIN (
        SELECT e.account_id,
               SUM(IF(v_min_rule = 1 AND e.balance < e.min_balance, 0, GREATEST(e.balance, 0))
                   * DATEDIFF(COALESCE(e.next_date, DATE_ADD(e.period_end, INTERVAL 1 DAY)), e.evt_date)) AS product
        FROM (
            SELECT account_id, evt_date, balance, period_end, min_balance,
                   LEAD(evt_date) OVER (PARTITION BY account_id ORDER BY evt_date) AS next_date
            FROM tmp_si_evt
        ) e
        GROUP BY e.account_id
    ) p ON p.account_id = t.account_id
    SET t.product_amount = p.product;

    -- ===== Monthly Product: interest type 2 =====
    -- one row per month: window = 10th (or from_date if later) .. month end
    DROP TEMPORARY TABLE IF EXISTS tmp_si_mon;
    CREATE TEMPORARY TABLE tmp_si_mon (
        account_id INT NOT NULL,
        win_from DATE NOT NULL,
        win_to DATE NOT NULL,
        min_balance DECIMAL(14, 2) NOT NULL,
        opening_deposit DECIMAL(14, 2) NOT NULL,
        low_balance DECIMAL(14, 2) NULL,
        PRIMARY KEY (account_id, win_from)
    );

    INSERT INTO tmp_si_mon (account_id, win_from, win_to, min_balance, opening_deposit)
    WITH RECURSIVE m (account_id, month_start, period_start, period_end, min_balance, opening_deposit) AS (
        SELECT account_id, DATE_SUB(from_date, INTERVAL DAY(from_date) - 1 DAY), from_date, to_date,
               min_balance, opening_deposit
        FROM tmp_si_acc
        WHERE intt_type_cd = 2 AND days > 0
        UNION ALL
        SELECT account_id, DATE_ADD(month_start, INTERVAL 1 MONTH), period_start, period_end,
               min_balance, opening_deposit
        FROM m
        WHERE DATE_ADD(month_start, INTERVAL 1 MONTH) <= period_end
    )
    SELECT account_id, GREATEST(DATE_ADD(month_start, INTERVAL 9 DAY), period_start), LAST_DAY(month_start),
           min_balance, opening_deposit
    FROM m;

    -- lowest balance in the window: day-end balance of the first day, then every transaction inside it
    UPDATE tmp_si_mon w
    SET w.low_balance = LEAST(
        IFNULL((SELECT x.Balance_After FROM trans_savings_transaction x
                 WHERE x.Account_Id = w.account_id AND x.Tr_Status_Cd = 1 AND x.Trans_Date <= w.win_from
                 ORDER BY x.Trans_Date DESC, x.Sav_Trans_Id DESC LIMIT 1), w.opening_deposit),
        IFNULL((SELECT MIN(x.Balance_After) FROM trans_savings_transaction x
                 WHERE x.Account_Id = w.account_id AND x.Tr_Status_Cd = 1
                   AND x.Trans_Date > w.win_from AND x.Trans_Date <= w.win_to), 999999999999.99)
    );

    -- product = Σ monthly lowest balances
    UPDATE tmp_si_acc t
    JOIN (
        SELECT account_id,
               SUM(IF(v_min_rule = 1 AND low_balance < min_balance, 0, GREATEST(low_balance, 0))) AS product
        FROM tmp_si_mon
        GROUP BY account_id
    ) p ON p.account_id = t.account_id
    SET t.product_amount = p.product;

    -- ===== Interest =====
    UPDATE tmp_si_acc
    SET calculated_interest = CASE
        WHEN days <= 0 THEN 0
        WHEN intt_type_cd = 2 THEN ROUND(IFNULL(product_amount, 0) * roi / 1200, 2)
        ELSE ROUND(IFNULL(product_amount, 0) * roi / 36500, 2)
    END;

    DROP TEMPORARY TABLE IF EXISTS tmp_si_evt;
    DROP TEMPORARY TABLE IF EXISTS tmp_si_mon;
END ;;
DELIMITER ;
```

Both procedures below create `tmp_si_acc` with this definition:

```sql
CREATE TEMPORARY TABLE tmp_si_acc (
    account_id INT PRIMARY KEY,
    scheme_id INT NULL,
    intt_type_cd TINYINT NULL,
    roi DECIMAL(6, 3) NULL,
    min_balance DECIMAL(14, 2) NULL,
    start_date DATE NULL,
    opening_deposit DECIMAL(14, 2) NULL,
    current_balance DECIMAL(14, 2) NULL,
    last_posted DATE NULL,
    from_date DATE NULL,
    to_date DATE NULL,
    days INT NOT NULL DEFAULT 0,
    product_amount DECIMAL(18, 2) NULL,
    calculated_interest DECIMAL(14, 2) NOT NULL DEFAULT 0
);
```

### 6.2 `USP_SAVINGS_INTEREST_CALC`

Result sets: **0** status, **1** total, **2** rows.

```sql
DROP PROCEDURE IF EXISTS USP_SAVINGS_INTEREST_CALC;
DELIMITER ;;
CREATE PROCEDURE USP_SAVINGS_INTEREST_CALC(
    IN p_as_on DATE,
    IN p_account_id INT,
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

    IF p_as_on IS NULL OR p_as_on > CURDATE() THEN
        SELECT 'ERROR' AS status, 'Interest date must be today or earlier' AS message;
        LEAVE proc;
    END IF;

    IF NULLIF(TRIM(p_keyword), '') IS NOT NULL THEN
        SET v_kw = CONCAT('%', TRIM(p_keyword), '%');
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_si_acc;
    CREATE TEMPORARY TABLE tmp_si_acc ( /* definition from 6.1 */ );

    INSERT INTO tmp_si_acc (account_id)
    SELECT a.Account_Id
    FROM mst_deposit_account a
    JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
    JOIN mst_deposit_account_sb sb
      ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = a.Account_Id)
    LEFT JOIN mst_member m ON a.Cust_Type_Cd = 2 AND m.Member_Id = a.Cust_Id_Primay
    WHERE a.Deposit_Type_Cd = 1
      AND a.Closing_Date IS NULL
      AND IFNULL(a.Appl_Status_Cd, 1) <> 6
      AND (p_account_id IS NULL OR a.Account_Id = p_account_id)
      AND (p_scheme_id IS NULL OR a.Scheme_Id = p_scheme_id)
      AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id)
      AND (v_kw IS NULL
           OR sb.Ref_AcNo LIKE v_kw OR CAST(sb.Account_No AS CHAR) LIKE v_kw
           OR CONCAT(s.Scheme_Code, '/', LPAD(sb.Account_No, 5, '0')) LIKE v_kw
           OR a.Holder_Name LIKE v_kw OR m.Member_Code LIKE v_kw OR m.Ref_Code LIKE v_kw);

    IF p_account_id IS NOT NULL AND ROW_COUNT() = 0 THEN
        SELECT 'ERROR' AS status, 'This account is not an open savings account in your branch' AS message;
        DROP TEMPORARY TABLE IF EXISTS tmp_si_acc;
        LEAVE proc;
    END IF;

    CALL USP_SAVINGS_INTEREST_PREPARE(p_as_on);

    SELECT 'SUCCESS' AS status, 'Interest calculated' AS message;

    SELECT COUNT(*) AS total FROM tmp_si_acc WHERE p_account_id IS NOT NULL OR days > 0;

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
        t.roi,
        it.Opt_Description AS intt_type_desc,
        DATE_FORMAT(t.last_posted, '%Y-%m-%d') AS last_posted_date,
        DATE_FORMAT(t.from_date, '%Y-%m-%d') AS from_date,
        DATE_FORMAT(t.to_date, '%Y-%m-%d') AS to_date,
        t.days,
        IFNULL(t.product_amount, 0) AS product_amount,
        t.calculated_interest
    FROM tmp_si_acc t
    JOIN mst_deposit_account a ON a.Account_Id = t.account_id
    JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
    JOIN mst_deposit_account_sb sb
      ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = a.Account_Id)
    LEFT JOIN mst_appl_options it ON it.Opt_Grp_Id = 12 AND it.Opt_Code = s.Intt_Type_Cd
    LEFT JOIN priomicro_core.mst_org_branch b ON b.Branch_Id = a.Branch_Id
    WHERE p_account_id IS NOT NULL OR t.days > 0
    ORDER BY s.Scheme_Code, sb.Account_No
    LIMIT v_offset, v_per_page;

    DROP TEMPORARY TABLE IF EXISTS tmp_si_acc;
END ;;
DELIMITER ;
```

### 6.3 `USP_SAVINGS_INTEREST_POST`

Rows arrive as one JSON parameter (read with `JSON_TABLE`, MySQL 8). Everything runs in one transaction: either the whole batch posts or nothing does.

```sql
DROP PROCEDURE IF EXISTS USP_SAVINGS_INTEREST_POST;
DELIMITER ;;
CREATE PROCEDURE USP_SAVINGS_INTEREST_POST(
    IN p_rows JSON,
    IN p_as_on DATE,
    IN p_posting_date DATE,
    IN p_remarks VARCHAR(250),
    IN p_mode TINYINT,         -- 1 single, 2 bulk
    IN p_branch_id INT,        -- NULL only for head-office users
    IN p_user_id INT
)
proc: BEGIN
    DECLARE v_req INT DEFAULT 0;
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_done TINYINT DEFAULT 0;
    DECLARE v_acc INT;
    DECLARE v_from DATE;
    DECLARE v_to DATE;
    DECLARE v_days INT;
    DECLARE v_product DECIMAL(18, 2);
    DECLARE v_roi DECIMAL(6, 3);
    DECLARE v_calc DECIMAL(14, 2);
    DECLARE v_amount DECIMAL(14, 2);
    DECLARE v_sb_id INT;
    DECLARE v_branch INT;
    DECLARE v_balance DECIMAL(14, 2);
    DECLARE v_trans_id INT;
    DECLARE v_trans_no VARCHAR(40);
    DECLARE v_batch_id INT;
    DECLARE v_batch_no VARCHAR(30);
    DECLARE v_gen_status VARCHAR(10);
    DECLARE v_gen_msg VARCHAR(255);
    DECLARE v_total_calc DECIMAL(14, 2) DEFAULT 0;
    DECLARE v_total_post DECIMAL(14, 2) DEFAULT 0;

    DECLARE cur CURSOR FOR
        SELECT r.account_id, t.from_date, t.to_date, t.days, IFNULL(t.product_amount, 0), t.roi,
               t.calculated_interest, r.amount
        FROM tmp_si_req r
        JOIN tmp_si_acc t ON t.account_id = r.account_id
        ORDER BY r.account_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_as_on IS NULL OR p_posting_date IS NULL OR p_as_on > CURDATE()
       OR p_posting_date < p_as_on OR p_posting_date > CURDATE() THEN
        SELECT 'ERROR' AS status, 'Posting date can''t be before the interest date' AS message;
        LEAVE proc;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_si_req;
    CREATE TEMPORARY TABLE tmp_si_req (
        account_id INT PRIMARY KEY,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        calculated DECIMAL(14, 2) NOT NULL,
        amount DECIMAL(14, 2) NOT NULL
    );

    SET v_req = JSON_LENGTH(p_rows);
    INSERT IGNORE INTO tmp_si_req (account_id, from_date, to_date, calculated, amount)
    SELECT j.account_id, j.from_date, j.to_date, j.calculated, j.amount
    FROM JSON_TABLE(p_rows, '$[*]' COLUMNS (
        account_id INT PATH '$.account_id',
        from_date DATE PATH '$.from_date',
        to_date DATE PATH '$.to_date',
        calculated DECIMAL(14, 2) PATH '$.calculated_interest',
        amount DECIMAL(14, 2) PATH '$.interest_amount'
    )) j;

    SELECT COUNT(*) INTO v_cnt FROM tmp_si_req;
    IF v_req = 0 OR v_cnt <> v_req OR v_cnt > 500 OR (p_mode = 1 AND v_cnt <> 1) THEN
        SELECT 'ERROR' AS status, 'Check the selected accounts and try again' AS message;
        LEAVE proc;
    END IF;

    SELECT COUNT(*) INTO v_cnt FROM tmp_si_req WHERE amount < 0;
    IF v_cnt > 0 THEN
        SELECT 'ERROR' AS status, 'Interest can''t be negative' AS message;
        LEAVE proc;
    END IF;

    SELECT COUNT(*) INTO v_cnt FROM tmp_si_req WHERE ABS(amount - calculated) >= 0.005;
    IF v_cnt > 0 AND NULLIF(TRIM(IFNULL(p_remarks, '')), '') IS NULL THEN
        SELECT 'ERROR' AS status, 'Add a reason for the changed interest' AS message;
        LEAVE proc;
    END IF;

    START TRANSACTION;

    -- lock every account's savings row so two users can't post the same period
    SELECT COUNT(*) INTO v_cnt
    FROM mst_deposit_account_sb sb
    JOIN tmp_si_req r ON r.account_id = sb.Account_Id
    FOR UPDATE;

    -- scope and eligibility
    SELECT COUNT(*) INTO v_cnt
    FROM tmp_si_req r
    JOIN mst_deposit_account a ON a.Account_Id = r.account_id
    WHERE a.Deposit_Type_Cd = 1 AND a.Closing_Date IS NULL AND IFNULL(a.Appl_Status_Cd, 1) <> 6
      AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id);
    IF v_cnt <> v_req THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, 'One or more accounts are not eligible or not in your branch' AS message;
        LEAVE proc;
    END IF;

    -- recalculate with the same routine the screen used
    DROP TEMPORARY TABLE IF EXISTS tmp_si_acc;
    CREATE TEMPORARY TABLE tmp_si_acc ( /* definition from 6.1 */ );
    INSERT INTO tmp_si_acc (account_id) SELECT account_id FROM tmp_si_req;
    CALL USP_SAVINGS_INTEREST_PREPARE(p_as_on);

    SELECT COUNT(*) INTO v_cnt
    FROM tmp_si_req r
    JOIN tmp_si_acc t ON t.account_id = r.account_id
    WHERE t.days <= 0 OR t.from_date <> r.from_date OR t.to_date <> r.to_date
       OR ABS(t.calculated_interest - r.calculated) > 0.01;
    IF v_cnt > 0 THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, CONCAT('Interest has changed for ', v_cnt, ' account(s). Calculate again.') AS message;
        LEAVE proc;
    END IF;

    CALL USP_CODE_SERIES_GENERATE('savings_interest', v_batch_no, v_gen_status, v_gen_msg);
    IF v_gen_status <> 'SUCCESS' THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, IFNULL(v_gen_msg, 'Batch number could not be generated') AS message;
        LEAVE proc;
    END IF;

    INSERT INTO trans_savings_interest_batch
        (Batch_No, Posting_Mode, As_On_Date, Posting_Date, Branch_Id, Remarks, Created_By, Created_At)
    VALUES
        (v_batch_no, p_mode, p_as_on, p_posting_date, p_branch_id, NULLIF(TRIM(IFNULL(p_remarks, '')), ''), p_user_id, NOW());
    SET v_batch_id = LAST_INSERT_ID();

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_acc, v_from, v_to, v_days, v_product, v_roi, v_calc, v_amount;
        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_trans_id = NULL;

        IF v_amount > 0 THEN
            SELECT sb.Id, sb.Current_Balance, a.Branch_Id
              INTO v_sb_id, v_balance, v_branch
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
                (v_acc, LEFT(v_trans_no, 40), p_posting_date, v_to, 'TR', 3, v_amount,
                 IFNULL(v_balance, 0) + v_amount,
                 LEFT(CONCAT('Interest ', DATE_FORMAT(v_from, '%d-%m-%Y'), ' to ', DATE_FORMAT(v_to, '%d-%m-%Y')), 75),
                 v_branch, LEFT(CONCAT('Batch ', v_batch_no), 250), NULL, 1,
                 p_user_id, NOW(), p_user_id, NOW());
            SET v_trans_id = LAST_INSERT_ID();

            UPDATE mst_deposit_account_sb
            SET Current_Balance = IFNULL(Current_Balance, 0) + v_amount,
                Available_Balance = IFNULL(Available_Balance, 0) + v_amount
            WHERE Id = v_sb_id;
        END IF;

        -- written even for 0 so the next period starts after v_to
        INSERT INTO trans_savings_interest
            (Batch_Id, Account_Id, From_Date, To_Date, Days, Product_Amount, RoI,
             Calculated_Amount, Posted_Amount, Sav_Trans_Id)
        VALUES
            (v_batch_id, v_acc, v_from, v_to, v_days, v_product, v_roi, v_calc, v_amount, v_trans_id);

        SET v_total_calc = v_total_calc + v_calc;
        SET v_total_post = v_total_post + v_amount;
    END LOOP;
    CLOSE cur;

    UPDATE trans_savings_interest_batch
    SET Account_Count = v_req, Calculated_Total = v_total_calc, Posted_Total = v_total_post
    WHERE Batch_Id = v_batch_id;

    COMMIT;

    SELECT 'SUCCESS' AS status, 'Interest posted' AS message,
           v_batch_id AS batch_id, v_batch_no AS batch_no, v_req AS posted_count, v_total_post AS total_interest;

    DROP TEMPORARY TABLE IF EXISTS tmp_si_acc;
    DROP TEMPORARY TABLE IF EXISTS tmp_si_req;
END ;;
DELIMITER ;
```

> Check the `USP_CODE_SERIES_GENERATE` OUT-parameter order and its success value against the existing definition (`USP_SAVINGS_TRANSACTION_ADD` calls it as `('savings_transaction', v_trans_no, v_gen_status, v_gen_msg)`).

---

## 7. Laravel 12 implementation

Reuse `App\Support\StoredProcedure` and `App\Exceptions\ProcedureException` from `docs/fd-settlement-api.md` (sections 15.2 and 15.3). Adapt the tenant connection name, the user fields (`id`, `branch_id`, `is_head`) and the auth middleware.

### 7.1 Controller — `app/Http/Controllers/Api/SavingsInterestController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ProcedureException;
use App\Http\Controllers\Controller;
use App\Http\Requests\SavingsInterestPostRequest;
use App\Services\SavingsVoucherService;
use App\Support\StoredProcedure as Sp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SavingsInterestController extends Controller
{
    /** Non-head users are always bound to their own branch, whatever the request says. */
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
            'as_on_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'account_id' => ['nullable', 'integer', 'min:1'],
            'scheme_id'  => ['nullable', 'integer', 'min:1'],
            'branch_id'  => ['nullable', 'integer', 'min:1'],
            'keyword'    => ['nullable', 'string', 'max:60'],
            'page'       => ['nullable', 'integer', 'min:1'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $page = (int) ($input['page'] ?? 1);
        $perPage = (int) ($input['per_page'] ?? 500);

        $sets = Sp::call('USP_SAVINGS_INTEREST_CALC', [
            $input['as_on_date'],
            $input['account_id'] ?? null,
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
            'message' => 'Interest calculated',
            'data'    => $sets[2] ?? [],
            'meta'    => [
                'total'     => $total,
                'page'      => $page,
                'per_page'  => $perPage,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    public function post(SavingsInterestPostRequest $request, SavingsVoucherService $vouchers): JsonResponse
    {
        $input = $request->validated();

        $sets = Sp::call('USP_SAVINGS_INTEREST_POST', [
            json_encode($input['rows'], JSON_THROW_ON_ERROR),
            $input['as_on_date'],
            $input['posting_date'],
            $input['remarks'] ?? null,
            $input['mode'] === 'bulk' ? 2 : 1,
            $this->branch($request),
            (int) $request->user()->id,
        ]);
        $row = Sp::expectSuccess($sets[0] ?? []);

        // Vouchers run after the interest is committed; a failure leaves Voucher_Id NULL for a retry.
        $pending = 0;
        foreach (array_unique(array_column($input['rows'], 'account_id')) as $accountId) {
            try {
                $vouchers->postMissing((int) $accountId);
            } catch (Throwable $e) {
                $pending++;
                Log::warning('Savings interest voucher failed', ['account_id' => $accountId, 'batch_id' => $row['batch_id'], 'error' => $e->getMessage()]);
            }
        }

        DB::connection('tenant')->table('trans_audit_log')->insert([/* module SavingsInterest, batch_id, user, ip, now */]);

        return response()->json([
            'success' => true,
            'message' => $pending > 0
                ? "Interest posted. Vouchers for {$pending} account(s) are pending."
                : 'Interest posted',
            'data' => [
                'batch_id'        => (int) $row['batch_id'],
                'batch_no'        => (string) $row['batch_no'],
                'posted_count'    => (int) $row['posted_count'],
                'total_interest'  => (float) $row['total_interest'],
                'voucher_pending' => $pending,
            ],
        ], 201);
    }
}
```

### 7.2 Request — `app/Http/Requests/SavingsInterestPostRequest.php`

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SavingsInterestPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'mode'                       => ['required', Rule::in(['single', 'bulk'])],
            'as_on_date'                 => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'posting_date'               => ['required', 'date_format:Y-m-d', 'after_or_equal:as_on_date', 'before_or_equal:today'],
            'remarks'                    => ['nullable', 'string', 'max:250'],
            'branch_id'                  => ['nullable', 'integer', 'min:1'],
            'rows'                       => ['required', 'array', 'min:1', 'max:500'],
            'rows.*.account_id'          => ['required', 'integer', 'min:1', 'distinct'],
            'rows.*.from_date'           => ['required', 'date_format:Y-m-d'],
            'rows.*.to_date'             => ['required', 'date_format:Y-m-d', 'after_or_equal:rows.*.from_date', 'before_or_equal:as_on_date'],
            'rows.*.calculated_interest' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'rows.*.interest_amount'     => ['required', 'numeric', 'decimal:0,2', 'min:0', 'max:99999999.99'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->input('mode') === 'single' && count((array) $this->input('rows')) !== 1) {
                    $validator->errors()->add('rows', 'Single posting takes one account');
                }
            },
        ];
    }
}
```

### 7.3 Vouchers

Savings vouchers are already posted by the logic behind `POST /api/SavingsTransactionVoucherPost` (it posts every transaction of an account that still has `Voucher_Id IS NULL`). Move that logic into `App\Services\SavingsVoucherService::postMissing(int $accountId)` if it isn't already, and call it from both places.

For `Trans_Type_Cd = 3` the voucher must be:

| Line | Ledger | Amount |
| --- | --- | --- |
| Debit | Interest expense — `mst_deposit_scheme.Intt_Ledg` | interest |
| Credit | Savings deposit — `mst_deposit_scheme.Prn_Ledger` (sub-ledger = account) | interest |

Make sure the voucher configuration used by `USP_SAVINGS_TRANSACTION_ADD` (`Voucher_Type = p_trans_type_cd AND Is_Active = 1`) has an active row for type 3. For very large bulk runs you can instead post **one voucher per scheme** for the batch (sum of `Posted_Amount`), then set `Voucher_Id` on all the batch's transactions.

### 7.4 Routes — `routes/api.php`

```php
use App\Http\Controllers\Api\SavingsInterestController;

Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    Route::get('SavingsInterestCalculate', [SavingsInterestController::class, 'calculate']);
    Route::post('SavingsInterestPost', [SavingsInterestController::class, 'post'])->middleware('throttle:30,1');
});
```

---

## 8. Quick API checks

```bash
# Single: one account up to 30 Sep
curl -s "$API/api/SavingsInterestCalculate?as_on_date=2026-09-30&account_id=501" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"

# Bulk: one scheme
curl -s "$API/api/SavingsInterestCalculate?as_on_date=2026-09-30&scheme_id=3" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"

# Post (use the from/to/calculated values returned above)
curl -s -X POST "$API/api/SavingsInterestPost" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"mode":"single","as_on_date":"2026-09-30","posting_date":"2026-10-01","rows":[{"account_id":501,"from_date":"2026-07-01","to_date":"2026-09-30","calculated_interest":45.21,"interest_amount":45.21}]}'

# Post the same body again — must fail with "Interest has changed … Calculate again."
```

---

## 9. What the screen does with each response

| Response | Screen |
| --- | --- |
| Calculate 200 (single, `days > 0`) | One editable row, totals and *Post interest* |
| Calculate 200 (single, `days = 0`) | "Interest is already posted up to {date}" and no Post button |
| Calculate 200 (bulk) | Editable rows, all selected; select/clear all; client-side paging |
| Calculate `meta.total` > rows returned | Amber note: post these, then load again or narrow the filters |
| Post 201 | Success toast with count, total and batch no.; the list recalculates (posted accounts drop out) |
| 422 | Error toast with the message |
| 401 | Session cleared by the BFF, user sent to login |

---

## 10. Test checklist

- [ ] Account opened mid-period: interest starts on `Start_Date`, not before.
- [ ] Daily product: a deposit on day 10 of a 30-day period counts only from day 10; a withdrawal reduces the following days.
- [ ] Several transactions on one day: only the day-end balance counts.
- [ ] Monthly Product scheme (`test 2`, 12%), ₹500 since 12 Oct, as on 3 Nov: period 12–31 Oct, product 500, interest ₹5.00, prefilled in the amount box.
- [ ] Monthly Product, as on 20 Oct for that account: nothing due yet (`days = 0`) because October isn't complete.
- [ ] Monthly Product: a withdrawal on the 15th lowers that month's product; a deposit on the 15th doesn't raise it.
- [ ] Daily Product scheme with the same account: ₹3.29.
- [ ] Account whose opening deposit isn't in `trans_savings_transaction`: uses `Opening_Deposit`, not 0.
- [ ] With `v_min_rule = 1`, balance below the scheme minimum earns nothing; with `0` (default) it earns normally.
- [ ] Account with `RoI = 0` uses the scheme rate.
- [ ] *Stop Interest* (status 6) and closed accounts never appear and can't be posted.
- [ ] Single: already posted up to `as_on_date` → `days = 0`, no post possible.
- [ ] Changed amount without remarks → 422. With remarks → posts the changed amount and stores both amounts.
- [ ] Amount 0 posts no transaction but still moves the next period's start date.
- [ ] Two users post the same accounts at the same time: one succeeds, the other gets "Calculate again".
- [ ] A transaction added between Calculate and Post changes the interest → "Calculate again".
- [ ] Non-head user can't calculate or post another branch's account, even with a forged `branch_id`.
- [ ] Balance after posting = old balance + interest, in both `Current_Balance` and the transaction's `Balance_After`.
- [ ] Voucher created for every interest transaction (Dr interest expense, Cr savings deposit).
- [ ] Bulk with more than 500 due accounts: first 500 shown, note displayed, the rest load after posting.
