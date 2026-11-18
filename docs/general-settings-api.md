# General Settings API (`mst_settings_general`)

Screen: `/master/general-settings`. It lists every row of `mst_settings_general`, grouped by `GrpNo`, and lets a **head office** user switch rows between Active (`Status = 1`) and Inactive (`Status = 0`). This works one row at a time with the switch, or for many rows at once with the checkboxes and the Activate / Deactivate bar.

**Nothing existing changes.** The table structure, its 27 rows, the `Code` values and every procedure that reads them stay as they are. These include the `HolidDue` check in the schedule procedure, and the `AllowPrev`, `DayEnd` and `FieldWith` checks in the savings and share procedures. The backend only needs three new endpoints, which read the table and update the `Status` column.

Portal chain: browser → `GET|POST /api/master/general-settings` (BFF) → Laravel endpoints below.

---

## 1. Table (unchanged, for reference)

```sql
CREATE TABLE `mst_settings_general` (
  `Id` tinyint NOT NULL AUTO_INCREMENT,
  `GrpNo` tinyint DEFAULT NULL,
  `Code` varchar(10) DEFAULT NULL,
  `Purpose` varchar(100) DEFAULT NULL,
  `Status` smallint DEFAULT NULL,
  PRIMARY KEY (`Id`)
);
```

| GrpNo | Heading shown in the portal | Codes |
| --- | --- | --- |
| 1 | Login & Calendar | SunAllow, HoliAllow, HolidDue, CollAfter |
| 2 | Field Operations | FieldKYC, FieldGPS, FieldLoan, FieldWith, CustAuth |
| 3 | Registration KYC | PanReq, UidReq, VoterReq |
| 4 | Customer Notifications | SMSSend, WappSend, MsgOnbrd, MsgLnSanc, MsgLnDisb, MsgColl, MsgDue, MsgDeflt |
| 5 | Period Closing | DayEnd, MonthEnd |
| 6 | Loans & Transactions | ChkCibil, AllowPnlty, AllowPrev, GrpIndvLn, GrpIndvSb |

The headings are translated in the portal (`master.generalSettings.groups.*`), so the database needs no group table. A new `GrpNo` shows as "Group 7" and so on until a heading is added.

---

## 2. Stored procedures (new, read/update only)

### 2.1 `USP_GENERAL_SETTINGS_LIST`

```sql
DROP PROCEDURE IF EXISTS USP_GENERAL_SETTINGS_LIST;
DELIMITER ;;
CREATE PROCEDURE USP_GENERAL_SETTINGS_LIST()
BEGIN
    SELECT Id                          AS id,
           GrpNo                       AS grp_no,
           Code                        AS code,
           Purpose                     AS purpose,
           IF(IFNULL(Status, 0) = 1, 1, 0) AS status
    FROM mst_settings_general
    ORDER BY GrpNo, Id;
END ;;
DELIMITER ;
```

### 2.2 `USP_GENERAL_SETTINGS_STATUS`

This changes only `Status`. `Id`, `GrpNo`, `Code` and `Purpose` cannot be edited. The existing procedures look settings up by `Code`, so the codes must never change.

```sql
DROP PROCEDURE IF EXISTS USP_GENERAL_SETTINGS_STATUS;
DELIMITER ;;
CREATE PROCEDURE USP_GENERAL_SETTINGS_STATUS(
    IN p_id INT,
    IN p_status INT,
    IN p_user_id INT
)
proc: BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_current INT DEFAULT NULL;
    DECLARE v_code VARCHAR(10);
    DECLARE v_purpose VARCHAR(100);

    IF p_status IS NULL OR p_status NOT IN (0, 1) THEN
        SELECT 'ERROR' AS status, p_id AS id, 'Status must be 0 (inactive) or 1 (active)' AS message;
        LEAVE proc;
    END IF;

    SELECT COUNT(*), MAX(IFNULL(Status, 0)), MAX(Code), MAX(Purpose)
    INTO v_cnt, v_current, v_code, v_purpose
    FROM mst_settings_general WHERE Id = p_id FOR UPDATE;

    IF v_cnt = 0 THEN
        SELECT 'ERROR' AS status, p_id AS id, 'Setting not found' AS message;
        LEAVE proc;
    END IF;

    IF v_current <> p_status THEN
        UPDATE mst_settings_general SET Status = p_status WHERE Id = p_id;
    END IF;

    SELECT 'SUCCESS'  AS status,
           Id         AS id,
           GrpNo      AS grp_no,
           Code       AS code,
           Purpose    AS purpose,
           IF(IFNULL(Status, 0) = 1, 1, 0) AS setting_status,
           v_current  AS old_status,
           IF(Status = 1, CONCAT(Purpose, ' activated'), CONCAT(Purpose, ' deactivated')) AS message
    FROM mst_settings_general WHERE Id = p_id;
END ;;
DELIMITER ;
```

The procedure returns exactly one result set. Do not call `USP_AUDIT_LOG_INSERT` inside it: that procedure returns its own result set first, and Laravel's `selectOne` would read the audit row instead of the setting. Laravel writes the audit row instead (section 3.2) when `old_status` differs from `setting_status`.

### 2.3 `USP_GENERAL_SETTINGS_BULK_STATUS`

This sets many rows to the same status in one call. Like 2.2, it changes only `Status`.

It is **all or nothing**. If any id in the list does not exist, nothing is updated and the procedure returns an error. Rows that already have the requested status are returned unchanged, so repeating a request is safe.

```sql
DROP PROCEDURE IF EXISTS USP_GENERAL_SETTINGS_BULK_STATUS;
DELIMITER ;;
CREATE PROCEDURE USP_GENERAL_SETTINGS_BULK_STATUS(
    IN p_ids JSON,
    IN p_status INT,
    IN p_user_id INT
)
proc: BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_found INT DEFAULT 0;
    DECLARE v_changed INT DEFAULT 0;
    DECLARE v_message VARCHAR(100);

    IF p_status IS NULL OR p_status NOT IN (0, 1) THEN
        SELECT 'ERROR' AS status, NULL AS id, 'Status must be 0 (inactive) or 1 (active)' AS message;
        LEAVE proc;
    END IF;

    IF p_ids IS NULL OR JSON_TYPE(p_ids) <> 'ARRAY' OR JSON_LENGTH(p_ids) = 0 THEN
        SELECT 'ERROR' AS status, NULL AS id, 'Select at least one setting' AS message;
        LEAVE proc;
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_general_setting_ids;
    CREATE TEMPORARY TABLE tmp_general_setting_ids (Id INT NOT NULL PRIMARY KEY);
    INSERT IGNORE INTO tmp_general_setting_ids (Id)
    SELECT jt.id
    FROM JSON_TABLE(p_ids, '$[*]' COLUMNS (id INT PATH '$')) jt
    WHERE jt.id IS NOT NULL AND jt.id > 0;

    SELECT COUNT(*) INTO v_cnt FROM tmp_general_setting_ids;
    SELECT COUNT(*) INTO v_found
    FROM mst_settings_general s JOIN tmp_general_setting_ids t ON t.Id = s.Id;

    IF v_cnt = 0 OR v_found <> v_cnt THEN
        DROP TEMPORARY TABLE IF EXISTS tmp_general_setting_ids;
        SELECT 'ERROR' AS status, NULL AS id, 'One or more settings were not found' AS message;
        LEAVE proc;
    END IF;

    -- Remember the old value of each row, for the audit log and the "changed" count.
    DROP TEMPORARY TABLE IF EXISTS tmp_general_setting_old;
    CREATE TEMPORARY TABLE tmp_general_setting_old AS
    SELECT s.Id, IF(IFNULL(s.Status, 0) = 1, 1, 0) AS Old_Status
    FROM mst_settings_general s JOIN tmp_general_setting_ids t ON t.Id = s.Id;

    SELECT IFNULL(SUM(Old_Status <> p_status), 0) INTO v_changed FROM tmp_general_setting_old;

    UPDATE mst_settings_general s
    JOIN tmp_general_setting_old o ON o.Id = s.Id
    SET s.Status = p_status
    WHERE o.Old_Status <> p_status;

    SET v_message = CONCAT(v_changed, IF(p_status = 1, ' setting(s) activated', ' setting(s) deactivated'));

    SELECT 'SUCCESS' AS status,
           s.Id      AS id,
           s.GrpNo   AS grp_no,
           s.Code    AS code,
           s.Purpose AS purpose,
           IF(IFNULL(s.Status, 0) = 1, 1, 0) AS setting_status,
           o.Old_Status AS old_status,
           v_message AS message
    FROM mst_settings_general s
    JOIN tmp_general_setting_old o ON o.Id = s.Id
    ORDER BY s.GrpNo, s.Id;

    DROP TEMPORARY TABLE IF EXISTS tmp_general_setting_old;
    DROP TEMPORARY TABLE IF EXISTS tmp_general_setting_ids;
END ;;
DELIMITER ;
```

It returns **one row per id** in a single result set. Every row carries the same `status` and `message`. On error it returns exactly one row with `status = 'ERROR'`.

---

## 3. Laravel endpoints

Both go behind the existing `auth:sanctum` (Bearer) middleware.

### 3.1 `GET /api/GeneralSettingsList`

Any signed-in user can read. Response:

```json
{
  "success": true,
  "message": "General settings retrieved successfully",
  "data": [
    { "id": 1, "grp_no": 1, "code": "SunAllow", "purpose": "Allow System LogIn On Sunday", "status": 0 },
    { "id": 21, "grp_no": 5, "code": "DayEnd", "purpose": "Day-End Required", "status": 1 }
  ]
}
```

```php
public function list()
{
    $rows = DB::select('CALL USP_GENERAL_SETTINGS_LIST()');
    return response()->json([
        'success' => true,
        'message' => 'General settings retrieved successfully',
        'data'    => $rows,
    ]);
}
```

### 3.2 `POST /api/GeneralSettingsStatus`

**Head office only.** The portal already blocks other users, but Laravel must check too.

Request:

```json
{ "id": 21, "status": 1 }
```

```php
public function status(Request $request)
{
    $user = $request->user();
    if (! $user->is_head) {                       // use the same head-office check as the other masters
        return response()->json(['success' => false, 'message' => 'Only head office can change general settings'], 403);
    }

    $data = $request->validate([
        'id'     => ['required', 'integer', 'min:1'],
        'status' => ['required', 'integer', 'in:0,1'],
    ]);

    $row = DB::selectOne('CALL USP_GENERAL_SETTINGS_STATUS(?, ?, ?)', [$data['id'], $data['status'], $user->id]);

    if (($row->status ?? null) !== 'SUCCESS') {
        return response()->json(['success' => false, 'message' => $row->message ?? 'Setting not updated'], 422);
    }

    if ((int) $row->old_status !== (int) $row->setting_status) {
        DB::select('CALL USP_AUDIT_LOG_INSERT(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            $user->id, 'General Settings', 'mst_settings_general', $row->id, 2,
            json_encode(['code' => $row->code, 'status' => (int) $row->old_status]),
            json_encode(['code' => $row->code, 'status' => (int) $row->setting_status]),
            $request->ip(), substr((string) $request->userAgent(), 0, 500),
        ]);
    }

    return response()->json([
        'success' => true,
        'message' => $row->message,
        'data'    => [
            'id'      => $row->id,
            'grp_no'  => $row->grp_no,
            'code'    => $row->code,
            'purpose' => $row->purpose,
            'status'  => $row->setting_status,
        ],
    ]);
}
```

### 3.3 `POST /api/GeneralSettingsBulkStatus`

**Head office only**, with the same check as 3.2. The portal sends only the rows whose status actually needs to change. The endpoint still accepts rows that are already in the requested state and leaves them as they are.

Request:

```json
{ "ids": [21, 22, 25], "status": 1 }
```

Response (`data` has one entry per id, already in its new state):

```json
{
  "success": true,
  "message": "3 setting(s) activated",
  "data": [
    { "id": 21, "grp_no": 5, "code": "DayEnd",    "purpose": "Day-End Required",             "status": 1 },
    { "id": 22, "grp_no": 5, "code": "MonthEnd",  "purpose": "Month-End Required",           "status": 1 },
    { "id": 25, "grp_no": 6, "code": "AllowPrev", "purpose": "Allow Backdated Transactions", "status": 1 }
  ]
}
```

```php
public function bulkStatus(Request $request)
{
    $user = $request->user();
    if (! $user->is_head) {
        return response()->json(['success' => false, 'message' => 'Only head office can change general settings'], 403);
    }

    $data = $request->validate([
        'ids'    => ['required', 'array', 'min:1', 'max:127'],
        'ids.*'  => ['required', 'integer', 'min:1', 'distinct'],
        'status' => ['required', 'integer', 'in:0,1'],
    ]);

    return DB::transaction(function () use ($data, $user, $request) {
        $rows = DB::select('CALL USP_GENERAL_SETTINGS_BULK_STATUS(?, ?, ?)', [
            json_encode(array_values(array_map('intval', $data['ids']))),
            $data['status'],
            $user->id,
        ]);

        $first = $rows[0] ?? null;
        if (($first->status ?? null) !== 'SUCCESS') {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => $first->message ?? 'Settings not updated',
            ], 422));
        }

        foreach ($rows as $row) {
            if ((int) $row->old_status === (int) $row->setting_status) {
                continue;
            }
            DB::select('CALL USP_AUDIT_LOG_INSERT(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                $user->id, 'General Settings', 'mst_settings_general', $row->id, 2,
                json_encode(['code' => $row->code, 'status' => (int) $row->old_status]),
                json_encode(['code' => $row->code, 'status' => (int) $row->setting_status]),
                $request->ip(), substr((string) $request->userAgent(), 0, 500),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $first->message,
            'data'    => array_map(fn ($row) => [
                'id'      => $row->id,
                'grp_no'  => $row->grp_no,
                'code'    => $row->code,
                'purpose' => $row->purpose,
                'status'  => $row->setting_status,
            ], $rows),
        ]);
    });
}
```

The transaction keeps the status update and its audit rows together. If writing an audit row fails, the status changes are rolled back too.

Routes:

```php
Route::get('GeneralSettingsList', [GeneralSettingsController::class, 'list']);
Route::post('GeneralSettingsStatus', [GeneralSettingsController::class, 'status']);
Route::post('GeneralSettingsBulkStatus', [GeneralSettingsController::class, 'bulkStatus']);
```

If settings are cached anywhere, for example a cached `HolidDue` or `DayEnd` lookup, clear that cache after a successful status change.

---

## 4. Menu entry (only if the sidebar does not show it yet)

The sidebar comes from `mst_menus`. Pick the next free `SubMenu_Id` under Master (`Menu_Id = 2`), then give the role access through Role Rights.

```sql
INSERT INTO mst_menus (Menu_Id, Menu_Name, SubMenu_Id, SubMenu_Name, Icon, Route, Status)
VALUES (2, NULL, <next SubMenu_Id>, 'General Settings', 'ToggleRight', '/master/general-settings', 1);
```

---

## 5. Test checklist

- [ ] The list returns all 27 rows, grouped 1–6 and ordered by `GrpNo`, then `Id`.
- [ ] A `Status` of NULL in the database comes back as `0` (Inactive).
- [ ] A head office user switches `DayEnd` on: the database `Status` becomes 1, a toast shows, and an audit row is written.
- [ ] Switching the same value again changes nothing and adds no audit row.
- [ ] A branch user sees the switches disabled. A direct `POST` returns 403 from both the BFF and Laravel.
- [ ] `{"id": 999, "status": 1}` returns "Setting not found". `{"id": 1, "status": 2}` is rejected.
- [ ] Bulk: select the whole "Period Closing" group and click Activate. Both rows become 1, there is one audit row per changed setting, and the toast says "2 settings activated".
- [ ] Bulk with a mix of active and inactive rows, then Deactivate: only the active rows are sent and changed.
- [ ] Bulk with every selected row already in the target state: the portal shows "already active" or "already inactive" and sends no request.
- [ ] `{"ids": [21, 999], "status": 1}` returns "One or more settings were not found", and row 21 is **not** changed.
- [ ] `{"ids": [], "status": 1}`, `{"ids": [21, 21], "status": 1}` and `{"ids": [21], "status": 5}` are rejected with 422.
- [ ] A branch user does not see the checkboxes or the bulk bar. A direct bulk `POST` returns 403.
- [ ] After switching `AllowPrev` on, a backdated savings or share entry is accepted. After switching it off, it is rejected. This confirms the existing procedures read the new value without any change.
