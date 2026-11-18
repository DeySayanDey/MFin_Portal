# Global Settings API (Backend Contract)

Screen: `/master/global-settings`. The frontend is wired to the contract below through the BFF route `GET|POST /api/master/global-settings`. Until Laravel builds the two endpoints, the screen shows "Unable to load global settings".

## 1. Parameters and where each one is stored

| Parameter                       | Stored in                         | Field                    | Type / range          |
|---------------------------------|-----------------------------------|--------------------------|-----------------------|
| Default Language                | **new** `mst_settings_global_config` | `Default_Language`     | `en` / `bn` / `hi` / `or` |
| Password Expiry Days            | **existing** Security Policy      | `expire_days` + `passwords_expire` | 0–365 (0 = never) |
| Login Attempt Limit             | **existing** Security Policy      | `max_attempts`           | 1–20                  |
| Allow Backdated Transactions    | new table                         | `Allow_Backdated_Txn`    | 0 / 1                 |
| Maximum Backdate Days           | new table                         | `Max_Backdate_Days`      | 0–365 (0 when not allowed, ≥1 when allowed) |
| Day-End Required                | new table                         | `Day_End_Required`       | 0 / 1                 |
| Month-End Required              | new table                         | `Month_End_Required`     | 0 / 1                 |
| Year-End Closing Required       | new table                         | `Year_End_Required`      | 0 / 1                 |
| PAN Required                    | new table                         | `Pan_Required`           | 0 / 1                 |
| Aadhaar Required                | new table                         | `Aadhaar_Required`       | 0 / 1                 |
| Voter ID Required               | new table                         | `Voter_Id_Required`      | 0 / 1                 |
| Customer Geo-Tagging Required   | new table                         | `Geo_Tagging_Required`   | 0 / 1                 |

**Password Expiry Days** and **Login Attempt Limit** already exist in `SecurityPolicyGet` / `SecurityPolicyUpdate` (Security → Login Settings). The Next.js BFF reads and writes them there, so there is one source of truth. **Do not add them to the new table.**

- Password Expiry Days = 0 → BFF sends `passwords_expire = 0` (keeps the old `expire_days`).
- Password Expiry Days > 0 → BFF sends `passwords_expire = 1`, `expire_days = value`.

## 2. Database

The existing `mst_settings_global (Id, Purpose, Value SMALLINT)` cannot hold strings (`Default_Language`) and has no audit columns, so use a single-row table:

```sql
CREATE TABLE mst_settings_global_config (
  Id                   TINYINT      NOT NULL DEFAULT 1,
  Default_Language     VARCHAR(5)   NOT NULL DEFAULT 'en',
  Allow_Backdated_Txn  TINYINT(1)   NOT NULL DEFAULT 0,
  Max_Backdate_Days    SMALLINT     NOT NULL DEFAULT 0,
  Day_End_Required     TINYINT(1)   NOT NULL DEFAULT 1,
  Month_End_Required   TINYINT(1)   NOT NULL DEFAULT 1,
  Year_End_Required    TINYINT(1)   NOT NULL DEFAULT 1,
  Pan_Required         TINYINT(1)   NOT NULL DEFAULT 0,
  Aadhaar_Required     TINYINT(1)   NOT NULL DEFAULT 1,
  Voter_Id_Required    TINYINT(1)   NOT NULL DEFAULT 0,
  Geo_Tagging_Required TINYINT(1)   NOT NULL DEFAULT 0,
  Updated_By           INT          NULL,
  Updated_At           DATETIME     NULL,
  PRIMARY KEY (Id),
  CONSTRAINT chk_global_single_row CHECK (Id = 1),
  CONSTRAINT chk_global_lang CHECK (Default_Language IN ('en','bn','hi','or')),
  CONSTRAINT chk_global_backdate CHECK (
    (Allow_Backdated_Txn = 0 AND Max_Backdate_Days = 0) OR
    (Allow_Backdated_Txn = 1 AND Max_Backdate_Days BETWEEN 1 AND 365)
  )
);
```

Do **not** insert a row up front. When the row is missing, `GlobalSettingsGet` returns `data: null` and the screen shows defaults with a "not saved yet" notice. The first save creates the row.

## 3. Endpoints

Both use the normal Laravel envelope `{ success, message, data, errors }` and Bearer auth.

### 3.1 `GET /api/GlobalSettingsGet`

Response `data` (or `null` when no row exists):

```json
{
  "default_language": "en",
  "allow_backdated_txn": 1,
  "max_backdate_days": 3,
  "day_end_required": 1,
  "month_end_required": 1,
  "year_end_required": 1,
  "pan_required": 0,
  "aadhaar_required": 1,
  "voter_id_required": 0,
  "geo_tagging_required": 1,
  "updated_by_name": "admin",
  "updated_at": "2026-10-29 18:20:00"
}
```

Booleans may be `0/1`, `"0"/"1"` or `true/false`; the frontend accepts all three. `updated_by_name` comes from `priomicro_core.mst_org_user`.

### 3.2 `POST /api/GlobalSettingsUpdate`

Request body:

```json
{
  "default_language": "bn",
  "allow_backdated_txn": 1,
  "max_backdate_days": 3,
  "day_end_required": 1,
  "month_end_required": 1,
  "year_end_required": 1,
  "pan_required": 1,
  "aadhaar_required": 1,
  "voter_id_required": 0,
  "geo_tagging_required": 1
}
```

Upsert row `Id = 1`, set `Updated_By` = logged-in user and `Updated_At = NOW()`. Return the saved row in the same shape as Get.

Only head-office users may update (the BFF already blocks branch users; Laravel should enforce it as well).

Laravel validation:

```php
$request->validate([
    'default_language'     => ['required', Rule::in(['en', 'bn', 'hi', 'or'])],
    'allow_backdated_txn'  => ['required', 'boolean'],
    'max_backdate_days'    => ['required', 'integer', 'min:0', 'max:365'],
    'day_end_required'     => ['required', 'boolean'],
    'month_end_required'   => ['required', 'boolean'],
    'year_end_required'    => ['required', 'boolean'],
    'pan_required'         => ['required', 'boolean'],
    'aadhaar_required'     => ['required', 'boolean'],
    'voter_id_required'    => ['required', 'boolean'],
    'geo_tagging_required' => ['required', 'boolean'],
]);
// allow_backdated_txn = 1 → max_backdate_days must be ≥ 1
// allow_backdated_txn = 0 → store max_backdate_days = 0
```

Return 422 with `errors` keyed by the camelCase or snake_case field name; the screen shows the `message` at the top.

## 4. Where the backend must apply these settings

Saving the values is not enough; each rule must be enforced where it applies.

| Setting                      | Enforce in                                                                                     |
|------------------------------|------------------------------------------------------------------------------------------------|
| Default Language             | Login response / user profile: use it when the user has no personal language set               |
| Allow Backdated / Max Days   | Every transaction / voucher Add procedure: reject `Trans_Date < CURDATE() - Max_Backdate_Days`, or any past date when not allowed. Message: `Backdated transactions beyond {n} days are not allowed` |
| Day-End Required             | Block transactions for a new business date until Day-End for the previous date is complete     |
| Month-End Required           | Block the first transaction of a new month until Month-End is complete                         |
| Year-End Closing Required    | Block postings in the new financial year until Year-End closing is complete                    |
| PAN / Aadhaar / Voter ID     | `MemberAdd` / KYC verification: member cannot be activated (or a loan application submitted) without an active, verified KYC document of that type |
| Geo-Tagging Required         | `MemberAdd` / `MemberEdit`: latitude and longitude are mandatory                               |

## 5. Test checklist

- [ ] Get with no row → `data: null`; screen shows defaults and the "not saved yet" notice.
- [ ] First save creates row 1; second save updates it; `updated_by_name` / `updated_at` returned.
- [ ] `allow_backdated_txn = 1`, `max_backdate_days = 0` → 422.
- [ ] `allow_backdated_txn = 0`, `max_backdate_days = 5` → stored as 0.
- [ ] Branch user calling Update → 403.
- [ ] Password Expiry Days / Login Attempt Limit changed on this screen appear in Security → Login Settings, and vice versa.
- [ ] Each enforcement rule in section 4 blocks the action with a clear message.
