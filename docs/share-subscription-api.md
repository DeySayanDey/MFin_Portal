# Share Subscription — Backend API Guide

Source of truth: `priomicro_basundhara.sql` (tenant schema). Screen: `/onboarding/share-subscription`.
Frontend calls the Next.js BFF (`/api/onboarding/share-subscription`), which calls these Laravel endpoints with the user's Bearer token.

| Laravel endpoint | Method | Stored procedure | Status |
| --- | --- | --- | --- |
| `/api/ShareSubscriptionList` | GET | `USP_SHARE_SUBSCRIPTION_LIST` | exists |
| `/api/ShareHoldingGet` | GET | `USP_SHARE_HOLDING_GET` | exists |
| `/api/ShareSubscriptionAdd` | POST | `USP_SHARE_SUBSCRIPTION_ADD` | exists — see section 4 (all entries saved as Entered) |
| `/api/ShareSubscriptionEdit` | POST | `USP_SHARE_SUBSCRIPTION_EDIT` | **new** — section 6 |
| `/api/ShareSubscriptionApprove` | POST | `USP_SHARE_SUBSCRIPTION_APPROVE` | exists — used by Verify and Reject |

---

## 1. Tables and settings used

### `trans_share_subscription`

| Column | Type | Meaning |
| --- | --- | --- |
| `Subscription_Id` | bigint PK | |
| `Subscription_No` | varchar(40) unique | From code series `share_subscription` (e.g. `SH-000002`) |
| `Cust_Type_Cd` | tinyint | 1 = Group (`mst_group`), 2 = Individual (`mst_member`) — option group 34 |
| `Customer_Id` | int | `Group_Id` or `Member_Id` |
| `Branch_Id` | smallint | Copied from the subscriber |
| `Subscription_Date` | date | |
| `No_Of_Shares` | int | |
| `Face_Value` | decimal(8,2) | `mst_settings_global.Id = 5` at save time |
| `Subscription_Amount` | decimal(10,2) | `ROUND(No_Of_Shares × Face_Value, 2)` |
| `Paid_Amount` | decimal(10,2) | Paid now, `0 … Subscription_Amount` |
| `Outstanding_Amount` | decimal(10,2) | **Buy amount** = `Subscription_Amount` (already done in `USP_SHARE_SUBSCRIPTION_ADD`) |
| `Payment_Mode_Cd` | tinyint | 1 Cash, 2 Bank cheque, 3 Bank transfer — option group 41 |
| `Trans_Ref_No` | varchar(25) | Required for modes 2 and 3 |
| `Voucher_Id` | bigint | Set by `USP_SHARE_VOUCHER_POST` when posted |
| `Remarks` | varchar(250) | |
| `Tr_Status_Cd` | tinyint | Group 48: 1 Entered, 2 Approved, 3 Rejected, 4 Reversed, 5 Deleted |
| `Created_By`, `Created_At` | | Maker |
| `Approved_By`, `Approved_At`, `Approval_Remarks` | | Checker (verify or reject) |

> Unpaid balance is not stored. The screen shows it as `Subscription_Amount − Paid_Amount`.

### Settings

| Table / row | Used for |
| --- | --- |
| `mst_settings_global` Id 2 | Maximum backdate days (0 = no limit) |
| `mst_settings_global` Id 5 | Share face value (must be > 0) |
| `mst_settings_global` Id 6 | Minimum shares per subscription |
| `mst_settings_global` Id 7 | Maximum shares per holder (0 = no limit) |
| `mst_settings_global` Id 101 / 102 | Cash / Bank ledger for the voucher |
| `mst_settings_global` Id 106 / 107 | Share Capital / Share Receivable ledger |
| `mst_settings_general` `AllowPrev`, `DayEnd` | Backdating allowed; branch day must be open (`trans_sod_eod`) |
| `mst_settings_maker_checker` `Voucher_Type = 1` | Share subscription maker-checker rule (currently `Thresold_Limit = 75000`, `Checker_Role_Id = '2'`, `DualAuth_Req = 1`) |
| `mst_user_role` | Who is a checker (role in `Checker_Role_Id`) |
| `mst_fin_year` | Date must be inside the active financial year |
| `mst_code_series` `share_subscription` | Subscription number |

---

## 2. Common rules for every endpoint

- Auth: `auth:sanctum` (or the existing guard). Resolve the tenant schema from the token, never from the request.
- Pass `p_user_id`, `p_user_branch_id`, `p_user_is_head` from the logged-in user. Never from the body.
- Non-head users only see and act on their own branch. The list endpoint must force `branch_id` to the user's branch for non-head users.
- Procedures return a first column `status` = `SUCCESS` / `ERROR` and `message`. Map `ERROR` to HTTP 422.
- Response envelope:

```json
{ "success": true, "message": "…", "data": { } }
```

```json
{ "success": false, "message": "Only pending subscriptions can be edited", "errors": { "no_of_shares": ["…"] } }
```

- After Add, Edit and Approve, return `data` as **one list row** (section 3 shape). Get it with
  `CALL USP_SHARE_SUBSCRIPTION_LIST(:id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1)` and take the first row of the second result set. The screen needs `subscription_id`, `customer_id` and `tr_status_cd` from it.

---

## 3. GET `/api/ShareSubscriptionList`

Query (all optional): `page`, `per_page` (max 200), `subscription_id`, `cust_type_cd`, `customer_id`, `branch_id`, `tr_status_cd`, `from_date`, `to_date`, `keyword`.

```php
$pdo = DB::connection('tenant')->getPdo();
$stmt = $pdo->prepare('CALL USP_SHARE_SUBSCRIPTION_LIST(?,?,?,?,?,?,?,?,?,?)');
$stmt->execute([
    $r->subscription_id, $r->cust_type_cd, $r->customer_id,
    $user->is_head ? $r->branch_id : $user->branch_id,
    $r->tr_status_cd, $r->from_date, $r->to_date, $r->keyword,
    $r->integer('page', 1), min($r->integer('per_page', 50), 200),
]);
$meta = $stmt->fetch(PDO::FETCH_ASSOC);       // total, page, per_page, last_page
$stmt->nextRowset();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
return response()->json(['success' => true, 'message' => 'OK', 'data' => $rows, 'meta' => $meta]);
```

Row fields: `subscription_id, subscription_no, cust_type_cd, cust_type_desc, customer_id, customer_code, customer_name, branch_id, branch_name, subscription_date, no_of_shares, face_value, subscription_amount, paid_amount, outstanding_amount, payment_mode_cd, payment_mode_desc, trans_ref_no, voucher_id, voucher_no, remarks, tr_status_cd, tr_status_desc, created_by, created_by_name, created_at, approved_by, approved_by_name, approved_at, approval_remarks`.

---

## 4. POST `/api/ShareSubscriptionAdd`

Body:

```json
{
  "cust_type_cd": 2,
  "customer_id": 9050,
  "subscription_date": "2026-10-30",
  "no_of_shares": 100,
  "paid_amount": 1000,
  "payment_mode_cd": 1,
  "trans_ref_no": null,
  "remarks": null
}
```

Laravel validation:

```php
$data = $request->validate([
    'cust_type_cd'      => 'required|integer|in:1,2',
    'customer_id'       => 'required|integer|min:1',
    'subscription_date' => 'required|date_format:Y-m-d|before_or_equal:today',
    'no_of_shares'      => 'required|integer|min:1',
    'paid_amount'       => 'required|numeric|min:0|decimal:0,2',
    'payment_mode_cd'   => 'required|integer|in:1,2,3',
    'trans_ref_no'      => 'nullable|string|max:25|required_if:payment_mode_cd,2,3',
    'remarks'           => 'nullable|string|max:250',
]);
```

Call `USP_SHARE_SUBSCRIPTION_ADD(cust_type_cd, customer_id, subscription_date, no_of_shares, paid_amount, payment_mode_cd, trans_ref_no, remarks, user_id, user_branch_id, user_is_head)`. Face value, amount and `Outstanding_Amount` are calculated inside the procedure. Do **not** accept them from the body.

### Status flow (lookup group 48)

`Tr_Status_Cd` follows `mst_appl_options` group 48 (Trans / Voucher Status):

| Code | Status | Set by | Voucher | Actions on screen |
| --- | --- | --- | --- | --- |
| 1 | Entered | Add | none | View, Verify, Edit, Reject |
| 2 | Approved | Verify | posted | View |
| 3 | Rejected | Reject | none | View |
| 4 | Reversed | (future reversal) | reversed | View |
| 5 | Deleted | (not used yet) | none | View |

Procedure changes needed against the old dump (which used 1 = Approved, 2 = Pending):

- `USP_SHARE_SUBSCRIPTION_ADD`: always insert with `Tr_Status_Cd = 1`, `Approved_By/At = NULL`, and do **not** call `USP_SHARE_VOUCHER_POST`. Remove the maker-checker threshold block (or keep it only to block the save, never to auto-approve). Holding check: `Tr_Status_Cd IN (1, 2)`.
- `USP_SHARE_SUBSCRIPTION_APPROVE`: allow only `Tr_Status_Cd = 1`; Verify sets `2` and posts the voucher; Reject sets `3`. Max-holding re-check sums `Tr_Status_Cd = 2`.
- `USP_SHARE_HOLDING_GET`: approved totals use `Tr_Status_Cd = 2`; `pending_shares` / `pending_amount` use `Tr_Status_Cd = 1`.
- `USP_SHARE_SUBSCRIPTION_LIST`: `tr_status_desc` from group 48:
  `(SELECT MIN(o.Opt_Description) FROM mst_appl_options o WHERE o.Opt_Grp_Id = 48 AND o.Opt_Code = s.Tr_Status_Cd)`.
- `USP_SHARE_VOUCHER_BACKFILL`: `WHERE Tr_Status_Cd = 2 AND Voucher_Id IS NULL`.
- Data fix for rows saved under the old meaning (run once, check first):

```sql
-- old 1 (approved, voucher posted) -> 2 ; old 2 (pending) -> 1
UPDATE trans_share_subscription
SET Tr_Status_Cd = CASE Tr_Status_Cd WHEN 1 THEN 2 WHEN 2 THEN 1 ELSE Tr_Status_Cd END
WHERE Tr_Status_Cd IN (1, 2) AND Created_At < '<deploy time>';
```

Rows with a `Voucher_Id` must end up as 2 (Approved); the screen only offers Verify / Edit / Reject on code 1.

---

## 5. GET `/api/ShareHoldingGet`

Query: `cust_type_cd`, `customer_id`. Call `USP_SHARE_HOLDING_GET(cust_type_cd, customer_id)`.
Also check branch access in Laravel (the procedure does not): non-head users may only read subscribers of their branch.

Returns: `cust_type_cd, customer_id, face_value, min_shares, max_shares, total_shares, total_amount, paid_amount, outstanding_amount, share_capital, pending_shares, pending_amount, last_subscription_date`.

---

## 6. POST `/api/ShareSubscriptionEdit` (new)

Only **Entered** rows (`Tr_Status_Cd = 1`) can be edited. The subscriber cannot be changed; reject and add a new one instead. No voucher exists yet for an entered row, so nothing has to be reversed.

Body:

```json
{
  "subscription_id": 12,
  "subscription_date": "2026-10-30",
  "no_of_shares": 120,
  "paid_amount": 600,
  "payment_mode_cd": 2,
  "trans_ref_no": "CHQ-004512",
  "remarks": "Corrected share count"
}
```

Validation: same as Add, plus `'subscription_id' => 'required|integer|min:1'`, and without `cust_type_cd` / `customer_id`.

### Procedure

```sql
DELIMITER ;;
CREATE PROCEDURE USP_SHARE_SUBSCRIPTION_EDIT(
    IN p_subscription_id BIGINT,
    IN p_subscription_date DATE,
    IN p_no_of_shares INT,
    IN p_paid_amount DECIMAL(10,2),
    IN p_payment_mode_cd INT,
    IN p_trans_ref_no VARCHAR(25),
    IN p_remarks VARCHAR(250),
    IN p_user_id INT,
    IN p_user_branch_id INT,
    IN p_user_is_head TINYINT
)
BEGIN
    DECLARE v_err VARCHAR(255) DEFAULT NULL;
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_status INT DEFAULT NULL;
    DECLARE v_branch INT DEFAULT NULL;
    DECLARE v_cust_type INT DEFAULT NULL;
    DECLARE v_customer INT DEFAULT NULL;
    DECLARE v_face DECIMAL(8,2) DEFAULT 0;
    DECLARE v_min INT DEFAULT NULL;
    DECLARE v_max INT DEFAULT 0;
    DECLARE v_max_back INT DEFAULT 0;
    DECLARE v_allow_prev INT DEFAULT 0;
    DECLARE v_day_end INT DEFAULT 0;
    DECLARE v_held INT DEFAULT 0;
    DECLARE v_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_ref VARCHAR(25);
    DECLARE v_remarks VARCHAR(250);

    SET v_ref = NULLIF(TRIM(IFNULL(p_trans_ref_no, '')), '');
    SET v_remarks = NULLIF(TRIM(IFNULL(p_remarks, '')), '');

    SELECT COUNT(*), MAX(Tr_Status_Cd), MAX(Branch_Id), MAX(Cust_Type_Cd), MAX(Customer_Id)
    INTO v_cnt, v_status, v_branch, v_cust_type, v_customer
    FROM trans_share_subscription WHERE Subscription_Id = p_subscription_id FOR UPDATE;

    IF p_subscription_id IS NULL OR v_cnt = 0 THEN
        SET v_err = 'Share subscription not found';
    ELSEIF v_status <> 1 THEN
        SET v_err = 'Only entered subscriptions can be edited';
    ELSEIF IFNULL(p_user_is_head, 0) <> 1 AND NOT (v_branch <=> p_user_branch_id) THEN
        SET v_err = 'Subscription belongs to another branch';
    ELSEIF p_no_of_shares IS NULL OR p_no_of_shares <= 0 THEN
        SET v_err = 'Number of shares must be greater than 0';
    ELSEIF p_paid_amount IS NULL OR p_paid_amount < 0 THEN
        SET v_err = 'Amount paid cannot be negative';
    ELSEIF p_payment_mode_cd IS NULL OR p_payment_mode_cd NOT IN (1, 2, 3) THEN
        SET v_err = 'Payment mode must be Cash, Bank Cheque or Bank Transfer';
    ELSEIF p_payment_mode_cd IN (2, 3) AND v_ref IS NULL THEN
        SET v_err = 'Reference no is required for cheque and bank transfer';
    END IF;

    IF v_err IS NULL THEN
        SELECT IFNULL(MAX(IF(Id = 5, Value, NULL)), 0),
               MAX(IF(Id = 6, Value, NULL)),
               IFNULL(MAX(IF(Id = 7, Value, NULL)), 0),
               IFNULL(MAX(IF(Id = 2, Value, NULL)), 0)
        INTO v_face, v_min, v_max, v_max_back
        FROM mst_settings_global WHERE Id IN (2, 5, 6, 7);

        SELECT IFNULL(MAX(IF(Code = 'AllowPrev', Status, NULL)), 0),
               IFNULL(MAX(IF(Code = 'DayEnd', Status, NULL)), 0)
        INTO v_allow_prev, v_day_end
        FROM mst_settings_general;

        -- holding without this row
        SELECT IFNULL(SUM(No_Of_Shares), 0) INTO v_held
        FROM trans_share_subscription
        WHERE Cust_Type_Cd = v_cust_type AND Customer_Id = v_customer
          AND Tr_Status_Cd IN (1, 2) AND Subscription_Id <> p_subscription_id
        FOR UPDATE;

        SET v_amount = ROUND(p_no_of_shares * v_face, 2);

        IF v_face <= 0 THEN
            SET v_err = 'Share face value is not configured';
        ELSEIF v_min IS NOT NULL AND p_no_of_shares < v_min THEN
            SET v_err = CONCAT('At least ', v_min, ' shares are required');
        ELSEIF v_max > 0 AND v_held + p_no_of_shares > v_max THEN
            SET v_err = CONCAT('Holding cannot go above ', v_max, ' shares (', GREATEST(v_max - v_held, 0), ' more allowed)');
        ELSEIF p_paid_amount > v_amount THEN
            SET v_err = CONCAT('Amount paid cannot be more than ', FORMAT(v_amount, 2));
        ELSEIF p_subscription_date IS NULL THEN
            SET v_err = 'Subscription date is required';
        ELSEIF p_subscription_date > CURDATE() THEN
            SET v_err = 'Subscription date cannot be in the future';
        ELSEIF p_subscription_date < CURDATE() AND v_allow_prev <> 1 THEN
            SET v_err = 'Backdated entries are not allowed';
        ELSEIF p_subscription_date < CURDATE() AND v_max_back > 0
               AND DATEDIFF(CURDATE(), p_subscription_date) > v_max_back THEN
            SET v_err = CONCAT('Subscription date can be at most ', v_max_back, ' day(s) back');
        ELSEIF NOT EXISTS (SELECT 1 FROM mst_fin_year WHERE Is_Active = 1
                           AND p_subscription_date BETWEEN Start_Date AND End_Date) THEN
            SET v_err = 'Subscription date is outside the active financial year';
        END IF;
    END IF;

    IF v_err IS NULL AND v_day_end = 1 THEN
        SELECT COUNT(*) INTO v_cnt FROM trans_sod_eod
        WHERE Branch_Id = v_branch AND DATE(SOD) = p_subscription_date AND EOD IS NULL;
        IF v_cnt = 0 THEN
            SET v_err = 'Branch day is not open for the subscription date';
        END IF;
    END IF;

    IF v_err IS NOT NULL THEN
        SELECT 'ERROR' AS status, NULL AS subscription_id, v_err AS message;
    ELSE
        UPDATE trans_share_subscription
        SET Subscription_Date   = p_subscription_date,
            No_Of_Shares        = p_no_of_shares,
            Face_Value          = v_face,
            Subscription_Amount = v_amount,
            Paid_Amount         = p_paid_amount,
            Outstanding_Amount  = v_amount,
            Payment_Mode_Cd     = p_payment_mode_cd,
            Trans_Ref_No        = v_ref,
            Remarks             = v_remarks
        WHERE Subscription_Id = p_subscription_id AND Tr_Status_Cd = 1;

        SELECT 'SUCCESS' AS status, p_subscription_id AS subscription_id,
               'Share subscription updated' AS message;
    END IF;
END ;;
DELIMITER ;
```

Write an audit row to `trans_audit_log` (module `ShareSubscription`, table `trans_share_subscription`) with the old and new values, as the other modules do.

---

## 7. POST `/api/ShareSubscriptionApprove` (Verify / Reject)

The screen's **Verify** button sends `approve: true`; **Reject** sends `approve: false` with a reason.

```json
{ "subscription_id": 12, "approve": true, "remarks": "Cash counted" }
```

```php
$data = $request->validate([
    'subscription_id' => 'required|integer|min:1',
    'approve'         => 'required|boolean',
    'remarks'         => 'nullable|string|max:200|required_if:approve,false',
]);
```

Call `USP_SHARE_SUBSCRIPTION_APPROVE(subscription_id, approve ? 1 : 0, remarks, user_id, user_branch_id, user_is_head)`. It already:

- allows only `Tr_Status_Cd = 1` (Entered);
- checks branch access;
- requires the user to have a role listed in `Checker_Role_Id` (currently role **2**);
- blocks the maker from verifying their own entry when `DualAuth_Req = 1`;
- requires a reason to reject;
- re-checks the maximum holding on verify;
- Verify: sets status 2 (Approved) and posts the voucher (`USP_SHARE_VOUCHER_POST`). Reject: sets status 3, no voucher.

So for testing, the person who verifies must be a different user from the maker and must have role 2 in `mst_user_role`.

### Voucher posted on Verify

| Line | Ledger | Debit | Credit |
| --- | --- | --- | --- |
| Contra | Cash (101) or Bank (102) by payment mode | `Paid_Amount` | |
| Share receivable | Ledger 107 | `Outstanding_Amount − Paid_Amount` | |
| Share capital | Ledger 106 | | `Outstanding_Amount` |

---

## 8. Test checklist

1. Add 10 shares → row is **Entered** (1), no voucher; View / Verify / Edit / Reject visible.
2. Edit it to 20 shares, paid 100 → `Subscription_Amount = Outstanding_Amount = 200.00`, `Paid_Amount = 100.00`.
3. Edit with paid 300 → 422 "Amount paid cannot be more than 200.00".
4. Edit an Approved row through the API → 422 "Only entered subscriptions can be edited".
5. Verify as the maker → 422 (dual authorisation). Verify as another user with role 2 → status 2, voucher posted, only View remains.
6. Reject without a reason → 422. With a reason → status 3, no voucher.
7. Non-head user from another branch: list does not show the row; edit / verify return 422.
