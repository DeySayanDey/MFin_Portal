# Term Deposit Settlement — Backend API Guide

Source of truth: `priomicro_basundhara.sql` (tenant schema). Screens: `/deposits/fd-settlement` (search, pending approval, settled) and `/deposits/fd-settlement/{accountNo}` (settlement workspace, or a read-only view for settled, closed, lien and KYC-restricted accounts — see section 17).

**Implementation order for the backend:** section 3 (table + settings) → section 16 (all procedures) → section 15 (Laravel routes, helper, controller) → section 14 (tests).

The browser only calls the Next.js BFF. The BFF validates the input, binds the branch to the session, and calls these Laravel endpoints with the user's Bearer token.

| BFF route (Next.js) | Laravel endpoint | Method | Stored procedure | Status |
| --- | --- | --- | --- | --- |
| `GET /api/deposits/fd-settlement/accounts` | `/api/TdSettlementAccountList` | GET | `USP_TD_SETTLEMENT_ACCOUNT_LIST` | **new** |
| `GET /api/deposits/fd-settlement/account` | `/api/TdSettlementAccountGet` | GET | `USP_TD_SETTLEMENT_ACCOUNT_LIST` + `USP_TD_SETTLEMENT_LIST` | **new** |
| `GET /api/deposits/fd-settlement/calculate` | `/api/TdSettlementCalculate` | GET | `USP_TD_SETTLEMENT_CALC` | **new** |
| `GET /api/deposits/fd-settlement` | `/api/TdSettlementList` | GET | `USP_TD_SETTLEMENT_LIST` | **new** |
| `POST /api/deposits/fd-settlement` (multipart) | `/api/TdSettlementSave` | POST (multipart) | `USP_TD_SETTLEMENT_SAVE` | **new** |
| `POST /api/deposits/fd-settlement/actions` `approve` / `reject` | `/api/TdSettlementApprove` | POST | `USP_TD_SETTLEMENT_APPROVE` | **new** |
| `POST /api/deposits/fd-settlement/actions` `post` | `/api/TdSettlementPost` | POST | `USP_TD_SETTLEMENT_POST` | **new** |

Frontend files: `src/features/deposits/fd-settlement/` (schemas, mappers, services). Endpoint constants: `endpoints.tdSettlement` in `src/lib/api/endpoints.ts`.

---

## 1. Workflow

```
Search account ──► Calculate ──► Save draft (1) ──► Submit (2 Pending)
                                                      │
                                     Reject (4) ◄─────┤ checker
                                        │             ▼
                              maker corrects     Approve (3)
                              and resubmits           │
                                                      ▼
                                                 Post (5 Settled)
                                                 voucher + account closed
```

- Nothing touches the ledger before **Post**.
- One open request per account (status 1–4). Saving again updates the same row.
- The quote is always **recalculated on the server** on Submit and again on Post. The client amount is only compared, never trusted.

---

## 2. Code tables

| Field | Codes |
| --- | --- |
| `settlement_type_cd` | 1 Maturity, 2 Premature |
| `reason_cd` | 1 Customer request, 2 Financial requirement, 3 Other |
| `pay_mode_cd` (option group 41) | 1 Cash, 2 Bank cheque, 3 Bank transfer (NEFT/RTGS), 4 S/B account |
| `status_cd` (settlement) | 1 Draft, 2 Pending, 3 Approved, 4 Rejected, 5 Settled |
| `op_mode_cd` (option group 9) | 1 Single, 2 Jointly, 3 Either or survivor, 4 Any 2 or 3, 5 Authorised signatory |
| `scheme_type` (from `mst_deposit_scheme.Prod_Type_Cd`, group 6) | `FD` = 3, `MIS` = 5, `OTHER` = 1, 2, 4 |
| `account_status` (computed) | `active`, `matured`, `closed`, `settled` |
| `kyc_status` (computed) | `verified`, `due`, `restricted` |
| `restriction` (computed) | `lien`, `settled`, `kyc`, or `null` |

---

## 3. Tables and settings

### New table `trans_td_settlement`

```sql
CREATE TABLE `trans_td_settlement` (
  `Settlement_Id` bigint NOT NULL AUTO_INCREMENT,
  `Settlement_No` varchar(40) DEFAULT NULL,
  `Account_Id` int NOT NULL,
  `Branch_Id` smallint NOT NULL,
  `Settlement_Type_Cd` tinyint NOT NULL,
  `Settlement_Date` date NOT NULL,
  `Reason_Cd` tinyint NOT NULL,
  `Remarks` varchar(250) DEFAULT NULL,
  `Pay_Mode_Cd` tinyint DEFAULT NULL,
  `SBCredit_AcId` int DEFAULT NULL,
  `Beneficiary_Account` varchar(30) DEFAULT NULL,
  `Beneficiary_Name` varchar(100) DEFAULT NULL,
  `IFSC` varchar(11) DEFAULT NULL,
  `Cheque_Ref` varchar(30) DEFAULT NULL,
  `Principal_Amount` decimal(12,2) DEFAULT NULL,
  `Interest_Amount` decimal(12,2) DEFAULT NULL,
  `Overdue_Interest` decimal(12,2) DEFAULT NULL,
  `Interest_Recovery` decimal(12,2) DEFAULT NULL,
  `Penalty_Amount` decimal(12,2) DEFAULT NULL,
  `TDS_Amount` decimal(12,2) DEFAULT NULL,
  `Other_Deductions` decimal(12,2) DEFAULT NULL,
  `Net_Payable` decimal(12,2) DEFAULT NULL,
  `Quote_Id` varchar(60) DEFAULT NULL,
  `Document_Name` varchar(150) DEFAULT NULL,
  `Document_Path` varchar(255) DEFAULT NULL,
  `Status_Cd` tinyint NOT NULL DEFAULT '1',
  `Rejection_Reason` varchar(250) DEFAULT NULL,
  `Close_Id` int DEFAULT NULL,
  `Voucher_Id` bigint DEFAULT NULL,
  `Receipt_No` varchar(40) DEFAULT NULL,
  `Created_By` smallint NOT NULL,
  `Created_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_By` smallint DEFAULT NULL,
  `Updated_At` datetime DEFAULT NULL,
  `Approved_By` smallint DEFAULT NULL,
  `Approved_At` datetime DEFAULT NULL,
  `Posted_By` smallint DEFAULT NULL,
  `Posted_At` datetime DEFAULT NULL,
  PRIMARY KEY (`Settlement_Id`),
  UNIQUE KEY `uk_td_settlement_no` (`Settlement_No`),
  KEY `idx_td_settlement_account` (`Account_Id`, `Status_Cd`),
  KEY `idx_td_settlement_branch` (`Branch_Id`, `Status_Cd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Existing tables used

| Table | Used for |
| --- | --- |
| `mst_deposit_account` | `Deposit_Type_Cd = 2` (term deposit), holder, `Op_Mode_Cd`, `Branch_Id`, `Appl_Status_Cd` (4 Freezed, 7 KYC pending), `Closing_Date` / `Closing_Reason` |
| `mst_deposit_account_td` | `Account_No`, `Ref_AcNo`, `Start_Date`, `Period_YY/MM`, `RoI`, `Inst_Amount` (principal), `Maturity_Date`, `Maturity_Amt`, `Intt_Payable_Amt`, `SBCredit_AcId`, `TDS_Deduct`, `Current_Balance` |
| `mst_deposit_scheme` | `Scheme_Name`, `Scheme_Code`, `Prod_Type_Cd`, `Prn_Ledger` (principal GL), `Intt_Ledg` (interest GL) |
| `mst_deposit_scheme_charges` + `mst_deposit_charges` Id 2 | "Premature Withdrawal Penalty". `Charge_Rate` = rate cut in % points for premature closure |
| `mst_loan_application_deposit_freeze` | Active lien: `Deposit_Account_Id`, `Freeze_Status_Cd = 1` |
| `mst_member` / `mst_member_kyc` / `mst_group` | Holder name, `Ref_Code`, `KYC_Verified` |
| `mst_deposit_account_sb` + `trans_savings_transaction` | Credit to the linked savings account (pay mode 4) |
| `mst_deposit_account_close` | Closure record written on Post |
| `trans_vouchers` / `trans_voucher_details` | Settlement voucher (through `USP_LOAN_VOUCHER_RESET` / `USP_LOAN_VOUCHER_POST`) |
| `priomicro_core.mst_org_branch` | Branch name |

### Settings to add

| Where | Value |
| --- | --- |
| `mst_code_series` | `td_settlement` (prefix `TDS-`) and `td_settlement_receipt` (prefix `TDR-`) |
| `mst_settings_global` (4 new rows) | TDS payable ledger, TDS rate, premature penalty income ledger, overdue interest rate (0 = none). This guide calls them **900, 901, 902, 903**. Use the next free Ids and replace them in the procedures. `Value` is a `smallint`, so store **rates × 100** (`1000` = 10.00 %, `350` = 3.50 %). |
| `mst_settings_maker_checker` | New row for term deposit settlement (for example `Voucher_Type = 3`): checker roles, dual authorisation |

---

## 4. Common rules for every endpoint

- Auth: `auth:sanctum` (or the existing guard). Resolve the tenant schema from the token, never from the request.
- Pass `p_user_id`, `p_user_branch_id`, `p_user_is_head` from the logged-in user. Never from the body.
- The BFF sends `branch_id` for non-head users. Laravel must **still** check it: a non-head user may only see and act on accounts and requests where `Branch_Id = user branch`. Return 403 (or 422) otherwise.
- Procedures return `status` = `SUCCESS` / `ERROR` and `message`. Map `ERROR` to HTTP 422 with the message. The BFF shows it to the user, so keep messages short and plain.
- Paginated lists: first result set is the rows, `meta` comes from a total count. Max `per_page` 100.
- Envelope:

```json
{ "success": true, "message": "…", "data": { }, "meta": { "total": 42, "page": 1, "per_page": 20, "last_page": 3 } }
```

```json
{ "success": false, "message": "Calculate the settlement again. The amount has changed.", "errors": { "net_payable": ["…"] } }
```

- Save, Approve and Post return `data` as **one request row** (section 5.3).
- Write a row to `trans_audit_log` (module `TdSettlement`) for Save, Approve, Reject and Post.
- Run Save, Approve and Post inside `DB::transaction` and lock the request row (`SELECT … FOR UPDATE`) so two users cannot approve or post the same request.

---

## 5. Response shapes

### 5.1 Account row (`TdSettlementAccountList` items and `TdSettlementAccountGet.account`)

```json
{
  "account_id": 10,
  "account_no": "DS-0004/00001",
  "cust_id": 9041,
  "cust_ref_code": "M-0012",
  "holder_name": "Rahul Sharma",
  "kyc_status": "verified",
  "op_mode_cd": 1,
  "branch_id": 2,
  "branch_name": "Salt Lake",
  "scheme_type": "FD",
  "scheme_name": "Fixed Deposit 12M",
  "account_status": "matured",
  "principal_amount": 100000.00,
  "roi": 7.25,
  "start_date": "2025-10-01",
  "maturity_date": "2026-10-01",
  "period_months": 12,
  "payout_type": "cumulative",
  "eligible": 1,
  "restriction": null,
  "permitted_types": "1",
  "payment_methods": "1,2,3,4",
  "sb_account_id": 17,
  "sb_account_no": "SB/00001",
  "sb_holder_name": "Rahul Sharma",
  "mis": null
}
```

- `permitted_types` and `payment_methods` may be a CSV string or an array of codes.
- `mis` is only for `scheme_type = MIS`: `{ "monthly_interest", "last_paid_date", "total_interest_paid", "unpaid_installments", "pending_interest", "recoverable_excess" }`. The dump has no MIS payout history table yet. Return `null` until one exists.

### 5.2 Quote (`TdSettlementCalculate`)

```json
{
  "quote_id": "Q-7F3A9C21B0",
  "valid_till": "2026-11-03",
  "principal_amount": 100000.00,
  "interest_amount": 7250.00,
  "overdue_interest": 0.00,
  "interest_recovery": 0.00,
  "penalty_amount": 0.00,
  "tds_amount": 725.00,
  "other_deductions": 0.00,
  "net_payable": 106525.00
}
```

`net_payable = principal + interest + overdue − recovery − penalty − tds − other`. The screen shows every non-zero line.

### 5.3 Request row (`TdSettlementList` items, open/settled request, Save/Approve/Post result)

All quote fields from 5.2, plus:

```json
{
  "settlement_id": 5,
  "settlement_no": "TDS-00005",
  "account_id": 10,
  "account_no": "DS-0004/00001",
  "holder_name": "Rahul Sharma",
  "branch_name": "Salt Lake",
  "status_cd": 2,
  "settlement_type_cd": 1,
  "settlement_date": "2026-11-03",
  "reason_cd": 1,
  "remarks": "Customer request",
  "pay_mode_cd": 4,
  "beneficiary_account": "SB/00001",
  "beneficiary_name": "Rahul Sharma",
  "ifsc": null,
  "cheque_ref": null,
  "document_name": "request.pdf",
  "rejection_reason": null,
  "receipt_no": null
}
```

Never return `Document_Path` or any storage path.

---

## 6. GET `/api/TdSettlementAccountList`

Query (all optional): `page`, `per_page`, `scheme_type` (`FD`/`MIS`/`OTHER`), `keyword` (account no, customer ref, name), `branch_id`, `account_status` (CSV, e.g. `active,matured`).

```php
$data = $request->validate([
    'page'           => 'nullable|integer|min:1',
    'per_page'       => 'nullable|integer|min:1|max:100',
    'scheme_type'    => 'nullable|in:FD,MIS,OTHER',
    'keyword'        => 'nullable|string|max:50',
    'branch_id'      => 'nullable|integer|min:1',
    'account_status' => ['nullable', 'regex:/^(active|matured|closed|settled)(,(active|matured|closed|settled))*$/'],
]);
$branchId = $user->is_head ? ($data['branch_id'] ?? null) : $user->branch_id;

$pdo  = DB::connection('tenant')->getPdo();
$stmt = $pdo->prepare('CALL USP_TD_SETTLEMENT_ACCOUNT_LIST(?,?,?,?,?,?,?)');
$stmt->execute([null, $data['scheme_type'] ?? null, $data['keyword'] ?? null, $branchId,
                $data['account_status'] ?? null, $data['page'] ?? 1, $data['per_page'] ?? 20]);
$meta = $stmt->fetch(PDO::FETCH_ASSOC);           // total
$stmt->nextRowset();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

```sql
DELIMITER ;;
CREATE PROCEDURE `USP_TD_SETTLEMENT_ACCOUNT_LIST`(
    IN p_account_id INT,
    IN p_scheme_type VARCHAR(5),
    IN p_keyword VARCHAR(50),
    IN p_branch_id INT,
    IN p_account_status VARCHAR(50),
    IN p_page INT,
    IN p_per_page INT
)
BEGIN
    DECLARE v_per_page INT DEFAULT LEAST(GREATEST(IFNULL(p_per_page, 20), 1), 100);
    DECLARE v_offset INT DEFAULT (GREATEST(IFNULL(p_page, 1), 1) - 1) * LEAST(GREATEST(IFNULL(p_per_page, 20), 1), 100);
    DECLARE v_kw VARCHAR(52) DEFAULT CONCAT('%', NULLIF(TRIM(IFNULL(p_keyword, '')), ''), '%');

    DROP TEMPORARY TABLE IF EXISTS tmp_td_settle_acc;
    CREATE TEMPORARY TABLE tmp_td_settle_acc AS
    SELECT
        a.Account_Id AS account_id,
        COALESCE(NULLIF(td.Ref_AcNo, ''), CONCAT(s.Scheme_Code, '/', LPAD(td.Account_No, 5, '0'))) AS account_no,
        a.Cust_Id_Primay AS cust_id,
        COALESCE(m.Ref_Code, m.Member_Code, g.Ref_Code, g.Group_Code) AS cust_ref_code,
        COALESCE(NULLIF(a.Holder_Name, ''), m.Member_Name, g.Group_Name) AS holder_name,
        CASE
            WHEN a.Appl_Status_Cd = 7 THEN 'restricted'
            WHEN a.Cust_Type_Cd = 2 AND NOT EXISTS (
                SELECT 1 FROM mst_member_kyc k WHERE k.Member_Id = a.Cust_Id_Primay AND k.KYC_Verified = 1
            ) THEN 'due'
            ELSE 'verified'
        END AS kyc_status,
        a.Op_Mode_Cd AS op_mode_cd,
        a.Branch_Id AS branch_id,
        b.Branch_Name AS branch_name,
        CASE s.Prod_Type_Cd WHEN 3 THEN 'FD' WHEN 5 THEN 'MIS' ELSE 'OTHER' END AS scheme_type,
        s.Scheme_Name AS scheme_name,
        CASE
            WHEN a.Closing_Date IS NOT NULL AND st.Settlement_Id IS NOT NULL THEN 'settled'
            WHEN a.Closing_Date IS NOT NULL THEN 'closed'
            WHEN td.Maturity_Date <= CURDATE() THEN 'matured'
            ELSE 'active'
        END AS account_status,
        td.Inst_Amount AS principal_amount,
        td.RoI AS roi,
        td.Start_Date AS start_date,
        td.Maturity_Date AS maturity_date,
        IFNULL(td.Period_YY, 0) * 12 + IFNULL(td.Period_MM, 0) AS period_months,
        IF(s.Prod_Type_Cd = 5, 'periodic', 'cumulative') AS payout_type,
        CASE
            WHEN a.Closing_Date IS NOT NULL THEN 'settled'
            WHEN a.Appl_Status_Cd = 4 OR EXISTS (
                SELECT 1 FROM mst_loan_application_deposit_freeze f
                WHERE f.Deposit_Account_Id = a.Account_Id AND f.Freeze_Status_Cd = 1
            ) THEN 'lien'
            WHEN a.Appl_Status_Cd = 7 THEN 'kyc'
            ELSE NULL
        END AS restriction,
        IF(td.Maturity_Date <= CURDATE(), '1', '2') AS permitted_types,
        IF(td.SBCredit_AcId IS NULL, '1,2,3', '1,2,3,4') AS payment_methods,
        td.SBCredit_AcId AS sb_account_id,
        COALESCE(NULLIF(sb.Ref_AcNo, ''), CONCAT(ss.Scheme_Code, '/', LPAD(sb.Account_No, 5, '0'))) AS sb_account_no,
        sba.Holder_Name AS sb_holder_name
    FROM mst_deposit_account a
    JOIN mst_deposit_account_td td ON td.Account_Id = a.Account_Id
    JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
    LEFT JOIN mst_member m ON a.Cust_Type_Cd = 2 AND m.Member_Id = a.Cust_Id_Primay
    LEFT JOIN mst_group g ON a.Cust_Type_Cd = 1 AND g.Group_Id = a.Cust_Id_Primay
    LEFT JOIN priomicro_core.mst_org_branch b ON b.Branch_Id = a.Branch_Id
    LEFT JOIN trans_td_settlement st ON st.Account_Id = a.Account_Id AND st.Status_Cd = 5
    LEFT JOIN mst_deposit_account sba ON sba.Account_Id = td.SBCredit_AcId
    LEFT JOIN mst_deposit_account_sb sb ON sb.Account_Id = td.SBCredit_AcId
    LEFT JOIN mst_deposit_scheme ss ON ss.Scheme_Id = sba.Scheme_Id
    WHERE a.Deposit_Type_Cd = 2
      AND (p_account_id IS NULL OR a.Account_Id = p_account_id)
      AND (p_branch_id IS NULL OR a.Branch_Id = p_branch_id)
      AND (v_kw IS NULL
           OR td.Ref_AcNo LIKE v_kw OR CAST(td.Account_No AS CHAR) LIKE v_kw
           OR CONCAT(s.Scheme_Code, '/', LPAD(td.Account_No, 5, '0')) LIKE v_kw
           OR a.Holder_Name LIKE v_kw OR m.Ref_Code LIKE v_kw OR m.Member_Code LIKE v_kw
           OR m.Member_Name LIKE v_kw OR g.Group_Name LIKE v_kw);

    -- eligible = no restriction
    SELECT COUNT(*) AS total FROM tmp_td_settle_acc
    WHERE (p_scheme_type IS NULL OR scheme_type = p_scheme_type)
      AND (p_account_status IS NULL OR FIND_IN_SET(account_status, p_account_status));

    SELECT t.*, IF(t.restriction IS NULL, 1, 0) AS eligible
    FROM tmp_td_settle_acc t
    WHERE (p_scheme_type IS NULL OR t.scheme_type = p_scheme_type)
      AND (p_account_status IS NULL OR FIND_IN_SET(t.account_status, p_account_status))
    ORDER BY t.maturity_date, t.account_id
    LIMIT v_offset, v_per_page;

    DROP TEMPORARY TABLE IF EXISTS tmp_td_settle_acc;
END ;;
DELIMITER ;
```

> Use the same account number format as `full_account_no` in `SavingsTransactionList` so both screens match. The `CONCAT(Scheme_Code, '/', …)` above is only a fallback.

---

## 7. GET `/api/TdSettlementAccountGet`

Query: `account_id` (required), `branch_id` (sent by the BFF for non-head users).

1. `CALL USP_TD_SETTLEMENT_ACCOUNT_LIST(:account_id, NULL, NULL, :branch, NULL, 1, 1)` and take the first row. No row → 404 `Deposit account not found`.
2. Open request: `CALL USP_TD_SETTLEMENT_LIST(NULL, :account_id, NULL, '1,2,3,4', 1, 1)` → first row or `null`.
3. Settled request: `CALL USP_TD_SETTLEMENT_LIST(NULL, :account_id, NULL, '5', 1, 1)` → first row or `null`.

```json
{ "success": true, "message": "OK", "data": { "account": { }, "open_request": null, "settled_request": null } }
```

The screen opens in read-only mode when `open_request.status_cd` is 2, 3 or 5, and in edit mode for 1 (Draft) and 4 (Rejected).

---

## 8. GET `/api/TdSettlementCalculate`

Query: `account_id`, `settlement_type_cd` (1/2), `settlement_date` (`Y-m-d`), `branch_id`.

```php
$data = $request->validate([
    'account_id'         => 'required|integer|min:1',
    'settlement_type_cd' => 'required|in:1,2',
    'settlement_date'    => 'required|date_format:Y-m-d',
]);
```

The calculation lives in one internal procedure, `USP_TD_SETTLEMENT_QUOTE`, which Calculate, Save and Post all call. That keeps the amount identical everywhere.

```sql
DELIMITER ;;
CREATE PROCEDURE `USP_TD_SETTLEMENT_QUOTE`(
    IN p_account_id INT,
    IN p_type_cd TINYINT,
    IN p_date DATE,
    OUT o_principal DECIMAL(12,2),
    OUT o_interest DECIMAL(12,2),
    OUT o_overdue DECIMAL(12,2),
    OUT o_recovery DECIMAL(12,2),
    OUT o_penalty DECIMAL(12,2),
    OUT o_tds DECIMAL(12,2),
    OUT o_other DECIMAL(12,2),
    OUT o_net DECIMAL(12,2),
    OUT o_err VARCHAR(255)
)
BEGIN
    DECLARE v_start DATE; DECLARE v_maturity DATE; DECLARE v_closing DATE;
    DECLARE v_roi DECIMAL(5,2); DECLARE v_mat_amt DECIMAL(12,2); DECLARE v_tds_flag TINYINT;
    DECLARE v_scheme INT; DECLARE v_days INT; DECLARE v_pen_rate DECIMAL(8,2) DEFAULT 0;
    DECLARE v_tds_rate DECIMAL(5,2) DEFAULT 0; DECLARE v_od_rate DECIMAL(5,2) DEFAULT 0;
    DECLARE v_paid DECIMAL(12,2) DEFAULT 0;

    SET o_err = NULL; SET o_overdue = 0; SET o_recovery = 0; SET o_penalty = 0; SET o_other = 0;

    SELECT td.Start_Date, td.Maturity_Date, a.Closing_Date, td.RoI, td.Inst_Amount, td.Maturity_Amt,
           IFNULL(td.TDS_Deduct, 0), a.Scheme_Id
    INTO v_start, v_maturity, v_closing, v_roi, o_principal, v_mat_amt, v_tds_flag, v_scheme
    FROM mst_deposit_account a JOIN mst_deposit_account_td td ON td.Account_Id = a.Account_Id
    WHERE a.Account_Id = p_account_id AND a.Deposit_Type_Cd = 2;

    IF v_start IS NULL THEN SET o_err = 'Deposit account not found';
    ELSEIF v_closing IS NOT NULL THEN SET o_err = 'This account is already closed';
    ELSEIF p_date > CURDATE() THEN SET o_err = 'Settlement date cannot be in the future';
    ELSEIF p_date < v_start THEN SET o_err = 'Settlement date cannot be before the start date';
    ELSEIF p_type_cd = 1 AND p_date < v_maturity THEN SET o_err = 'The deposit has not matured. Use premature closure.';
    ELSEIF p_type_cd = 2 AND p_date >= v_maturity THEN SET o_err = 'The deposit has matured. Use maturity settlement.';
    END IF;
    IF o_err IS NOT NULL THEN SET o_net = NULL; ELSE

    -- Settings 901 = TDS rate %, 903 = overdue interest rate % (see section 3)
    SELECT IFNULL(MAX(Value), 0) / 100 INTO v_tds_rate FROM mst_settings_global WHERE Id = 901;
    SELECT IFNULL(MAX(Value), 0) / 100 INTO v_od_rate  FROM mst_settings_global WHERE Id = 903;
    SELECT IFNULL(MAX(c.Charge_Rate), 0) INTO v_pen_rate
    FROM mst_deposit_scheme_charges sc JOIN mst_deposit_charges c ON c.Charge_Id = sc.Charges_Id
    WHERE sc.Scheme_Id = v_scheme AND sc.Charges_Id = 2 AND sc.Is_Active = 1 AND c.Is_Active = 1;

    -- Interest already paid out (MIS). Replace with the MIS payout table when it exists.
    SET v_paid = 0;

    IF p_type_cd = 1 THEN
        SET o_interest = GREATEST(v_mat_amt - o_principal, 0);
        SET v_days = DATEDIFF(p_date, v_maturity);
        SET o_overdue = ROUND(o_principal * v_od_rate / 100 * v_days / 365, 2);
    ELSE
        SET v_days = DATEDIFF(p_date, v_start);
        SET o_interest = ROUND(o_principal * v_roi / 100 * v_days / 365, 2);
        SET o_penalty  = ROUND(o_principal * LEAST(v_pen_rate, v_roi) / 100 * v_days / 365, 2);
    END IF;

    -- Interest paid beyond what is now earned is recovered
    SET o_recovery = GREATEST(v_paid - (o_interest - o_penalty), 0);
    SET o_interest = GREATEST(o_interest - v_paid, 0);
    SET o_tds = IF(v_tds_flag = 1, ROUND((o_interest + o_overdue - o_penalty) * v_tds_rate / 100, 2), 0);
    SET o_tds = GREATEST(o_tds, 0);
    SET o_net = o_principal + o_interest + o_overdue - o_recovery - o_penalty - o_tds - o_other;
    IF o_net < 0 THEN SET o_err = 'Deductions are more than the deposit value. Contact head office.'; END IF;
    END IF;
END ;;

CREATE PROCEDURE `USP_TD_SETTLEMENT_CALC`(
    IN p_account_id INT, IN p_type_cd TINYINT, IN p_date DATE, IN p_branch_id INT
)
BEGIN
    DECLARE p DECIMAL(12,2); DECLARE i DECIMAL(12,2); DECLARE od DECIMAL(12,2); DECLARE r DECIMAL(12,2);
    DECLARE pen DECIMAL(12,2); DECLARE tds DECIMAL(12,2); DECLARE oth DECIMAL(12,2); DECLARE net DECIMAL(12,2);
    DECLARE err VARCHAR(255);

    IF p_branch_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM mst_deposit_account WHERE Account_Id = p_account_id AND Branch_Id = p_branch_id
    ) THEN
        SET err = 'Deposit account not found';
    ELSE
        CALL USP_TD_SETTLEMENT_QUOTE(p_account_id, p_type_cd, p_date, p, i, od, r, pen, tds, oth, net, err);
    END IF;

    IF err IS NOT NULL THEN
        SELECT 'ERROR' AS status, err AS message;
    ELSE
        SELECT 'SUCCESS' AS status, 'Settlement calculated' AS message,
               CONCAT('Q-', UPPER(LEFT(SHA2(CONCAT_WS('|', p_account_id, p_type_cd, p_date, net), 256), 10))) AS quote_id,
               p_date AS valid_till,
               p AS principal_amount, i AS interest_amount, od AS overdue_interest, r AS interest_recovery,
               pen AS penalty_amount, tds AS tds_amount, oth AS other_deductions, net AS net_payable;
    END IF;
END ;;
DELIMITER ;
```

Return the row (without `status`) as `data`. The quote is valid only for the chosen date, so `valid_till = settlement_date`.

---

## 9. GET `/api/TdSettlementList`

Query (all optional): `page`, `per_page`, `status_cd` (CSV; the screen sends `2,3,4` for "Pending approval" and `5` for "Settled"), `branch_id`.

```sql
DELIMITER ;;
CREATE PROCEDURE `USP_TD_SETTLEMENT_LIST`(
    IN p_settlement_id BIGINT,
    IN p_account_id INT,
    IN p_branch_id INT,
    IN p_status_csv VARCHAR(20),
    IN p_page INT,
    IN p_per_page INT
)
BEGIN
    DECLARE v_per_page INT DEFAULT LEAST(GREATEST(IFNULL(p_per_page, 20), 1), 100);
    DECLARE v_offset INT DEFAULT (GREATEST(IFNULL(p_page, 1), 1) - 1) * LEAST(GREATEST(IFNULL(p_per_page, 20), 1), 100);

    SELECT COUNT(*) AS total
    FROM trans_td_settlement st
    WHERE (p_settlement_id IS NULL OR st.Settlement_Id = p_settlement_id)
      AND (p_account_id IS NULL OR st.Account_Id = p_account_id)
      AND (p_branch_id IS NULL OR st.Branch_Id = p_branch_id)
      AND (p_status_csv IS NULL OR FIND_IN_SET(st.Status_Cd, p_status_csv));

    SELECT
        st.Settlement_Id AS settlement_id, st.Settlement_No AS settlement_no, st.Account_Id AS account_id,
        COALESCE(NULLIF(td.Ref_AcNo, ''), CONCAT(s.Scheme_Code, '/', LPAD(td.Account_No, 5, '0'))) AS account_no,
        a.Holder_Name AS holder_name, b.Branch_Name AS branch_name,
        st.Status_Cd AS status_cd, st.Settlement_Type_Cd AS settlement_type_cd, st.Settlement_Date AS settlement_date,
        st.Reason_Cd AS reason_cd, st.Remarks AS remarks, st.Pay_Mode_Cd AS pay_mode_cd,
        CASE WHEN st.Pay_Mode_Cd = 4
             THEN COALESCE(NULLIF(sb.Ref_AcNo, ''), CONCAT(ss.Scheme_Code, '/', LPAD(sb.Account_No, 5, '0')))
             ELSE st.Beneficiary_Account END AS beneficiary_account,
        st.Beneficiary_Name AS beneficiary_name, st.IFSC AS ifsc, st.Cheque_Ref AS cheque_ref,
        st.Document_Name AS document_name, st.Rejection_Reason AS rejection_reason, st.Receipt_No AS receipt_no,
        st.Quote_Id AS quote_id, st.Settlement_Date AS valid_till,
        st.Principal_Amount AS principal_amount, st.Interest_Amount AS interest_amount,
        st.Overdue_Interest AS overdue_interest, st.Interest_Recovery AS interest_recovery,
        st.Penalty_Amount AS penalty_amount, st.TDS_Amount AS tds_amount,
        st.Other_Deductions AS other_deductions, st.Net_Payable AS net_payable
    FROM trans_td_settlement st
    JOIN mst_deposit_account a ON a.Account_Id = st.Account_Id
    JOIN mst_deposit_account_td td ON td.Account_Id = st.Account_Id
    JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
    LEFT JOIN priomicro_core.mst_org_branch b ON b.Branch_Id = st.Branch_Id
    LEFT JOIN mst_deposit_account sba ON sba.Account_Id = st.SBCredit_AcId
    LEFT JOIN mst_deposit_account_sb sb ON sb.Account_Id = st.SBCredit_AcId
    LEFT JOIN mst_deposit_scheme ss ON ss.Scheme_Id = sba.Scheme_Id
    WHERE (p_settlement_id IS NULL OR st.Settlement_Id = p_settlement_id)
      AND (p_account_id IS NULL OR st.Account_Id = p_account_id)
      AND (p_branch_id IS NULL OR st.Branch_Id = p_branch_id)
      AND (p_status_csv IS NULL OR FIND_IN_SET(st.Status_Cd, p_status_csv))
    ORDER BY st.Settlement_Id DESC
    LIMIT v_offset, v_per_page;
END ;;
DELIMITER ;
```

---

## 10. POST `/api/TdSettlementSave` (multipart)

The BFF sends `multipart/form-data`. The fields are below; `document` is optional (PDF, JPG or PNG, up to 2 MB). The BFF has already checked the type, size and file signature. Laravel must check again.

| Field | Rule |
| --- | --- |
| `settlement_id` | optional; update this draft/rejected request |
| `account_id` | required |
| `status_cd` | `1` Save draft, `2` Submit |
| `settlement_type_cd`, `settlement_date`, `reason_cd` | required |
| `remarks` | optional, max 250 |
| `pay_mode_cd` | required when submitting |
| `sb_account_id` | required for mode 4; must equal the account's `SBCredit_AcId` |
| `beneficiary_account` + `ifsc` | required for mode 3 |
| `cheque_ref` | required for mode 2 |
| `beneficiary_name` | optional, max 100 |
| `net_payable`, `quote_id` | required when submitting; compared with the server quote |
| `branch_id` | sent by the BFF for non-head users |

```php
$data = $request->validate([
    'settlement_id'       => 'nullable|integer|min:1',
    'account_id'          => 'required|integer|min:1',
    'status_cd'           => 'required|in:1,2',
    'settlement_type_cd'  => 'required|in:1,2',
    'settlement_date'     => 'required|date_format:Y-m-d|before_or_equal:today',
    'reason_cd'           => 'required|in:1,2,3',
    'remarks'             => 'nullable|string|max:250',
    'pay_mode_cd'         => 'required_if:status_cd,2|nullable|in:1,2,3,4',
    'sb_account_id'       => 'required_if:pay_mode_cd,4|nullable|integer|min:1',
    'beneficiary_account' => ['required_if:pay_mode_cd,3', 'nullable', 'regex:/^[0-9A-Za-z-]{1,30}$/'],
    'ifsc'                => ['required_if:pay_mode_cd,3', 'nullable', 'regex:/^[A-Z]{4}0[A-Z0-9]{6}$/'],
    'cheque_ref'          => 'required_if:pay_mode_cd,2|nullable|string|max:30',
    'beneficiary_name'    => 'nullable|string|max:100',
    'net_payable'         => 'required_if:status_cd,2|nullable|numeric|min:0',
    'quote_id'            => 'nullable|string|max:60',
    'document'            => 'nullable|file|max:2048|mimes:pdf,jpg,jpeg,png|mimetypes:application/pdf,image/jpeg,image/png',
]);

$path = $name = null;
if ($request->hasFile('document')) {
    $file = $request->file('document');
    $path = $file->store("td-settlement/{$data['account_id']}", 'local');   // private disk, random name
    $name = Str::limit(basename($file->getClientOriginalName()), 150, '');
}

DB::connection('tenant')->transaction(function () use (...) {
    // CALL USP_TD_SETTLEMENT_SAVE(...) with $user->id, $user->branch_id, $user->is_head
});
// If the procedure returns ERROR, delete the stored file again.
```

Procedure rules (`USP_TD_SETTLEMENT_SAVE`):

1. Account exists, is a term deposit, is not closed, and the user may access its branch.
2. No active lien (`Appl_Status_Cd = 4` or an active freeze row) and KYC not restricted (`Appl_Status_Cd = 7`).
3. With `settlement_id`: the row must belong to the account and be in status 1 or 4. Without it: no other open request (status 1–4) may exist for the account.
4. `sb_account_id` (mode 4) must equal `mst_deposit_account_td.SBCredit_AcId`.
5. Call `USP_TD_SETTLEMENT_QUOTE`. On Submit (`status_cd = 2`), `ABS(quote.net − p_net_payable) > 0.01` → `ERROR 'Calculate the settlement again. The amount has changed.'`.
6. Store all quote columns from the **server** quote, never from the request.
7. New row: `Settlement_No` from `USP_CODE_SERIES_GENERATE('td_settlement', …)`, `Branch_Id` = account branch.
8. Keep the old `Document_Name`/`Document_Path` when no new file is sent.
9. Clear `Rejection_Reason` when a rejected request is resubmitted.
10. Return `SUCCESS` with `settlement_id`. Laravel then returns the row from `USP_TD_SETTLEMENT_LIST(:id, NULL, NULL, NULL, 1, 1)`.

---

## 11. POST `/api/TdSettlementApprove` (Approve / Reject)

```json
{ "settlement_id": 5, "approve": 1, "remarks": null, "branch_id": 2 }
```

```php
$data = $request->validate([
    'settlement_id' => 'required|integer|min:1',
    'approve'       => 'required|boolean',
    'remarks'       => 'nullable|string|max:250|required_if:approve,0',
]);
```

`USP_TD_SETTLEMENT_APPROVE(settlement_id, approve, remarks, user_id, user_branch_id, user_is_head)`:

- Only status 2 (Pending).
- Branch access check.
- The user must hold a checker role from the term deposit settlement row in `mst_settings_maker_checker`.
- When `DualAuth_Req = 1`, the maker (`Created_By` / `Updated_By`) cannot approve or reject their own request.
- Approve: status 3, `Approved_By`, `Approved_At`.
- Reject: status 4, `Rejection_Reason = remarks`. The maker can correct and resubmit it.
- No ledger posting here.

---

## 12. POST `/api/TdSettlementPost`

```json
{ "settlement_id": 5, "branch_id": 2 }
```

`USP_TD_SETTLEMENT_POST(settlement_id, user_id, user_branch_id, user_is_head)`, all in one transaction:

1. Lock the request (`FOR UPDATE`). It must be in status 3 (Approved). Check branch access and checker role, as in Approve.
2. Branch day must be open for `CURDATE()` when `mst_settings_general.DayEnd = 1` (`trans_sod_eod`), and the date must be inside the active `mst_fin_year`.
3. Recalculate with `USP_TD_SETTLEMENT_QUOTE(account, type, Settlement_Date)`. If `net` differs from the stored `Net_Payable` by more than 0.01 → `ERROR 'Calculate the settlement again. The amount has changed.'` (reject and resubmit).
4. Build the voucher with `CALL USP_LOAN_VOUCHER_RESET()`, insert lines into `tmp_loan_voucher_lines`, then `CALL USP_LOAN_VOUCHER_POST(branch, CURDATE(), 2, pay_mode, particulars, user, @vid, @vno, @note)`. If `@vid IS NULL` → `ERROR @note` and roll back.

   | Line role | Ledger | Debit | Credit |
   | --- | --- | --- | --- |
   | `PRINCIPAL` | scheme `Prn_Ledger` | principal | |
   | `INTEREST` | scheme `Intt_Ledg` | interest + overdue − recovery | |
   | `PENALTY` | penalty income ledger (setting 902) | | penalty |
   | `TDS` | TDS payable ledger (setting 900) | | tds |
   | `CONTRA` (modes 1–3) | Cash 101 / Bank 102 (filled by `USP_LOAN_VOUCHER_POST`) | | net payable |
   | `SB ACCOUNT` (mode 4) | savings scheme `Prn_Ledger` of `SBCredit_AcId` | | net payable |

   Debit total must equal credit total. If interest + overdue − recovery is negative, put it on the credit side of `INTEREST`.

5. Pay mode 4: credit the savings account **inside this procedure**. Update `mst_deposit_account_sb.Current_Balance` and `Available_Balance`, and insert a `trans_savings_transaction` row with `Trans_Mode = 'TR'`, `Trans_Type_Cd = 1`, `Tr_Status_Cd = 1` (posted), `Voucher_Id = @vid`. Do **not** call `USP_SAVINGS_TRANSACTION_ADD`: above its maker-checker threshold it would park the credit as "sent for approval" (status 2), even though this settlement is already approved. It also returns its own result set, which would confuse Laravel.
6. Insert into `mst_deposit_account_close`: `Account_Id`, `Closing_Date = Settlement_Date`, `Principal_Amount`, `Interest_Amount = interest + overdue − recovery`, `Incenitve_Amount = 0`, `Fine_Amount = penalty + tds + other`, `Closing_Amount = net`, `Pay_Mode_Cd`, `SBCredit_AcId`, `Close_Voucher_Id = @vid`, `Closing_Reason` (reason text + remarks, max 150), `Created_By`.
7. `UPDATE mst_deposit_account_td SET Current_Balance = 0` and `UPDATE mst_deposit_account SET Closing_Date, Closing_Reason`. These are the same updates `USP_DEPOSIT_ACCOUNT_CLOSE` makes. Run them inline for the same reason as step 5 (no nested result sets).
8. Release nothing else: an active lien already blocks Save, so none can exist here.
9. Update the request: status 5, `Close_Id`, `Voucher_Id = @vid`, `Receipt_No` from `USP_CODE_SERIES_GENERATE('td_settlement_receipt', …)`, `Posted_By`, `Posted_At`.
10. Return the row from `USP_TD_SETTLEMENT_LIST`. The screen opens the receipt using `receipt_no`, `account_no`, `holder_name`, `settlement_date` and `net_payable`.

---

## 13. Error messages the screen expects

The BFF passes Laravel's `message` straight to the user. Keep these plain:

| Case | Message |
| --- | --- |
| Account not in user's branch / missing | `Deposit account not found` (404) |
| Account closed | `This account is already closed` |
| Lien | `This deposit has a lien. A new settlement cannot be started.` |
| KYC restricted | `KYC is restricted. Settlement cannot continue.` |
| Wrong type for date | `The deposit has not matured. Use premature closure.` / `The deposit has matured. Use maturity settlement.` |
| Open request exists | `A settlement request is already open for this account` |
| Amount changed | `Calculate the settlement again. The amount has changed.` |
| Wrong status | `Only pending settlements can be approved` / `Only approved settlements can be posted` |
| Maker approving own request | `You cannot approve your own settlement` |
| Voucher not posted | the `@note` from `USP_LOAN_VOUCHER_POST` |

---

## 14. Test checklist

1. Account list shows only term deposits (`Deposit_Type_Cd = 2`). The default filter `active,matured` hides closed accounts.
2. A non-head user only sees their branch. Calling `TdSettlementAccountGet` for another branch's account returns 404.
3. Matured FD: only "Maturity settlement" is offered. Calculate → principal + (`Maturity_Amt − Inst_Amount`) − TDS when `TDS_Deduct = 1`.
4. Active FD: only "Premature closure" is offered. Calculate shows the penalty line when the scheme has charge 2 attached.
5. Save draft without a payment mode → status 1, no voucher. Reopening the account shows the saved values.
6. Submit with a changed `net_payable` → 422 "Calculate the settlement again…".
7. Upload a `.exe` renamed to `.pdf` → rejected by the BFF (file signature) and by Laravel (`mimetypes`).
8. Approve as the maker with `DualAuth_Req = 1` → 422. Approve as a checker → status 3.
9. Reject without a reason → 422. With a reason → status 4; the account opens in edit mode with the reason shown.
10. Post → voucher balanced, `mst_deposit_account_close` row, `Current_Balance = 0`, `Closing_Date` set, request status 5 with `receipt_no`. Mode 4 also adds a savings credit.
11. Post twice at the same time → only one succeeds (row lock).
12. Account with an active freeze row → `restriction = lien`; Save is rejected.
13. Open `/deposits/fd-settlement/{accountNo}` for a settled account → read-only view with settlement details, calculation, payout and the Receipt button.

---

## 15. Laravel 12 implementation (step by step)

The local `MFin_Portal_Api` folder is an empty Laravel 12 skeleton. Copy these files into the real backend and adapt only the three marked points: the tenant connection name, the user fields (`id`, `branch_id`, `is_head`), and the auth middleware.

### 15.1 Prerequisites

- API routes and Sanctum: `php artisan install:api` (skip if the backend already has `routes/api.php`). Routes in that file get the `/api` prefix automatically, so `TdSettlementList` becomes `/api/TdSettlementList`, which is the path the BFF calls.
- A `tenant` DB connection, switched by your existing tenant middleware. **Never** pick the tenant from a request field.
- The `local` disk (`storage/app/private` in Laravel 12) for documents. Never use the `public` disk for KYC or settlement documents.

### 15.2 Stored procedure helper — `app/Support/StoredProcedure.php`

```php
<?php

namespace App\Support;

use App\Exceptions\ProcedureException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use PDO;

final class StoredProcedure
{
    /**
     * Calls a procedure with bound parameters and returns every result set in order.
     *
     * @param  list<mixed>  $params
     * @return list<list<array<string, mixed>>>
     */
    public static function call(string $procedure, array $params): array
    {
        if (! preg_match('/^USP_[A-Z_]+$/', $procedure)) {
            throw new InvalidArgumentException('Invalid procedure name');
        }

        $pdo = DB::connection('tenant')->getPdo();
        $sql = sprintf('CALL %s(%s)', $procedure, implode(',', array_fill(0, count($params), '?')));
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($params));

        $sets = [];
        do {
            if ($stmt->columnCount() > 0) {
                $sets[] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        } while ($stmt->nextRowset());
        $stmt->closeCursor();

        return $sets;
    }

    /** First row of a status result set, or a 422/404 with the procedure's message. */
    public static function expectSuccess(array $set, int $errorStatus = 422): array
    {
        $row = $set[0] ?? [];
        if (($row['status'] ?? null) !== 'SUCCESS') {
            throw new ProcedureException($row['message'] ?? 'Request failed', $errorStatus);
        }

        return $row;
    }
}
```

All values go through `?` placeholders, and the procedure name must match `USP_[A-Z_]+`, so nothing from the request reaches the SQL text.

### 15.3 Error type — `app/Exceptions/ProcedureException.php`

```php
<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

class ProcedureException extends RuntimeException
{
    public function __construct(string $message, private readonly int $status = 422)
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'errors'  => null,
            'data'    => null,
        ], $this->status);
    }
}
```

Laravel calls `render()` automatically. Validation errors already come back as 422 JSON because the BFF sends `Accept: application/json`.

### 15.4 Controller — `app/Http/Controllers/Api/TdSettlementController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ProcedureException;
use App\Http\Controllers\Controller;
use App\Support\StoredProcedure as Sp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class TdSettlementController extends Controller
{
    private const OPEN_STATUSES = '1,2,3,4';

    /** Non-head users are always bound to their own branch, whatever the request says. */
    private function branch(Request $request): ?int
    {
        $user = $request->user();
        if ($user->is_head) {
            return $request->filled('branch_id') ? (int) $request->input('branch_id') : null;
        }

        return (int) $user->branch_id;
    }

    /** @return array{int, int, int} user id, user branch, is head */
    private function actor(Request $request): array
    {
        $user = $request->user();

        return [(int) $user->id, (int) $user->branch_id, $user->is_head ? 1 : 0];
    }

    private function ok(mixed $data, string $message, ?array $meta = null): JsonResponse
    {
        $body = ['success' => true, 'message' => $message, 'data' => $data];
        if ($meta !== null) {
            $body['meta'] = $meta;
        }

        return response()->json($body);
    }

    private function meta(array $countSet, int $page, int $perPage): array
    {
        $total = (int) ($countSet[0]['total'] ?? 0);

        return [
            'total'     => $total,
            'page'      => $page,
            'per_page'  => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
        ];
    }

    private function requestRow(int $settlementId): array
    {
        [, $rows] = Sp::call('USP_TD_SETTLEMENT_LIST', [$settlementId, null, null, null, 1, 1]) + [[], []];

        return $rows[0] ?? throw new ProcedureException('Settlement request not found', 404);
    }

    public function accountList(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page'           => 'nullable|integer|min:1',
            'per_page'       => 'nullable|integer|min:1|max:100',
            'scheme_type'    => 'nullable|in:FD,MIS,OTHER',
            'keyword'        => 'nullable|string|max:50',
            'branch_id'      => 'nullable|integer|min:1',
            'account_status' => ['nullable', 'regex:/^(active|matured|closed|settled)(,(active|matured|closed|settled))*$/'],
        ]);
        $page = (int) ($data['page'] ?? 1);
        $perPage = (int) ($data['per_page'] ?? 20);

        [$count, $rows] = Sp::call('USP_TD_SETTLEMENT_ACCOUNT_LIST', [
            null, $data['scheme_type'] ?? null, $data['keyword'] ?? null, $this->branch($request),
            $data['account_status'] ?? null, $page, $perPage,
        ]) + [[], []];

        return $this->ok($rows, 'Accounts retrieved', $this->meta($count, $page, $perPage));
    }

    public function accountGet(Request $request): JsonResponse
    {
        $data = $request->validate(['account_id' => 'required|integer|min:1']);
        $branch = $this->branch($request);

        [, $rows] = Sp::call('USP_TD_SETTLEMENT_ACCOUNT_LIST', [
            $data['account_id'], null, null, $branch, null, 1, 1,
        ]) + [[], []];
        $account = $rows[0] ?? throw new ProcedureException('Deposit account not found', 404);

        $latest = function (string $statuses) use ($data, $branch): ?array {
            [, $found] = Sp::call('USP_TD_SETTLEMENT_LIST', [null, $data['account_id'], $branch, $statuses, 1, 1]) + [[], []];

            return $found[0] ?? null;
        };

        return $this->ok([
            'account'         => $account,
            'open_request'    => $latest(self::OPEN_STATUSES),
            'settled_request' => $latest('5'),
        ], 'Account retrieved');
    }

    public function calculate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'account_id'         => 'required|integer|min:1',
            'settlement_type_cd' => 'required|in:1,2',
            'settlement_date'    => 'required|date_format:Y-m-d|before_or_equal:today',
        ]);

        [$result] = Sp::call('USP_TD_SETTLEMENT_CALC', [
            $data['account_id'], $data['settlement_type_cd'], $data['settlement_date'], $this->branch($request),
        ]) + [[]];
        $quote = Sp::expectSuccess($result);
        unset($quote['status'], $quote['message']);

        return $this->ok($quote, 'Settlement calculated');
    }

    public function list(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page'      => 'nullable|integer|min:1',
            'per_page'  => 'nullable|integer|min:1|max:100',
            'status_cd' => ['nullable', 'regex:/^[1-5](,[1-5])*$/'],
            'branch_id' => 'nullable|integer|min:1',
        ]);
        $page = (int) ($data['page'] ?? 1);
        $perPage = (int) ($data['per_page'] ?? 20);

        [$count, $rows] = Sp::call('USP_TD_SETTLEMENT_LIST', [
            null, null, $this->branch($request), $data['status_cd'] ?? null, $page, $perPage,
        ]) + [[], []];

        return $this->ok($rows, 'Settlements retrieved', $this->meta($count, $page, $perPage));
    }

    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settlement_id'       => 'nullable|integer|min:1',
            'account_id'          => 'required|integer|min:1',
            'status_cd'           => 'required|in:1,2',
            'settlement_type_cd'  => 'required|in:1,2',
            'settlement_date'     => 'required|date_format:Y-m-d|before_or_equal:today',
            'reason_cd'           => 'required|in:1,2,3',
            'remarks'             => 'nullable|string|max:250',
            'pay_mode_cd'         => 'required_if:status_cd,2|nullable|in:1,2,3,4',
            'sb_account_id'       => 'required_if:pay_mode_cd,4|nullable|integer|min:1',
            'beneficiary_account' => ['required_if:pay_mode_cd,3', 'nullable', 'regex:/^[0-9A-Za-z-]{1,30}$/'],
            'ifsc'                => ['required_if:pay_mode_cd,3', 'nullable', 'regex:/^[A-Z]{4}0[A-Z0-9]{6}$/'],
            'cheque_ref'          => 'required_if:pay_mode_cd,2|nullable|string|max:30',
            'beneficiary_name'    => 'nullable|string|max:100',
            'net_payable'         => 'required_if:status_cd,2|nullable|numeric|min:0',
            'quote_id'            => 'nullable|string|max:60',
            'document'            => 'nullable|file|max:2048|mimes:pdf,jpg,jpeg,png|mimetypes:application/pdf,image/jpeg,image/png',
        ]);

        $path = $name = null;
        if ($request->hasFile('document')) {
            $file = $request->file('document');
            $path = $file->store("td-settlement/{$data['account_id']}", 'local');
            $name = Str::limit(basename($file->getClientOriginalName()), 150, '');
        }

        try {
            $settlementId = DB::connection('tenant')->transaction(function () use ($data, $path, $name, $request): int {
                [$result] = Sp::call('USP_TD_SETTLEMENT_SAVE', [
                    $data['settlement_id'] ?? null,
                    $data['account_id'],
                    $data['status_cd'],
                    $data['settlement_type_cd'],
                    $data['settlement_date'],
                    $data['reason_cd'],
                    $data['remarks'] ?? null,
                    $data['pay_mode_cd'] ?? null,
                    $data['sb_account_id'] ?? null,
                    $data['beneficiary_account'] ?? null,
                    $data['beneficiary_name'] ?? null,
                    $data['ifsc'] ?? null,
                    $data['cheque_ref'] ?? null,
                    $data['net_payable'] ?? null,
                    $data['quote_id'] ?? null,
                    $name,
                    $path,
                    ...$this->actor($request),
                ]) + [[]];

                return (int) Sp::expectSuccess($result)['settlement_id'];
            });
        } catch (Throwable $error) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }
            throw $error;
        }

        $message = (int) $data['status_cd'] === 2 ? 'Settlement submitted for approval' : 'Draft saved';

        return $this->ok($this->requestRow($settlementId), $message);
    }

    public function approve(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settlement_id' => 'required|integer|min:1',
            'approve'       => 'required|boolean',
            'remarks'       => 'nullable|string|max:250|required_if:approve,0,false',
        ]);

        $message = DB::connection('tenant')->transaction(function () use ($data, $request): string {
            [$result] = Sp::call('USP_TD_SETTLEMENT_APPROVE', [
                $data['settlement_id'], $data['approve'] ? 1 : 0, $data['remarks'] ?? null, ...$this->actor($request),
            ]) + [[]];

            return (string) Sp::expectSuccess($result)['message'];
        });

        return $this->ok($this->requestRow((int) $data['settlement_id']), $message);
    }

    public function post(Request $request): JsonResponse
    {
        $data = $request->validate(['settlement_id' => 'required|integer|min:1']);

        $message = DB::connection('tenant')->transaction(function () use ($data, $request): string {
            [$result] = Sp::call('USP_TD_SETTLEMENT_POST', [$data['settlement_id'], ...$this->actor($request)]) + [[]];

            return (string) Sp::expectSuccess($result)['message'];
        });

        return $this->ok($this->requestRow((int) $data['settlement_id']), $message);
    }
}
```

Why the transactions matter: if a procedure returns `ERROR`, `expectSuccess` throws inside `DB::transaction`, so Laravel rolls back everything, including the voucher, code-series numbers and balance changes.

### 15.5 Routes — `routes/api.php`

```php
use App\Http\Controllers\Api\TdSettlementController;

Route::middleware(['auth:sanctum', 'throttle:120,1'])   // + your tenant middleware
    ->controller(TdSettlementController::class)
    ->group(function () {
        Route::get('TdSettlementAccountList', 'accountList');
        Route::get('TdSettlementAccountGet', 'accountGet');
        Route::get('TdSettlementCalculate', 'calculate');
        Route::get('TdSettlementList', 'list');
        Route::post('TdSettlementSave', 'save')->middleware('throttle:30,1');
        Route::post('TdSettlementApprove', 'approve')->middleware('throttle:30,1');
        Route::post('TdSettlementPost', 'post')->middleware('throttle:10,1');
    });
```

Then run `php artisan route:list --path=TdSettlement` and check that all 7 routes appear.

### 15.6 Quick API checks (before testing the screen)

```bash
TOKEN="<bearer token of a branch user>"
API="http://localhost:8000/api"

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  "$API/TdSettlementAccountList?account_status=active,matured&per_page=5"

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  "$API/TdSettlementAccountGet?account_id=33"

curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  "$API/TdSettlementCalculate?account_id=33&settlement_type_cd=2&settlement_date=2026-11-03"

curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" \
  -F account_id=33 -F status_cd=1 -F settlement_type_cd=2 -F settlement_date=2026-11-03 -F reason_cd=1 \
  "$API/TdSettlementSave"
```

Every response must use the envelope from section 4. `TdSettlementAccountGet` must return `data.account`, `data.open_request` and `data.settled_request`.

---

## 16. SQL — Save, Approve and Post procedures

Run these after the table (section 3) and the procedures in sections 6, 8 and 9. Replace setting Ids 900/902 and maker-checker `Voucher_Type = 3` with your values.

### 16.1 `USP_TD_SETTLEMENT_SAVE`

```sql
DELIMITER ;;
CREATE PROCEDURE `USP_TD_SETTLEMENT_SAVE`(
    IN p_settlement_id BIGINT,
    IN p_account_id INT,
    IN p_status_cd TINYINT,
    IN p_type_cd TINYINT,
    IN p_date DATE,
    IN p_reason_cd TINYINT,
    IN p_remarks VARCHAR(250),
    IN p_pay_mode_cd TINYINT,
    IN p_sb_account_id INT,
    IN p_beneficiary_account VARCHAR(30),
    IN p_beneficiary_name VARCHAR(100),
    IN p_ifsc VARCHAR(11),
    IN p_cheque_ref VARCHAR(30),
    IN p_net_payable DECIMAL(12,2),
    IN p_quote_id VARCHAR(60),
    IN p_document_name VARCHAR(150),
    IN p_document_path VARCHAR(255),
    IN p_user_id INT,
    IN p_user_branch_id INT,
    IN p_user_is_head TINYINT
)
proc: BEGIN
    DECLARE v_err VARCHAR(255) DEFAULT NULL;
    DECLARE v_branch INT; DECLARE v_closing DATE; DECLARE v_appl_status INT; DECLARE v_sb INT;
    DECLARE v_lien INT DEFAULT 0; DECLARE v_open BIGINT;
    DECLARE v_cur_account INT; DECLARE v_cur_status INT;
    DECLARE v_id BIGINT DEFAULT p_settlement_id;
    DECLARE v_no VARCHAR(150); DECLARE v_gs VARCHAR(10); DECLARE v_gm VARCHAR(255);
    DECLARE q_p, q_i, q_od, q_r, q_pen, q_tds, q_oth, q_net DECIMAL(12,2);
    DECLARE q_err VARCHAR(255);

    SELECT a.Branch_Id, a.Closing_Date, a.Appl_Status_Cd, td.SBCredit_AcId
    INTO v_branch, v_closing, v_appl_status, v_sb
    FROM mst_deposit_account a
    JOIN mst_deposit_account_td td ON td.Account_Id = a.Account_Id
    WHERE a.Account_Id = p_account_id AND a.Deposit_Type_Cd = 2
    FOR UPDATE;

    SELECT COUNT(*) INTO v_lien FROM mst_loan_application_deposit_freeze
    WHERE Deposit_Account_Id = p_account_id AND Freeze_Status_Cd = 1;

    IF v_branch IS NULL OR (IFNULL(p_user_is_head, 0) = 0 AND v_branch <> p_user_branch_id) THEN
        SET v_err = 'Deposit account not found';
    ELSEIF v_closing IS NOT NULL THEN
        SET v_err = 'This account is already closed';
    ELSEIF v_appl_status = 4 OR v_lien > 0 THEN
        SET v_err = 'This deposit has a lien. A new settlement cannot be started.';
    ELSEIF v_appl_status = 7 THEN
        SET v_err = 'KYC is restricted. Settlement cannot continue.';
    ELSEIF p_status_cd NOT IN (1, 2) OR p_type_cd NOT IN (1, 2) OR p_reason_cd NOT IN (1, 2, 3) THEN
        SET v_err = 'Invalid settlement details';
    ELSEIF p_pay_mode_cd = 4 AND (v_sb IS NULL OR IFNULL(p_sb_account_id, 0) <> v_sb) THEN
        SET v_err = 'Choose the savings account linked to this deposit';
    END IF;

    IF v_err IS NULL AND p_settlement_id IS NOT NULL THEN
        SELECT Account_Id, Status_Cd INTO v_cur_account, v_cur_status
        FROM trans_td_settlement WHERE Settlement_Id = p_settlement_id FOR UPDATE;
        IF v_cur_account IS NULL OR v_cur_account <> p_account_id THEN
            SET v_err = 'Settlement request not found';
        ELSEIF v_cur_status NOT IN (1, 4) THEN
            SET v_err = 'Only draft or rejected settlements can be changed';
        END IF;
    ELSEIF v_err IS NULL THEN
        SELECT MAX(Settlement_Id) INTO v_open FROM trans_td_settlement
        WHERE Account_Id = p_account_id AND Status_Cd IN (1, 2, 3, 4);
        IF v_open IS NOT NULL THEN
            SET v_err = 'A settlement request is already open for this account';
        END IF;
    END IF;

    IF v_err IS NULL THEN
        CALL USP_TD_SETTLEMENT_QUOTE(p_account_id, p_type_cd, p_date,
                                     q_p, q_i, q_od, q_r, q_pen, q_tds, q_oth, q_net, q_err);
        IF q_err IS NOT NULL THEN
            SET v_err = q_err;
        ELSEIF p_status_cd = 2 AND p_pay_mode_cd IS NULL THEN
            SET v_err = 'Choose a payment mode.';
        ELSEIF p_status_cd = 2 AND (p_net_payable IS NULL OR ABS(q_net - p_net_payable) > 0.01) THEN
            SET v_err = 'Calculate the settlement again. The amount has changed.';
        END IF;
    END IF;

    IF v_err IS NOT NULL THEN
        SELECT 'ERROR' AS status, NULL AS settlement_id, v_err AS message;
        LEAVE proc;
    END IF;

    IF v_id IS NULL THEN
        CALL USP_CODE_SERIES_GENERATE('td_settlement', v_no, v_gs, v_gm);
        INSERT INTO trans_td_settlement (
            Settlement_No, Account_Id, Branch_Id, Settlement_Type_Cd, Settlement_Date, Reason_Cd, Remarks,
            Pay_Mode_Cd, SBCredit_AcId, Beneficiary_Account, Beneficiary_Name, IFSC, Cheque_Ref,
            Principal_Amount, Interest_Amount, Overdue_Interest, Interest_Recovery, Penalty_Amount,
            TDS_Amount, Other_Deductions, Net_Payable, Quote_Id, Document_Name, Document_Path,
            Status_Cd, Created_By, Created_At
        ) VALUES (
            IF(v_gs = 'SUCCESS', LEFT(v_no, 40), NULL), p_account_id, v_branch, p_type_cd, p_date, p_reason_cd,
            NULLIF(TRIM(p_remarks), ''), p_pay_mode_cd, IF(p_pay_mode_cd = 4, v_sb, NULL),
            IF(p_pay_mode_cd = 3, p_beneficiary_account, NULL), NULLIF(TRIM(p_beneficiary_name), ''),
            IF(p_pay_mode_cd = 3, p_ifsc, NULL), IF(p_pay_mode_cd = 2, p_cheque_ref, NULL),
            q_p, q_i, q_od, q_r, q_pen, q_tds, q_oth, q_net, p_quote_id, p_document_name, p_document_path,
            p_status_cd, p_user_id, NOW()
        );
        SET v_id = LAST_INSERT_ID();
    ELSE
        UPDATE trans_td_settlement
        SET Settlement_Type_Cd = p_type_cd, Settlement_Date = p_date, Reason_Cd = p_reason_cd,
            Remarks = NULLIF(TRIM(p_remarks), ''), Pay_Mode_Cd = p_pay_mode_cd,
            SBCredit_AcId = IF(p_pay_mode_cd = 4, v_sb, NULL),
            Beneficiary_Account = IF(p_pay_mode_cd = 3, p_beneficiary_account, NULL),
            Beneficiary_Name = NULLIF(TRIM(p_beneficiary_name), ''),
            IFSC = IF(p_pay_mode_cd = 3, p_ifsc, NULL), Cheque_Ref = IF(p_pay_mode_cd = 2, p_cheque_ref, NULL),
            Principal_Amount = q_p, Interest_Amount = q_i, Overdue_Interest = q_od, Interest_Recovery = q_r,
            Penalty_Amount = q_pen, TDS_Amount = q_tds, Other_Deductions = q_oth, Net_Payable = q_net,
            Quote_Id = p_quote_id,
            Document_Name = COALESCE(p_document_name, Document_Name),
            Document_Path = COALESCE(p_document_path, Document_Path),
            Rejection_Reason = IF(p_status_cd = 2, NULL, Rejection_Reason),
            Status_Cd = p_status_cd, Updated_By = p_user_id, Updated_At = NOW()
        WHERE Settlement_Id = v_id;
    END IF;

    SELECT 'SUCCESS' AS status, v_id AS settlement_id,
           IF(p_status_cd = 2, 'Settlement submitted for approval', 'Draft saved') AS message;
END ;;
DELIMITER ;
```

> When a new document replaces an old one, Laravel should delete the old file after the procedure succeeds (read `Document_Path` before calling the procedure).

### 16.2 `USP_TD_SETTLEMENT_APPROVE`

```sql
DELIMITER ;;
CREATE PROCEDURE `USP_TD_SETTLEMENT_APPROVE`(
    IN p_settlement_id BIGINT,
    IN p_approve TINYINT,
    IN p_remarks VARCHAR(250),
    IN p_user_id INT,
    IN p_user_branch_id INT,
    IN p_user_is_head TINYINT
)
BEGIN
    DECLARE v_err VARCHAR(255) DEFAULT NULL;
    DECLARE v_status INT; DECLARE v_branch INT; DECLARE v_maker INT;
    DECLARE v_roles VARCHAR(25); DECLARE v_dual INT DEFAULT 1; DECLARE v_is_checker INT DEFAULT 0;
    DECLARE v_remarks VARCHAR(250) DEFAULT NULLIF(TRIM(IFNULL(p_remarks, '')), '');

    SELECT Status_Cd, Branch_Id, IFNULL(Updated_By, Created_By)
    INTO v_status, v_branch, v_maker
    FROM trans_td_settlement WHERE Settlement_Id = p_settlement_id FOR UPDATE;

    SELECT MAX(Checker_Role_Id), MAX(IFNULL(DualAuth_Req, 1)) INTO v_roles, v_dual
    FROM mst_settings_maker_checker WHERE Voucher_Type = 3 AND IFNULL(Is_Active, 0) = 1;

    SELECT COUNT(*) INTO v_is_checker
    FROM mst_user_role ur
    WHERE ur.User_Id = p_user_id AND IFNULL(ur.Status, 0) = 1
      AND FIND_IN_SET(ur.Role_Id, REPLACE(IFNULL(v_roles, ''), ' ', '')) > 0;

    IF v_status IS NULL OR (IFNULL(p_user_is_head, 0) = 0 AND v_branch <> p_user_branch_id) THEN
        SET v_err = 'Settlement request not found';
    ELSEIF v_status <> 2 THEN
        SET v_err = 'Only pending settlements can be approved';
    ELSEIF v_is_checker = 0 THEN
        SET v_err = 'You are not allowed to approve settlements';
    ELSEIF IFNULL(v_dual, 1) = 1 AND v_maker = p_user_id THEN
        SET v_err = 'You cannot approve your own settlement';
    ELSEIF p_approve = 0 AND v_remarks IS NULL THEN
        SET v_err = 'Enter a rejection reason.';
    END IF;

    IF v_err IS NOT NULL THEN
        SELECT 'ERROR' AS status, p_settlement_id AS settlement_id, v_err AS message;
    ELSEIF p_approve = 1 THEN
        UPDATE trans_td_settlement
        SET Status_Cd = 3, Approved_By = p_user_id, Approved_At = NOW()
        WHERE Settlement_Id = p_settlement_id;
        SELECT 'SUCCESS' AS status, p_settlement_id AS settlement_id, 'Settlement approved' AS message;
    ELSE
        UPDATE trans_td_settlement
        SET Status_Cd = 4, Rejection_Reason = v_remarks, Approved_By = p_user_id, Approved_At = NOW()
        WHERE Settlement_Id = p_settlement_id;
        SELECT 'SUCCESS' AS status, p_settlement_id AS settlement_id, 'Settlement rejected' AS message;
    END IF;
END ;;
DELIMITER ;
```

> If no active `mst_settings_maker_checker` row exists for `Voucher_Type = 3`, nobody can approve. Insert it first, for example `(Voucher_Type 3, Thresold_Limit 0, Checker_Role_Id '2', DualAuth_Req 1, Auto_Apprv 0, Is_Active 1)`.

### 16.3 `USP_TD_SETTLEMENT_POST`

```sql
DELIMITER ;;
CREATE PROCEDURE `USP_TD_SETTLEMENT_POST`(
    IN p_settlement_id BIGINT,
    IN p_user_id INT,
    IN p_user_branch_id INT,
    IN p_user_is_head TINYINT
)
proc: BEGIN
    DECLARE v_err VARCHAR(255) DEFAULT NULL;
    DECLARE v_status INT; DECLARE v_branch INT; DECLARE v_account INT; DECLARE v_type INT;
    DECLARE v_date DATE; DECLARE v_mode INT; DECLARE v_sb INT; DECLARE v_saved_net DECIMAL(12,2);
    DECLARE v_no VARCHAR(40); DECLARE v_reason VARCHAR(150); DECLARE v_maker INT;
    DECLARE v_roles VARCHAR(25); DECLARE v_dual INT DEFAULT 1; DECLARE v_is_checker INT DEFAULT 0;
    DECLARE v_day_end INT DEFAULT 0; DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_prn_gl INT; DECLARE v_int_gl INT; DECLARE v_pen_gl INT; DECLARE v_tds_gl INT; DECLARE v_sb_gl INT;
    DECLARE v_sb_detail INT; DECLARE v_sb_balance DECIMAL(14,2); DECLARE v_sb_closed DATE;
    DECLARE q_p, q_i, q_od, q_r, q_pen, q_tds, q_oth, q_net DECIMAL(12,2);
    DECLARE q_err VARCHAR(255);
    DECLARE v_int_net DECIMAL(12,2);
    DECLARE v_vid BIGINT; DECLARE v_vno VARCHAR(25); DECLARE v_note VARCHAR(255);
    DECLARE v_close_id INT; DECLARE v_code VARCHAR(150); DECLARE v_gs VARCHAR(10); DECLARE v_gm VARCHAR(255);

    -- 1. Lock and check the request
    SELECT st.Status_Cd, st.Branch_Id, st.Account_Id, st.Settlement_Type_Cd, st.Settlement_Date, st.Pay_Mode_Cd,
           st.SBCredit_AcId, st.Net_Payable, IFNULL(st.Settlement_No, CONCAT('TDS-', st.Settlement_Id)),
           IFNULL(st.Updated_By, st.Created_By),
           LEFT(CONCAT(ELT(st.Reason_Cd, 'Customer request', 'Financial requirement', 'Other'),
                       IF(IFNULL(st.Remarks, '') = '', '', CONCAT(' - ', st.Remarks))), 150)
    INTO v_status, v_branch, v_account, v_type, v_date, v_mode, v_sb, v_saved_net, v_no, v_maker, v_reason
    FROM trans_td_settlement st WHERE st.Settlement_Id = p_settlement_id FOR UPDATE;

    SELECT MAX(Checker_Role_Id), MAX(IFNULL(DualAuth_Req, 1)) INTO v_roles, v_dual
    FROM mst_settings_maker_checker WHERE Voucher_Type = 3 AND IFNULL(Is_Active, 0) = 1;
    SELECT COUNT(*) INTO v_is_checker FROM mst_user_role ur
    WHERE ur.User_Id = p_user_id AND IFNULL(ur.Status, 0) = 1
      AND FIND_IN_SET(ur.Role_Id, REPLACE(IFNULL(v_roles, ''), ' ', '')) > 0;
    SELECT IFNULL(MAX(Status), 0) INTO v_day_end FROM mst_settings_general WHERE Code = 'DayEnd';

    IF v_status IS NULL OR (IFNULL(p_user_is_head, 0) = 0 AND v_branch <> p_user_branch_id) THEN
        SET v_err = 'Settlement request not found';
    ELSEIF v_status <> 3 THEN
        SET v_err = 'Only approved settlements can be posted';
    ELSEIF v_is_checker = 0 THEN
        SET v_err = 'You are not allowed to post settlements';
    ELSEIF IFNULL(v_dual, 1) = 1 AND v_maker = p_user_id THEN
        SET v_err = 'You cannot post your own settlement';
    ELSEIF NOT EXISTS (SELECT 1 FROM mst_fin_year
                       WHERE CURDATE() BETWEEN Start_Date AND End_Date AND IFNULL(Is_Active, 0) = 1) THEN
        SET v_err = 'No active financial year covers today';
    END IF;

    -- 2. Branch day open
    IF v_err IS NULL AND v_day_end = 1 THEN
        SELECT COUNT(*) INTO v_cnt FROM trans_sod_eod
        WHERE Branch_Id = v_branch AND DATE(SOD) = CURDATE() AND EOD IS NULL;
        IF v_cnt = 0 THEN SET v_err = 'Branch day is not open'; END IF;
    END IF;

    -- 3. Recalculate
    IF v_err IS NULL THEN
        CALL USP_TD_SETTLEMENT_QUOTE(v_account, v_type, v_date,
                                     q_p, q_i, q_od, q_r, q_pen, q_tds, q_oth, q_net, q_err);
        IF q_err IS NOT NULL THEN
            SET v_err = q_err;
        ELSEIF ABS(q_net - v_saved_net) > 0.01 THEN
            SET v_err = 'Calculate the settlement again. The amount has changed.';
        END IF;
    END IF;

    -- Ledgers and linked savings account
    IF v_err IS NULL THEN
        SELECT s.Prn_Ledger, s.Intt_Ledg INTO v_prn_gl, v_int_gl
        FROM mst_deposit_account a JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
        WHERE a.Account_Id = v_account;
        SELECT NULLIF(MAX(Value), 0) INTO v_tds_gl FROM mst_settings_global WHERE Id = 900;
        SELECT NULLIF(MAX(Value), 0) INTO v_pen_gl FROM mst_settings_global WHERE Id = 902;

        IF v_mode = 4 THEN
            SELECT sb.Id, sb.Current_Balance, a.Closing_Date, s.Prn_Ledger
            INTO v_sb_detail, v_sb_balance, v_sb_closed, v_sb_gl
            FROM mst_deposit_account a
            JOIN mst_deposit_account_sb sb ON sb.Account_Id = a.Account_Id
            JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
            WHERE a.Account_Id = v_sb
            FOR UPDATE;
            IF v_sb_detail IS NULL OR v_sb_closed IS NOT NULL THEN
                SET v_err = 'The linked savings account is not open';
            END IF;
        END IF;
    END IF;

    IF v_err IS NOT NULL THEN
        SELECT 'ERROR' AS status, p_settlement_id AS settlement_id, v_err AS message;
        LEAVE proc;
    END IF;

    -- 4. Voucher (zero lines are dropped by USP_LOAN_VOUCHER_POST)
    SET v_int_net = q_i + q_od - q_r;
    CALL USP_LOAN_VOUCHER_RESET();
    INSERT INTO tmp_loan_voucher_lines (Line_Role, GL_Account_Id, Debit_Amount, Credit_Amount, Line_Narration) VALUES
        ('PRINCIPAL', v_prn_gl, q_p, 0, CONCAT('TD settlement ', v_no)),
        ('INTEREST', v_int_gl, GREATEST(v_int_net, 0), GREATEST(-v_int_net, 0), CONCAT('TD interest ', v_no)),
        ('PENALTY', v_pen_gl, 0, q_pen + q_oth, CONCAT('Premature penalty ', v_no)),
        ('TDS', v_tds_gl, 0, q_tds, CONCAT('TDS ', v_no)),
        (IF(v_mode = 4, 'SB ACCOUNT', 'CONTRA'), IF(v_mode = 4, v_sb_gl, NULL), 0, q_net,
         CONCAT('Settlement paid ', v_no));

    CALL USP_LOAN_VOUCHER_POST(v_branch, CURDATE(), 2, v_mode, LEFT(CONCAT('TD settlement ', v_no), 255),
                               p_user_id, v_vid, v_vno, v_note);
    IF v_vid IS NULL THEN
        SELECT 'ERROR' AS status, p_settlement_id AS settlement_id,
               IFNULL(v_note, 'Voucher could not be posted') AS message;
        LEAVE proc;
    END IF;

    -- 5. Credit the linked savings account
    IF v_mode = 4 THEN
        CALL USP_CODE_SERIES_GENERATE('savings_transaction', v_code, v_gs, v_gm);
        UPDATE mst_deposit_account_sb
        SET Current_Balance = Current_Balance + q_net, Available_Balance = Available_Balance + q_net
        WHERE Id = v_sb_detail;
        INSERT INTO trans_savings_transaction (
            Account_Id, Trans_No, Trans_Date, Effect_Date, Trans_Mode, Trans_Type_Cd, Trans_Amount, Balance_After,
            Ledger_Narration, Branch_Id, Voucher_Id, Tr_Status_Cd, Created_By, Created_At, Approved_By, Approved_At
        ) VALUES (
            v_sb, LEFT(v_code, 40), CURDATE(), CURDATE(), 'TR', 1, q_net, v_sb_balance + q_net,
            LEFT(CONCAT('TD settlement ', v_no), 75), v_branch, v_vid, 1, p_user_id, NOW(), p_user_id, NOW()
        );
    END IF;

    -- 6–7. Closure record, zero balance, close the account
    INSERT INTO mst_deposit_account_close (
        Account_Id, Closing_Date, Principal_Amount, Interest_Amount, Incenitve_Amount, Fine_Amount,
        Closing_Amount, Pay_Mode_Cd, SBCredit_AcId, Close_Voucher_Id, Closing_Reason, Created_By
    ) VALUES (
        v_account, v_date, q_p, v_int_net, 0, q_pen + q_tds + q_oth,
        q_net, v_mode, IF(v_mode = 4, v_sb, NULL), v_vid, v_reason, p_user_id
    );
    SET v_close_id = LAST_INSERT_ID();

    UPDATE mst_deposit_account_td SET Current_Balance = 0 WHERE Account_Id = v_account;
    UPDATE mst_deposit_account SET Closing_Date = v_date, Closing_Reason = v_reason WHERE Account_Id = v_account;

    -- 9. Mark settled
    CALL USP_CODE_SERIES_GENERATE('td_settlement_receipt', v_code, v_gs, v_gm);
    UPDATE trans_td_settlement
    SET Status_Cd = 5, Close_Id = v_close_id, Voucher_Id = v_vid,
        Principal_Amount = q_p, Interest_Amount = q_i, Overdue_Interest = q_od, Interest_Recovery = q_r,
        Penalty_Amount = q_pen, TDS_Amount = q_tds, Other_Deductions = q_oth, Net_Payable = q_net,
        Receipt_No = LEFT(IF(v_gs = 'SUCCESS', v_code, CONCAT('TDR-', p_settlement_id)), 40),
        Posted_By = p_user_id, Posted_At = NOW()
    WHERE Settlement_Id = p_settlement_id;

    SELECT 'SUCCESS' AS status, p_settlement_id AS settlement_id,
           CONCAT('Settlement posted. Voucher ', v_vno) AS message;
END ;;
DELIMITER ;
```

> Every procedure here returns **exactly one** status result set, and nested calls only use `OUT` parameters. That keeps `StoredProcedure::expectSuccess($sets[0])` correct.

---

## 17. What the screen shows for each response

The URL carries the account number (URL-encoded, e.g. `/deposits/fd-settlement/FD01%2F00012`), never the id. The page finds the account through `TdSettlementAccountList?keyword={accountNo}` (exact match on `account_no`, inside the user's branch) and then works with `account_id` internally. Old numeric links are looked up through `TdSettlementAccountGet` and redirected to the account-number URL. So `keyword` **must** match the full `account_no` value (section 6).

The page picks its mode from `TdSettlementAccountGet`:

| `account.eligible` / `restriction` | `open_request.status_cd` | Screen |
| --- | --- | --- |
| eligible, no restriction | none | Editable workspace: Calculate, Save draft, Review & submit |
| eligible | 1 Draft | Editable, prefilled. Calculate again before submitting |
| eligible | 4 Rejected | Editable, prefilled, rejection reason shown at the top |
| eligible | 2 Pending | Read-only workspace with Approve / Reject |
| eligible | 3 Approved | Read-only workspace with Post |
| `restriction = settled` (closed) | — | **Read-only view**: customer, deposit, settlement details (receipt no., type, date, reason, remarks), calculation lines, payout, document, and the Receipt button when `settled_request` exists |
| `restriction = lien` or `kyc` | any | Read-only view with a red notice; shows the open request's details if there is one |
| HTTP 404 / 403 | — | "This deposit account was not found." |
| Other error | — | Error panel with Retry |

For the read-only view of a settled account to show its details, `TdSettlementAccountGet` must return `eligible = 0`, `restriction = 'settled'` and the posted request in `settled_request`, including all quote columns.

> Until these endpoints exist in Laravel, any `/deposits/fd-settlement/{accountNo}` link shows "This deposit account was not found." That is expected. Once section 15 is deployed, the page loads for term deposits in the user's branch, and an old link such as `/deposits/fd-settlement/33` redirects to that account's number.
