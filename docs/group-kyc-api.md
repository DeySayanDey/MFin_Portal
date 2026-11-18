# Group KYC — Backend API Guide

Screen: **Group Management → row action "KYC"** (`/onboarding/group-management`).
Frontend → Next.js BFF `/api/onboarding/group-kyc` (+ `/file` for images) → Laravel endpoints below, with the user's Bearer token.

`priomicro_basundhara.sql` has KYC only for members (`mst_member_kyc`, `USP_MEMBER_KYC_*`). Group KYC is new and mirrors that design so behaviour is the same on both screens.

| Laravel endpoint | Method | Stored procedure |
| --- | --- | --- |
| `/api/GroupKycList` | GET | `USP_GROUP_KYC_LIST` |
| `/api/GroupKycAdd` | POST | `USP_GROUP_KYC_ADD_EDIT('ADD', …)` |
| `/api/GroupKycEdit` | POST | `USP_GROUP_KYC_ADD_EDIT('EDIT', …)` |
| `/api/GroupKycVerify` | POST | `USP_GROUP_KYC_VERIFY` |
| `/api/GroupKycStatus` | POST | `USP_GROUP_KYC_STATUS` |

---

## 1. Database

### 1.1 Document types — `mst_appl_options` group 50

The highest existing group is 49, so use 50. The frontend reads this group and falls back to the same list if it is empty.

```sql
INSERT INTO mst_appl_options (Opt_Grp_Id, Opt_Group, Opt_Code, Opt_Description, Is_Active, Srl_No) VALUES
(50, 'Group Document Type', 1, 'Registration Certificate', 1, 1),
(50, 'Group Document Type', 2, 'PAN Card', 1, 2),
(50, 'Group Document Type', 3, 'Bank Passbook / Statement', 1, 3),
(50, 'Group Document Type', 4, 'Group Resolution', 1, 4),
(50, 'Group Document Type', 5, 'Bye-laws', 1, 5),
(50, 'Group Document Type', 6, 'GST Certificate', 1, 6),
(50, 'Group Document Type', 7, 'Others', 1, 7);
```

> Check the real column names of `mst_appl_options` (the dump inserts by position: `Option_Id, Opt_Grp_Id, Opt_Group, Opt_Code, Opt_Description, Is_Active, Srl_No`).

Number rules (same in the frontend, the BFF and the procedure):

| Code | Type | Rule after upper-case and removing spaces |
| --- | --- | --- |
| 1 | Registration Certificate | `^[A-Z0-9/.-]{3,50}$` |
| 2 | PAN Card | hyphens removed, `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| 3 | Bank Passbook / Statement | hyphens removed, `^[0-9]{9,18}$` (account number) |
| 4 | Group Resolution | `^[A-Z0-9/.-]{3,50}$` |
| 5 | Bye-laws | `^[A-Z0-9/.-]{3,50}$` |
| 6 | GST Certificate | hyphens removed, `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` |
| 7 | Others | `^[A-Z0-9/.-]{3,50}$` |

### 1.2 Table `mst_group_kyc`

```sql
CREATE TABLE mst_group_kyc (
  Group_Kyc_Id     INT NOT NULL AUTO_INCREMENT,
  Group_Id         SMALLINT NOT NULL,
  Doc_Type_Cd      TINYINT NOT NULL,
  KYC_No           VARCHAR(50) NOT NULL,
  Issue_Date       DATE DEFAULT NULL,
  Expiry_Date      DATE DEFAULT NULL,
  KYC_Verified     TINYINT(1) DEFAULT 0,          -- 0 Pending, 1 Verified, 2 Rejected
  Verify_Remarks   VARCHAR(200) DEFAULT NULL,
  Verified_By      INT DEFAULT NULL,
  Verified_At      DATETIME DEFAULT NULL,
  Photo_Path       VARCHAR(300) DEFAULT NULL,      -- group-kyc/{Group_Id}/{uuid}.jpg|png|pdf
  Back_Photo_Path  VARCHAR(300) DEFAULT NULL,
  Is_Active        BIT(1) DEFAULT b'1',
  Created_By       SMALLINT DEFAULT NULL,
  Created_At       DATETIME DEFAULT CURRENT_TIMESTAMP,
  Updated_By       SMALLINT DEFAULT NULL,
  Updated_At       DATETIME DEFAULT NULL,
  PRIMARY KEY (Group_Kyc_Id),
  KEY ix_group_kyc_group (Group_Id, Doc_Type_Cd),
  KEY ix_group_kyc_doc_no (Doc_Type_Cd, KYC_No),
  CONSTRAINT fk_group_kyc_group FOREIGN KEY (Group_Id) REFERENCES mst_group (Group_Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
```

Rules (same as member KYC):

- One active, non-rejected document per type per group (type 7 "Others" may repeat with different numbers).
- The same document number cannot be active on two groups.
- Verified documents cannot be edited; Reopen (set to Pending, with a reason) first.
- Editing a rejected document sends it back to Pending and clears the rejection.
- Closed groups (`mst_group.Current_Status_Cd = 4`) are read-only.
- Inactive documents cannot be edited, verified or rejected.

---

## 2. Stored procedures

### 2.1 `USP_GROUP_KYC_DUP_CHECK`

```sql
DELIMITER ;;
CREATE PROCEDURE USP_GROUP_KYC_DUP_CHECK(
    IN p_group_kyc_id INT,
    IN p_group_id INT,
    IN p_doc_type_cd INT,
    IN p_kyc_no VARCHAR(50),
    OUT p_err VARCHAR(255)
)
BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_desc VARCHAR(100) DEFAULT NULL;
    DECLARE v_other VARCHAR(50) DEFAULT NULL;

    SET p_err = NULL;
    SELECT MIN(Opt_Description) INTO v_desc
    FROM mst_appl_options WHERE Opt_Grp_Id = 50 AND Opt_Code = p_doc_type_cd;

    SELECT COUNT(*) INTO v_cnt
    FROM mst_group_kyc k
    WHERE k.Group_Id = p_group_id
      AND k.Doc_Type_Cd = p_doc_type_cd
      AND (p_doc_type_cd <> 7 OR k.KYC_No = p_kyc_no)
      AND IFNULL(k.Is_Active, 1) = 1
      AND IFNULL(k.KYC_Verified, 0) <> 2
      AND (p_group_kyc_id IS NULL OR k.Group_Kyc_Id <> p_group_kyc_id);

    IF v_cnt > 0 THEN
        SET p_err = IF(p_doc_type_cd = 7,
            'Group already has this document number',
            CONCAT('Group already has an active ', IFNULL(v_desc, 'document of this type'), '; edit or deactivate it first'));
    END IF;

    IF p_err IS NULL THEN
        SELECT MIN(IFNULL(g.Ref_Code, g.Group_Code)) INTO v_other
        FROM mst_group_kyc k
        JOIN mst_group g ON g.Group_Id = k.Group_Id
        WHERE k.Doc_Type_Cd = p_doc_type_cd
          AND k.KYC_No = p_kyc_no
          AND k.Group_Id <> p_group_id
          AND IFNULL(k.Is_Active, 1) = 1
          AND IFNULL(k.KYC_Verified, 0) <> 2;
        IF v_other IS NOT NULL THEN
            SET p_err = CONCAT('This ', IFNULL(v_desc, 'document'), ' number is already registered for group ', v_other);
        END IF;
    END IF;
END ;;
DELIMITER ;
```

### 2.2 `USP_GROUP_KYC_ADD_EDIT`

```sql
DELIMITER ;;
CREATE PROCEDURE USP_GROUP_KYC_ADD_EDIT(
    IN p_action VARCHAR(10),
    IN p_group_kyc_id INT,
    IN p_group_id INT,
    IN p_doc_type_cd INT,
    IN p_kyc_no VARCHAR(60),
    IN p_issue_date DATE,
    IN p_expiry_date DATE,
    IN p_photo_path VARCHAR(300),
    IN p_back_photo_path VARCHAR(300),
    IN p_user_id INT,
    IN p_user_branch_id INT,
    IN p_user_is_head TINYINT
)
BEGIN
    DECLARE v_err VARCHAR(255) DEFAULT NULL;
    DECLARE v_action VARCHAR(10);
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_group_id INT DEFAULT NULL;
    DECLARE v_status INT DEFAULT NULL;
    DECLARE v_branch INT DEFAULT NULL;
    DECLARE v_formed DATE DEFAULT NULL;
    DECLARE v_cur_verified INT DEFAULT NULL;
    DECLARE v_cur_active INT DEFAULT NULL;
    DECLARE v_no VARCHAR(60);
    DECLARE v_id INT DEFAULT NULL;

    SET v_action = UPPER(TRIM(IFNULL(p_action, '')));
    IF v_action NOT IN ('ADD', 'EDIT') THEN
        SET v_err = 'Action must be ADD or EDIT';
    END IF;

    IF v_err IS NULL AND v_action = 'EDIT' THEN
        SELECT Group_Id, IFNULL(KYC_Verified, 0), IFNULL(Is_Active, 1) + 0
          INTO v_group_id, v_cur_verified, v_cur_active
        FROM mst_group_kyc WHERE Group_Kyc_Id = p_group_kyc_id FOR UPDATE;

        IF v_group_id IS NULL THEN
            SET v_err = 'KYC document not found';
        ELSEIF v_cur_active = 0 THEN
            SET v_err = 'Inactive KYC document cannot be edited; activate it first';
        ELSEIF v_cur_verified = 1 THEN
            SET v_err = 'Verified KYC document cannot be edited; reopen it first';
        END IF;
    ELSEIF v_err IS NULL THEN
        SET v_group_id = p_group_id;
    END IF;

    IF v_err IS NULL THEN
        SELECT COUNT(*), MAX(Current_Status_Cd), MAX(Branch_Id), MAX(Formation_Date)
          INTO v_cnt, v_status, v_branch, v_formed
        FROM mst_group WHERE Group_Id = v_group_id;

        IF v_cnt = 0 THEN
            SET v_err = 'Group not found';
        ELSEIF IFNULL(v_status, 0) = 4 THEN
            SET v_err = 'KYC cannot be changed for a closed group';
        ELSEIF IFNULL(p_user_is_head, 0) <> 1 AND NOT (v_branch <=> p_user_branch_id) THEN
            SET v_err = 'Group belongs to another branch';
        END IF;
    END IF;

    IF v_err IS NULL THEN
        SELECT COUNT(*) INTO v_cnt FROM mst_appl_options
        WHERE Opt_Grp_Id = 50 AND Opt_Code = p_doc_type_cd AND IFNULL(Is_Active, 1) = 1;
        IF p_doc_type_cd IS NULL OR v_cnt = 0 THEN
            SET v_err = 'Invalid document type';
        END IF;
    END IF;

    IF v_err IS NULL THEN
        SET v_no = UPPER(REPLACE(TRIM(IFNULL(p_kyc_no, '')), ' ', ''));
        IF p_doc_type_cd IN (2, 3, 6) THEN
            SET v_no = REPLACE(v_no, '-', '');
        END IF;

        IF v_no = '' THEN
            SET v_err = 'Document number is required';
        ELSEIF CHAR_LENGTH(v_no) > 50 THEN
            SET v_err = 'Document number cannot exceed 50 characters';
        ELSEIF p_doc_type_cd = 2 AND v_no NOT REGEXP '^[A-Z]{5}[0-9]{4}[A-Z]$' THEN
            SET v_err = 'PAN must be 5 letters, 4 digits and 1 letter (e.g. AAAAA1234A)';
        ELSEIF p_doc_type_cd = 3 AND v_no NOT REGEXP '^[0-9]{9,18}$' THEN
            SET v_err = 'Bank account number must be 9 to 18 digits';
        ELSEIF p_doc_type_cd = 6 AND v_no NOT REGEXP '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' THEN
            SET v_err = 'GSTIN must be 15 characters (e.g. 19AAAAA1234A1Z5)';
        ELSEIF p_doc_type_cd IN (1, 4, 5, 7) AND v_no NOT REGEXP '^[A-Z0-9/.-]{3,50}$' THEN
            SET v_err = 'Document number must be 3 to 50 letters, digits, / - .';
        END IF;
    END IF;

    IF v_err IS NULL THEN
        IF p_issue_date IS NOT NULL AND p_issue_date > CURDATE() THEN
            SET v_err = 'Issue date cannot be in the future';
        ELSEIF p_issue_date IS NOT NULL AND v_formed IS NOT NULL AND p_issue_date < v_formed THEN
            SET v_err = 'Issue date cannot be before the group''s formation date';
        ELSEIF p_expiry_date IS NOT NULL AND p_issue_date IS NOT NULL AND p_expiry_date <= p_issue_date THEN
            SET v_err = 'Expiry date must be after the issue date';
        ELSEIF p_expiry_date IS NOT NULL AND p_expiry_date < CURDATE() THEN
            SET v_err = 'Document has expired';
        END IF;
    END IF;

    IF v_err IS NULL THEN
        CALL USP_GROUP_KYC_DUP_CHECK(IF(v_action = 'EDIT', p_group_kyc_id, NULL), v_group_id, p_doc_type_cd, v_no, v_err);
    END IF;

    IF v_err IS NOT NULL THEN
        SELECT 'ERROR' AS status, p_group_kyc_id AS group_kyc_id, v_err AS message;
    ELSEIF v_action = 'ADD' THEN
        INSERT INTO mst_group_kyc (Group_Id, Doc_Type_Cd, KYC_No, Issue_Date, Expiry_Date, KYC_Verified,
                                   Photo_Path, Back_Photo_Path, Is_Active, Created_By, Created_At)
        VALUES (v_group_id, p_doc_type_cd, v_no, p_issue_date, p_expiry_date, 0,
                NULLIF(TRIM(p_photo_path), ''), NULLIF(TRIM(p_back_photo_path), ''), b'1', p_user_id, NOW());
        SET v_id = LAST_INSERT_ID();
        SELECT 'SUCCESS' AS status, v_id AS group_kyc_id, 'KYC document added successfully' AS message;
    ELSE
        UPDATE mst_group_kyc
        SET Doc_Type_Cd = p_doc_type_cd,
            KYC_No = v_no,
            Issue_Date = p_issue_date,
            Expiry_Date = p_expiry_date,
            Photo_Path = NULLIF(TRIM(p_photo_path), ''),
            Back_Photo_Path = NULLIF(TRIM(p_back_photo_path), ''),
            KYC_Verified = 0,
            Verify_Remarks = IF(v_cur_verified = 2, NULL, Verify_Remarks),
            Verified_By = IF(v_cur_verified = 2, NULL, Verified_By),
            Verified_At = IF(v_cur_verified = 2, NULL, Verified_At),
            Updated_By = p_user_id,
            Updated_At = NOW()
        WHERE Group_Kyc_Id = p_group_kyc_id;
        SELECT 'SUCCESS' AS status, p_group_kyc_id AS group_kyc_id,
               IF(v_cur_verified = 2, 'KYC document updated and sent for re-verification',
                  'KYC document updated successfully') AS message;
    END IF;
END ;;
DELIMITER ;
```

### 2.3 `USP_GROUP_KYC_LIST`

```sql
DELIMITER ;;
CREATE PROCEDURE USP_GROUP_KYC_LIST(
    IN p_group_kyc_id INT,
    IN p_group_id INT,
    IN p_branch_id INT,
    IN p_doc_type_cd INT,
    IN p_verify_status INT,
    IN p_is_active INT,
    IN p_page INT,
    IN p_per_page INT
)
BEGIN
    DECLARE v_page INT DEFAULT 1;
    DECLARE v_per_page INT DEFAULT 50;
    DECLARE v_offset INT DEFAULT 0;
    DECLARE v_total INT DEFAULT 0;

    SET v_page = GREATEST(IFNULL(p_page, 1), 1);
    SET v_per_page = LEAST(GREATEST(IFNULL(p_per_page, 50), 1), 200);
    SET v_offset = (v_page - 1) * v_per_page;

    SELECT COUNT(*) INTO v_total
    FROM mst_group_kyc k JOIN mst_group g ON g.Group_Id = k.Group_Id
    WHERE (p_group_kyc_id IS NULL OR k.Group_Kyc_Id = p_group_kyc_id)
      AND (p_group_id IS NULL OR k.Group_Id = p_group_id)
      AND (p_branch_id IS NULL OR g.Branch_Id = p_branch_id)
      AND (p_doc_type_cd IS NULL OR k.Doc_Type_Cd = p_doc_type_cd)
      AND (p_verify_status IS NULL OR IFNULL(k.KYC_Verified, 0) = p_verify_status)
      AND (p_is_active IS NULL OR IFNULL(k.Is_Active, 1) + 0 = p_is_active);

    SELECT v_total AS total, v_page AS page, v_per_page AS per_page,
           IF(v_total = 0, 1, CEIL(v_total / v_per_page)) AS last_page;

    SELECT
        k.Group_Kyc_Id AS group_kyc_id,
        k.Group_Id AS group_id,
        g.Group_Code AS group_code,
        g.Group_Name AS group_name,
        g.Branch_Id AS branch_id,
        b.Branch_Name AS branch_name,
        k.Doc_Type_Cd AS doc_type_cd,
        (SELECT MIN(o.Opt_Description) FROM mst_appl_options o
          WHERE o.Opt_Grp_Id = 50 AND o.Opt_Code = k.Doc_Type_Cd) AS doc_type_desc,
        k.KYC_No AS kyc_no,
        k.Issue_Date AS issue_date,
        k.Expiry_Date AS expiry_date,
        IF(k.Expiry_Date IS NOT NULL AND k.Expiry_Date < CURDATE(), 1, 0) AS is_expired,
        IFNULL(k.KYC_Verified, 0) AS verify_status,
        k.Verify_Remarks AS verify_remarks,
        vu.User_Name AS verified_by_name,
        k.Verified_At AS verified_at,
        k.Photo_Path AS photo_path,
        k.Back_Photo_Path AS back_photo_path,
        IFNULL(k.Is_Active, 1) + 0 AS is_active,
        cu.User_Name AS created_by_name,
        k.Created_At AS created_at
    FROM mst_group_kyc k
    JOIN mst_group g ON g.Group_Id = k.Group_Id
    LEFT JOIN priomicro_core.mst_org_branch b ON b.Branch_Id = g.Branch_Id
    LEFT JOIN priomicro_core.mst_org_user vu ON vu.User_Id = k.Verified_By
    LEFT JOIN priomicro_core.mst_org_user cu ON cu.User_Id = k.Created_By
    WHERE (p_group_kyc_id IS NULL OR k.Group_Kyc_Id = p_group_kyc_id)
      AND (p_group_id IS NULL OR k.Group_Id = p_group_id)
      AND (p_branch_id IS NULL OR g.Branch_Id = p_branch_id)
      AND (p_doc_type_cd IS NULL OR k.Doc_Type_Cd = p_doc_type_cd)
      AND (p_verify_status IS NULL OR IFNULL(k.KYC_Verified, 0) = p_verify_status)
      AND (p_is_active IS NULL OR IFNULL(k.Is_Active, 1) + 0 = p_is_active)
    ORDER BY IFNULL(k.Is_Active, 1) DESC, k.Group_Kyc_Id DESC
    LIMIT v_per_page OFFSET v_offset;
END ;;
DELIMITER ;
```

### 2.4 `USP_GROUP_KYC_VERIFY`

Copy `USP_MEMBER_KYC_VERIFY` and change the table, ids and messages. Parameters: `(p_group_kyc_id, p_verify_status, p_remarks, p_user_id, p_user_branch_id, p_user_is_head)`.

- `p_verify_status`: 0 Reopen (Pending), 1 Verify, 2 Reject.
- Errors: document not found; status not 0/1/2; inactive document; closed group; other branch; reason required for 0 and 2; rejected must be reopened before verify; expired cannot be verified; when leaving Rejected, run `USP_GROUP_KYC_DUP_CHECK`.
- Update `KYC_Verified, Verify_Remarks, Verified_By = IF(status = 0, NULL, user), Verified_At = IF(status = 0, NULL, NOW()), Updated_By, Updated_At`.
- Return `status, group_kyc_id, message` ("KYC document verified" / "rejected" / "reopened").

### 2.5 `USP_GROUP_KYC_STATUS`

Copy `USP_MEMBER_KYC_STATUS`. Parameters: `(p_group_kyc_id, p_is_active, p_user_id, p_user_branch_id, p_user_is_head)`.

- Blocks closed groups and other branches.
- When activating a non-rejected document, run `USP_GROUP_KYC_DUP_CHECK`.
- Return `status, group_kyc_id, message` ("KYC document activated" / "deactivated").

---

## 3. Laravel endpoints

Common rules:

- `auth:sanctum` (existing guard); tenant schema from the token.
- `p_user_id`, `p_user_branch_id`, `p_user_is_head` from the logged-in user, never from the body.
- `ERROR` from a procedure → HTTP 422 `{ "success": false, "message": "…" }`.
- Add, Edit, Verify and Status return `data` = **one list row** (section 2.3 shape): after the procedure succeeds, call `USP_GROUP_KYC_LIST(:id, NULL, NULL, NULL, NULL, NULL, 1, 1)` and return the first row.
- Write an audit row to `trans_audit_log` (module `GroupKyc`, table `mst_group_kyc`).

### GET `/api/GroupKycList`

Query: `group_kyc_id, group_id, branch_id, doc_type_cd, verify_status (0|1|2), is_active (0|1), page, per_page`. Non-head users: force `branch_id` to their branch.

```json
{ "success": true, "message": "OK", "data": [ { "group_kyc_id": 1, "group_id": 2, "group_code": "GRP-00002", "...": "..." } ],
  "meta": { "total": 1, "page": 1, "per_page": 50, "last_page": 1 } }
```

### POST `/api/GroupKycAdd`

```php
$data = $request->validate([
    'group_id'        => 'required|integer|min:1',
    'doc_type_cd'     => 'required|integer|in:1,2,3,4,5,6,7',
    'kyc_no'          => 'required|string|max:60',
    'issue_date'      => 'nullable|date_format:Y-m-d|before_or_equal:today',
    'expiry_date'     => 'nullable|date_format:Y-m-d|after:issue_date',
    'photo_path'      => ['nullable', 'string', 'max:300', 'regex:#^group-kyc/\d+/[0-9a-f-]{36}\.(jpg|png|pdf)$#'],
    'back_photo_path' => ['nullable', 'string', 'max:300', 'regex:#^group-kyc/\d+/[0-9a-f-]{36}\.(jpg|png|pdf)$#'],
]);
DB::select('CALL USP_GROUP_KYC_ADD_EDIT(?,?,?,?,?,?,?,?,?,?,?,?)', [
    'ADD', null, $data['group_id'], $data['doc_type_cd'], $data['kyc_no'],
    $data['issue_date'] ?? null, $data['expiry_date'] ?? null,
    $data['photo_path'] ?? null, $data['back_photo_path'] ?? null,
    $user->id, $user->branch_id, $user->is_head ? 1 : 0,
]);
```

### POST `/api/GroupKycEdit`

Same body plus `group_kyc_id` (required). Call with `'EDIT'`. `group_id` is ignored by the procedure (it uses the stored one).

### POST `/api/GroupKycVerify`

```json
{ "group_kyc_id": 1, "verify_status": 1, "remarks": null }
```

`verify_status` in `0,1,2`; `remarks` required (max 200) when 0 or 2.

### POST `/api/GroupKycStatus`

```json
{ "group_kyc_id": 1, "is_active": 0 }
```

---

## 4. Document images

Images are stored by the Next.js BFF (same as member KYC), not by Laravel:

- Upload `POST /api/onboarding/group-kyc/file` (form fields `group_id`, `file`), JPG / PNG / PDF up to 2 MB.
- Saved to `storage/group-kyc/{Group_Id}/{uuid}.{ext}`; the path is sent to Laravel as `photo_path` / `back_photo_path`.
- Read back through `GET /api/onboarding/group-kyc/file?path=…`, which checks the session and branch.

If you later move files to Laravel storage, keep the same path format so existing rows still resolve.

---

## 5. Test checklist

1. Run the options insert, table and procedures. Open Group Management → KYC on a group → empty state.
2. Add PAN `aaaaa1234a` → saved as `AAAAA1234A`, Pending.
3. Add a second active PAN for the same group → 422 "Group already has an active PAN Card…".
4. Add the same PAN on another group → 422 "…already registered for group GRP-…".
5. Verify → Verified, Edit hidden. Reopen without a reason → 422. Reopen with a reason → Pending, Edit visible.
6. Reject with a reason → Rejected; edit it → back to Pending, remarks cleared.
7. Deactivate → Inactive; edit / verify blocked until activated.
8. Close the group (status 4) → modal is read-only; API returns 422.
9. Non-head user from another branch → list empty, all actions 403/422.
10. Issue date before `Formation_Date`, future issue date, past expiry date → 422 with the messages above.
