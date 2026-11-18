# Member registration: multiple nominees and admission fee voucher

Backend guide for two changes to `POST /api/MemberAdd` and `POST /api/MemberEdit`:

1. A member can have **up to 4 nominees** (same limit as `USP_DEPOSIT_NOMINEE_ADD_EDIT`).
2. Saving a member with `adm_fees > 0` **posts a receipt voucher**: Dr Cash/Bank, Cr Admission Fee Income.

Everything is based on `priomicro_basundhara.sql`. MySQL 8 is required (`JSON_TABLE`).

---

## 1. What the portal sends

The BFF (`src/app/api/onboarding/member-registration/route.ts`) validates and forwards this body. Existing fields are unchanged. `nominees` is new:

```json
{
  "member_id": 25,
  "member_name": "Rina Das",
  "adm_fees": 100,
  "nominee_name": "Sujit Das",
  "nominee_relation": "2",
  "nominee_dob": "1990-04-12",
  "nominee_mobile": "9876543210",
  "nominees": [
    { "nominee_name": "Sujit Das", "nominee_rel_cd": 2, "nominee_dob": "1990-04-12", "nominee_mobile": "9876543210", "share_percent": 60 },
    { "nominee_name": "Mitu Das",  "nominee_rel_cd": 4, "nominee_dob": null,         "nominee_mobile": null,         "share_percent": 40 }
  ]
}
```

Rules, which the portal checks and the database **must** check again:

| Rule | Detail |
| --- | --- |
| Count | 0 to 4 nominees. `[]` means "remove all nominees". If `nominees` is missing, leave the nominees as they are. |
| Name | Required, max 150 characters |
| Relation | Required, active `mst_appl_options` group 35, not 9 (Self) |
| Date of birth | Optional, `Y-m-d`, not in the future |
| Mobile | Optional, `^[6-9][0-9]{9}$` |
| Share | 1 nominee: empty (stored as 100) or 100. 2 or more: required for every nominee, each > 0, total exactly 100.00 |
| Duplicates | The same name and relation cannot appear twice |

The first nominee is still sent in the old `nominee_*` fields, so `USP_MEMBER_ADD_EDIT` keeps working unchanged.

The portal reads these fields back from `MemberList`, `MemberAdd` and `MemberEdit`:

```json
{
  "member_id": 25,
  "adm_fees": 100,
  "adm_fee_voucher_no": "RCPT/2026/000123",
  "nominees": [
    { "member_nominee_id": 3, "nominee_name": "Sujit Das", "nominee_rel_cd": 2, "relation_desc": "Husband", "nominee_dob": "1990-04-12", "nominee_mobile": "9876543210", "share_percent": 60 }
  ]
}
```

If `nominees` is not returned, the portal falls back to the single `nominee_*` columns.

---

## 2. Database: nominees

### 2.1 Table

```sql
CREATE TABLE `mst_member_nominee` (
  `Member_Nominee_Id` int NOT NULL AUTO_INCREMENT,
  `Member_Id` int NOT NULL,
  `Nominee_Name` varchar(150) NOT NULL,
  `Nominee_Rel_Cd` tinyint NOT NULL,
  `Nominee_DOB` date DEFAULT NULL,
  `Nominee_Mobile` varchar(20) DEFAULT NULL,
  `Share_Percent` decimal(5,2) NOT NULL DEFAULT '100.00',
  `Sort_Order` tinyint NOT NULL DEFAULT '1',
  `Is_Active` tinyint(1) NOT NULL DEFAULT '1',
  `Created_By` smallint DEFAULT NULL,
  `Created_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_By` smallint DEFAULT NULL,
  `Updated_At` datetime DEFAULT NULL,
  PRIMARY KEY (`Member_Nominee_Id`),
  KEY `idx_member_nominee_member` (`Member_Id`, `Is_Active`),
  CONSTRAINT `fk_member_nominee_member` FOREIGN KEY (`Member_Id`) REFERENCES `mst_member` (`Member_Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

Old rows are soft-deleted (`Is_Active = 0`), not deleted, so history is kept for claims.

### 2.2 Migrate the existing single nominee

Run this once:

```sql
INSERT INTO mst_member_nominee
    (Member_Id, Nominee_Name, Nominee_Rel_Cd, Nominee_DOB, Nominee_Mobile, Share_Percent, Sort_Order, Is_Active, Created_By, Created_At)
SELECT m.Member_Id, m.Nominee_Name, m.Nominee_Rel_Cd, m.Nominee_DOB, m.Nominee_Mobile, 100.00, 1, 1, m.Created_By, NOW()
FROM mst_member m
WHERE NULLIF(TRIM(IFNULL(m.Nominee_Name, '')), '') IS NOT NULL
  AND m.Nominee_Rel_Cd IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM mst_member_nominee n WHERE n.Member_Id = m.Member_Id);
```

Keep the `Nominee_*` columns on `mst_member`. The procedure below keeps them in sync with nominee 1, so old reports keep working.

### 2.3 `USP_MEMBER_NOMINEE_SAVE`

This replaces the member's active nominee list in a single call.

```sql
DROP PROCEDURE IF EXISTS USP_MEMBER_NOMINEE_SAVE;
DELIMITER ;;
CREATE PROCEDURE USP_MEMBER_NOMINEE_SAVE(
    IN p_member_id INT,
    IN p_nominees JSON,
    IN p_user_id INT
)
proc: BEGIN
    DECLARE v_err VARCHAR(255) DEFAULT NULL;
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_bad INT DEFAULT 0;
    DECLARE v_total DECIMAL(9,2) DEFAULT 0;
    DECLARE v_missing_share INT DEFAULT 0;

    IF NOT EXISTS (SELECT 1 FROM mst_member WHERE Member_Id = p_member_id) THEN
        SELECT 'ERROR' AS status, p_member_id AS member_id, 'Member not found' AS message;
        LEAVE proc;
    END IF;

    IF p_nominees IS NULL OR JSON_TYPE(p_nominees) <> 'ARRAY' THEN
        SELECT 'ERROR' AS status, p_member_id AS member_id, 'Nominees must be a list' AS message;
        LEAVE proc;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_member_nominees;
    CREATE TEMPORARY TABLE tmp_member_nominees AS
    SELECT jt.ord,
           NULLIF(TRIM(IFNULL(jt.nominee_name, '')), '') AS nominee_name,
           jt.nominee_rel_cd,
           jt.nominee_dob,
           NULLIF(TRIM(IFNULL(jt.nominee_mobile, '')), '') AS nominee_mobile,
           jt.share_percent
    FROM JSON_TABLE(p_nominees, '$[*]' COLUMNS (
        ord FOR ORDINALITY,
        nominee_name VARCHAR(200) PATH '$.nominee_name',
        nominee_rel_cd INT PATH '$.nominee_rel_cd',
        nominee_dob DATE PATH '$.nominee_dob',
        nominee_mobile VARCHAR(30) PATH '$.nominee_mobile',
        share_percent DECIMAL(9,2) PATH '$.share_percent'
    )) jt;

    SELECT COUNT(*),
           SUM(nominee_name IS NULL OR CHAR_LENGTH(nominee_name) > 150
               OR nominee_rel_cd IS NULL
               OR nominee_dob > CURDATE()
               OR (nominee_mobile IS NOT NULL AND nominee_mobile NOT REGEXP '^[6-9][0-9]{9}$')
               OR (share_percent IS NOT NULL AND (share_percent <= 0 OR share_percent > 100))),
           IFNULL(SUM(share_percent), 0),
           SUM(share_percent IS NULL)
    INTO v_cnt, v_bad, v_total, v_missing_share
    FROM tmp_member_nominees;

    IF v_cnt > 4 THEN
        SET v_err = 'A member can have at most 4 nominees';
    ELSEIF IFNULL(v_bad, 0) > 0 THEN
        SET v_err = 'One or more nominee details are invalid';
    END IF;

    IF v_err IS NULL AND v_cnt > 0 THEN
        SELECT COUNT(*) INTO v_bad
        FROM tmp_member_nominees t
        LEFT JOIN mst_appl_options o
               ON o.Opt_Grp_Id = 35 AND o.Opt_Code = t.nominee_rel_cd AND o.Is_Active = 1
        WHERE o.Option_Id IS NULL OR t.nominee_rel_cd = 9;
        IF v_bad > 0 THEN
            SET v_err = 'Invalid nominee relation';
        END IF;
    END IF;

    IF v_err IS NULL AND v_cnt > 1 THEN
        SELECT COUNT(*) INTO v_bad
        FROM (SELECT 1 FROM tmp_member_nominees
              GROUP BY LOWER(nominee_name), nominee_rel_cd HAVING COUNT(*) > 1) d;
        IF v_bad > 0 THEN
            SET v_err = 'The same nominee is added more than once';
        ELSEIF v_missing_share > 0 THEN
            SET v_err = 'Enter a share percentage for every nominee';
        ELSEIF v_total <> 100.00 THEN
            SET v_err = CONCAT('Nominee shares must total 100% (now ', v_total, '%)');
        END IF;
    ELSEIF v_err IS NULL AND v_cnt = 1 AND v_missing_share = 0 AND v_total <> 100.00 THEN
        SET v_err = 'A single nominee must have a 100% share';
    END IF;

    IF v_err IS NOT NULL THEN
        DROP TEMPORARY TABLE IF EXISTS tmp_member_nominees;
        SELECT 'ERROR' AS status, p_member_id AS member_id, v_err AS message;
        LEAVE proc;
    END IF;

    UPDATE mst_member_nominee
    SET Is_Active = 0, Updated_By = p_user_id, Updated_At = NOW()
    WHERE Member_Id = p_member_id AND Is_Active = 1;

    INSERT INTO mst_member_nominee
        (Member_Id, Nominee_Name, Nominee_Rel_Cd, Nominee_DOB, Nominee_Mobile, Share_Percent, Sort_Order, Is_Active, Created_By, Created_At)
    SELECT p_member_id, nominee_name, nominee_rel_cd, nominee_dob, nominee_mobile,
           IFNULL(share_percent, 100.00), ord, 1, p_user_id, NOW()
    FROM tmp_member_nominees
    ORDER BY ord;

    -- Keep the legacy single-nominee columns equal to nominee 1.
    UPDATE mst_member m
    LEFT JOIN mst_member_nominee n
           ON n.Member_Id = m.Member_Id AND n.Is_Active = 1 AND n.Sort_Order = 1
    SET m.Nominee_Name = n.Nominee_Name,
        m.Nominee_Rel_Cd = n.Nominee_Rel_Cd,
        m.Nominee_DOB = n.Nominee_DOB,
        m.Nominee_Mobile = n.Nominee_Mobile
    WHERE m.Member_Id = p_member_id;

    DROP TEMPORARY TABLE IF EXISTS tmp_member_nominees;

    SELECT 'SUCCESS' AS status, p_member_id AS member_id, v_cnt AS nominee_count,
           'Nominees saved successfully' AS message;
END ;;
DELIMITER ;
```

### 2.4 `USP_MEMBER_NOMINEE_LIST`

This takes a comma-separated list of member ids, so the member list loads nominees for a whole page in one query.

```sql
DROP PROCEDURE IF EXISTS USP_MEMBER_NOMINEE_LIST;
DELIMITER ;;
CREATE PROCEDURE USP_MEMBER_NOMINEE_LIST(IN p_member_ids VARCHAR(4000))
BEGIN
    SELECT n.Member_Nominee_Id AS member_nominee_id,
           n.Member_Id         AS member_id,
           n.Nominee_Name      AS nominee_name,
           n.Nominee_Rel_Cd    AS nominee_rel_cd,
           o.Opt_Description   AS relation_desc,
           n.Nominee_DOB       AS nominee_dob,
           n.Nominee_Mobile    AS nominee_mobile,
           n.Share_Percent     AS share_percent,
           n.Sort_Order        AS sort_order
    FROM mst_member_nominee n
    LEFT JOIN mst_appl_options o ON o.Opt_Grp_Id = 35 AND o.Opt_Code = n.Nominee_Rel_Cd
    WHERE n.Is_Active = 1
      AND FIND_IN_SET(n.Member_Id, p_member_ids) > 0
    ORDER BY n.Member_Id, n.Sort_Order;
END ;;
DELIMITER ;
```

In `MemberList`, collect the page's `member_id` values and call this once. Then attach each member's rows as `nominees`. Do not call it once per row.

---

## 3. Database: admission fee voucher

### 3.1 Setup

```sql
-- Income ledger for admission fees. 0 = auto-create on first post.
INSERT INTO mst_settings_global (Id, Purpose, Value)
VALUES (108, 'Member Voucher: Admission Fee Income Ledger Id', 0)
ON DUPLICATE KEY UPDATE Purpose = VALUES(Purpose);

ALTER TABLE mst_member
  ADD COLUMN `Adm_Fee_Pay_Mode_Cd` tinyint DEFAULT NULL AFTER `Adm_Fees`,
  ADD COLUMN `Adm_Fee_Voucher_Id` bigint DEFAULT NULL AFTER `Adm_Fee_Pay_Mode_Cd`,
  ADD KEY `idx_member_adm_voucher` (`Adm_Fee_Voucher_Id`);
```

The payment mode uses `mst_appl_options` group 41: 1 Cash, 2 Bank Cheque, 3 Bank Transfer. `USP_LOAN_VOUCHER_POST` maps 1 to the Cash ledger (setting 101) and 2 or 3 to the Bank ledger (setting 102).

### 3.2 Accounting entry

| Line | Ledger | Debit | Credit |
| --- | --- | --- | --- |
| CONTRA | Cash in Hand (101) or Bank (102) | Admission fee | |
| ADM_FEE | Admission Fee Income (108) | | Admission fee |

Voucher type 1 (Receipt). The date is the member's `Joining_Date`, or today if that is empty. It must fall inside a `mst_fin_year`.

### 3.3 `USP_MEMBER_ADM_FEE_VOUCHER_POST`

Call this after every successful member add or edit. It is idempotent:

| Situation | Result |
| --- | --- |
| No fee and no voucher | Nothing posted |
| Fee > 0 and no voucher | Post a new voucher |
| Voucher exists, same amount and mode | Nothing changes |
| Voucher exists, amount or mode changed | Reverse the old voucher, then post a new one |
| Voucher exists, fee cleared to 0 or empty | Reverse the old voucher |

```sql
DROP PROCEDURE IF EXISTS USP_MEMBER_ADM_FEE_VOUCHER_POST;
DELIMITER ;;
CREATE PROCEDURE USP_MEMBER_ADM_FEE_VOUCHER_POST(
    IN p_member_id INT,
    IN p_payment_mode INT,
    IN p_user_id INT
)
proc: BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_branch INT;
    DECLARE v_date DATE;
    DECLARE v_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_old_vid BIGINT;
    DECLARE v_old_mode INT;
    DECLARE v_old_amount DECIMAL(12,2);
    DECLARE v_code VARCHAR(25);
    DECLARE v_name VARCHAR(150);
    DECLARE v_mode INT;
    DECLARE v_income INT;
    DECLARE v_contra INT;
    DECLARE v_vid BIGINT;
    DECLARE v_vno VARCHAR(25);
    DECLARE v_note VARCHAR(255);
    DECLARE v_rev_id BIGINT;
    DECLARE v_rev_no VARCHAR(25);

    SET v_mode = IFNULL(p_payment_mode, 1);
    IF v_mode NOT IN (1, 2, 3) THEN
        SELECT 'ERROR' AS status, p_member_id AS member_id, 'Invalid admission fee payment mode' AS message;
        LEAVE proc;
    END IF;

    SELECT COUNT(*), MAX(Branch_Id), MAX(IFNULL(Joining_Date, CURDATE())), MAX(IFNULL(Adm_Fees, 0)),
           MAX(Adm_Fee_Voucher_Id), MAX(Adm_Fee_Pay_Mode_Cd), MAX(Member_Code), MAX(Member_Name)
    INTO v_cnt, v_branch, v_date, v_amount, v_old_vid, v_old_mode, v_code, v_name
    FROM mst_member WHERE Member_Id = p_member_id FOR UPDATE;

    IF v_cnt = 0 THEN
        SELECT 'ERROR' AS status, p_member_id AS member_id, 'Member not found' AS message;
        LEAVE proc;
    END IF;

    IF v_old_vid IS NOT NULL THEN
        SELECT MAX(Total_Debit) INTO v_old_amount
        FROM trans_vouchers WHERE Voucher_Id = v_old_vid AND Vou_Status_Cd <> 4;

        IF v_old_amount IS NOT NULL AND v_old_amount = v_amount AND IFNULL(v_old_mode, 1) = v_mode THEN
            SELECT 'SUCCESS' AS status, p_member_id AS member_id, v_old_vid AS voucher_id,
                   (SELECT Vou_No_Ref FROM trans_vouchers WHERE Voucher_Id = v_old_vid) AS voucher_no,
                   'Admission fee voucher unchanged' AS message;
            LEAVE proc;
        END IF;

        IF v_old_amount IS NOT NULL THEN
            CALL USP_LOAN_VOUCHER_REVERSE(v_old_vid, CURDATE(), p_user_id, v_rev_id, v_rev_no);
        END IF;
        UPDATE mst_member SET Adm_Fee_Voucher_Id = NULL WHERE Member_Id = p_member_id;
    END IF;

    IF v_amount <= 0 THEN
        UPDATE mst_member SET Adm_Fee_Pay_Mode_Cd = NULL WHERE Member_Id = p_member_id;
        SELECT 'SUCCESS' AS status, p_member_id AS member_id, NULL AS voucher_id, NULL AS voucher_no,
               IF(v_rev_id IS NULL, 'No admission fee to post', 'Admission fee voucher reversed') AS message;
        LEAVE proc;
    END IF;

    CALL USP_SHARE_LEDGER_ENSURE(108, 'SYS-ADMISSION-FEE', 'Admission Fee Income', 'I',
                                 'SYS-MEMBER-FEES', 'Member Fees', 'Income', 'CR', p_user_id, v_income);
    IF v_mode = 1 THEN
        CALL USP_SHARE_LEDGER_ENSURE(101, 'SYS-CASH', 'Cash in Hand', 'A',
                                     'SYS-CASH-BANK', 'Cash and Bank Balances', 'Assets', 'DR', p_user_id, v_contra);
    ELSE
        CALL USP_SHARE_LEDGER_ENSURE(102, 'SYS-BANK', 'Bank Account', 'A',
                                     'SYS-CASH-BANK', 'Cash and Bank Balances', 'Assets', 'DR', p_user_id, v_contra);
    END IF;

    CALL USP_LOAN_VOUCHER_RESET();
    INSERT INTO tmp_loan_voucher_lines (Line_Role, GL_Account_Id, Debit_Amount, Credit_Amount, Line_Narration)
    VALUES ('CONTRA',  v_contra, v_amount, 0, LEFT(CONCAT('Admission fee received from ', v_name, ' (', v_code, ')'), 300)),
           ('ADM_FEE', v_income, 0, v_amount, LEFT(CONCAT('Admission fee: ', v_code), 300));

    CALL USP_LOAN_VOUCHER_POST(v_branch, v_date, 1, v_mode,
                               LEFT(CONCAT('Member admission fee - ', v_code, ' ', v_name), 255),
                               p_user_id, v_vid, v_vno, v_note);

    IF v_vid IS NULL THEN
        SELECT 'ERROR' AS status, p_member_id AS member_id, NULL AS voucher_id, NULL AS voucher_no,
               IFNULL(v_note, 'Admission fee voucher not posted') AS message;
        LEAVE proc;
    END IF;

    UPDATE mst_member
    SET Adm_Fee_Voucher_Id = v_vid, Adm_Fee_Pay_Mode_Cd = v_mode
    WHERE Member_Id = p_member_id;

    SELECT 'SUCCESS' AS status, p_member_id AS member_id, v_vid AS voucher_id, v_vno AS voucher_no,
           'Admission fee voucher posted' AS message;
END ;;
DELIMITER ;
```

### 3.4 Return the voucher number in `USP_MEMBER_LIST`

Add this join and column so the member drawer shows "Admission Fee Voucher":

```sql
LEFT JOIN trans_vouchers adv ON adv.Voucher_Id = m.Adm_Fee_Voucher_Id AND adv.Vou_Status_Cd <> 4
-- select list:
adv.Vou_No_Ref AS adm_fee_voucher_no,
m.Adm_Fee_Pay_Mode_Cd AS adm_fee_pay_mode_cd,
```

---

## 4. Laravel

### 4.1 Validation (MemberAdd and MemberEdit)

```php
'nominees'                  => ['sometimes', 'array', 'max:4'],
'nominees.*.nominee_name'   => ['required', 'string', 'max:150'],
'nominees.*.nominee_rel_cd' => ['required', 'integer', 'min:1'],
'nominees.*.nominee_dob'    => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
'nominees.*.nominee_mobile' => ['nullable', 'regex:/^[6-9][0-9]{9}$/'],
'nominees.*.share_percent'  => ['nullable', 'numeric', 'gt:0', 'max:100'],
'adm_fees'                  => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
'adm_fee_pay_mode_cd'       => ['nullable', 'integer', 'in:1,2,3'],
```

Keep the existing branch check: a non-head user can only add or edit members of their own branch.

### 4.2 One transaction per save

The member, its nominees and its voucher must succeed or fail together. A member must never exist with an admission fee and no voucher.

```php
public function save(MemberSaveRequest $request, bool $isEdit)
{
    $userId = $request->user()->id;

    return DB::transaction(function () use ($request, $isEdit, $userId) {
        // Existing call, unchanged: 37 parameters, p_action … p_user_id.
        $row = DB::selectOne('CALL USP_MEMBER_ADD_EDIT(' . implode(',', array_fill(0, 37, '?')) . ')', [
            $isEdit ? 'EDIT' : 'ADD',
            // ...existing parameters in the same order as today...
        ]);
        if (($row->status ?? null) !== 'SUCCESS') {
            throw ValidationException::withMessages(['member' => [$row->message ?? 'Member not saved']]);
        }
        $memberId = (int) $row->member_id;

        if ($request->has('nominees')) {
            $nominees = collect($request->input('nominees', []))->map(fn ($n) => [
                'nominee_name'   => trim($n['nominee_name']),
                'nominee_rel_cd' => (int) $n['nominee_rel_cd'],
                'nominee_dob'    => $n['nominee_dob'] ?? null,
                'nominee_mobile' => $n['nominee_mobile'] ?? null,
                'share_percent'  => isset($n['share_percent']) ? round((float) $n['share_percent'], 2) : null,
            ])->values();

            $saved = DB::selectOne('CALL USP_MEMBER_NOMINEE_SAVE(?, ?, ?)', [$memberId, $nominees->toJson(), $userId]);
            if (($saved->status ?? null) !== 'SUCCESS') {
                throw ValidationException::withMessages(['nominees' => [$saved->message]]);
            }
        }

        $voucher = DB::selectOne('CALL USP_MEMBER_ADM_FEE_VOUCHER_POST(?, ?, ?)', [
            $memberId,
            $request->integer('adm_fee_pay_mode_cd') ?: 1,
            $userId,
        ]);
        if (($voucher->status ?? null) !== 'SUCCESS') {
            throw ValidationException::withMessages(['adm_fees' => [$voucher->message]]);
        }

        return response()->json([
            'success' => true,
            'message' => $row->message,
            'data'    => $this->memberWithNominees($memberId), // same shape as one MemberList row
        ]);
    });
}
```

Notes:

- `USP_MEMBER_ADD_EDIT` does not need changes. It still writes the old `nominee_*` columns, and `USP_MEMBER_NOMINEE_SAVE` then makes them match nominee 1.
- The response `message` from the procedures is shown to the user. Keep it short and free of SQL details.
- Return validation failures as HTTP 422 with `errors.nominees` or `errors.adm_fees`. The portal shows the message in the form.

### 4.3 MemberList

After loading the page, call `USP_MEMBER_NOMINEE_LIST(implode(',', $memberIds))`. Group the rows by `member_id` and add them to each member as `nominees`. Also return `adm_fee_voucher_no` (section 3.4).

---

## 5. Test checklist

Nominees:

- [ ] Add a member with 1 nominee and no share. One row is saved with `Share_Percent = 100`, and the `mst_member.Nominee_*` columns match it.
- [ ] Add a member with 3 nominees (50 / 30 / 20). Three active rows are saved, with `Sort_Order` 1–3.
- [ ] Shares 50 / 30 are rejected with "must total 100%".
- [ ] A fifth nominee is rejected, both by the BFF and by the procedure.
- [ ] The same name and relation twice is rejected.
- [ ] Relation 9 (Self), or a code outside group 35, is rejected.
- [ ] On edit, removing nominee 2 leaves its old row with `Is_Active = 0`, and the active rows are renumbered.
- [ ] On edit with `nominees: []`, all rows are inactive and the `mst_member.Nominee_*` columns are NULL.
- [ ] An old member that was only migrated (section 2.2) opens with 1 nominee in the form.

Admission fee voucher:

- [ ] Add a member with `adm_fees = 100`. A receipt voucher is posted with Dr Cash in Hand 100 and Cr Admission Fee Income 100. `Adm_Fee_Voucher_Id` is set and the drawer shows the voucher number.
- [ ] Add a member with no fee. No voucher is posted.
- [ ] Edit a member without changing the fee. No new voucher is posted.
- [ ] Edit the fee from 100 to 150. The old voucher becomes status 4, a reversal voucher is posted, and a new voucher for 150 is posted.
- [ ] Edit the fee from 100 to empty. The old voucher is reversed and `Adm_Fee_Voucher_Id` is NULL.
- [ ] Use a joining date outside any financial year. The save fails, and no member or nominee rows remain (the transaction is rolled back).
- [ ] Use payment mode 3 with setting 102 = 0. The bank ledger is created automatically and used.
- [ ] A branch user cannot edit, and so cannot post a voucher for, a member of another branch.
