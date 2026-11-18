# Loan Application – Disbursement Payment Mode (Backend Changes)

Screen: `/los/applications` → **Create / Edit Loan Application** → section **Disbursement Mode & Remarks**.

The officer first picks a **Payment Mode** (lookup group 41). The form then shows only the fields for that mode. The frontend is already wired; it sends the new fields to the existing endpoints `LoanApplicationAdd`, `LoanApplicationBulkAdd` and `LoanApplicationEdit`. No new endpoint is needed.

---

## 1. Lookup used

`GET /api/ApplOptionsList?opt_grp_id=41` (already exists)

| Opt_Code | Description   | Fields the form shows                                         |
|---------:|---------------|---------------------------------------------------------------|
| 1        | Cash          | Receiver name (optional)                                      |
| 2        | Bank Cheque   | Payee name (required)                                         |
| 3        | Bank Transfer | Beneficiary name, bank name, account no (+ confirm), IFSC     |
| 4        | S/B Account   | Individual: borrower's savings account (required). Group: none |
| 5        | Adjustment    | Adjustment reference (required)                               |

Only `Is_Active = 1` rows are shown. If the lookup call fails, the form falls back to the five rows above.

For **S/B Account** (individual loans) the form lists the borrower's savings accounts with the existing call:
`GET DepositAccountList?member_id={id}&deposit_type_cd=1&is_closed=0`.

---

## 2. Database changes

### 2.1 `mst_loan_application`

`Beneficiary_Name`, `Bank_Account_No` and `IFSC_Code` already exist (the API returns them today). Add:

```sql
ALTER TABLE mst_loan_application
  ADD COLUMN Payment_Mode_Cd   TINYINT       NULL COMMENT 'mst_appl_options grp 41' AFTER Repay_Duration_Cd,
  ADD COLUMN Bank_Name         VARCHAR(100)  NULL AFTER Beneficiary_Name,
  ADD COLUMN SB_Account_Id     INT           NULL COMMENT 'mst_deposit_account.Account_Id, mode 4' AFTER IFSC_Code,
  ADD COLUMN Adjustment_Ref    VARCHAR(50)   NULL COMMENT 'mode 5' AFTER SB_Account_Id;

-- Existing rows: treat rows with a bank account as Bank Transfer, the rest as Cash.
UPDATE mst_loan_application
   SET Payment_Mode_Cd = CASE WHEN COALESCE(Bank_Account_No, '') <> '' THEN 3 ELSE 1 END
 WHERE Payment_Mode_Cd IS NULL;
```

> Check the column names `Beneficiary_Name`, `Bank_Account_No`, `IFSC_Code`, `Repay_Duration_Cd` against your table and adjust the `AFTER` clauses if they differ.

### 2.2 `mst_loan_account_disbursement`

At disbursement, the screen should default to the mode chosen on the application. If the disbursement table has no mode column yet, add one:

```sql
ALTER TABLE mst_loan_account_disbursement
  ADD COLUMN Payment_Mode_Cd TINYINT     NULL COMMENT 'mst_appl_options grp 41',
  ADD COLUMN SB_Account_Id   INT         NULL,
  ADD COLUMN Cheque_No       VARCHAR(20) NULL,
  ADD COLUMN Cheque_Date     DATE        NULL,
  ADD COLUMN Trans_Ref_No    VARCHAR(50) NULL COMMENT 'UTR for bank transfer';
```

Skip any column that already exists.

---

## 3. API contract changes

### 3.1 `POST /api/LoanApplicationAdd` (individual)

New / changed request fields:

| Field             | Type          | Rule                                                                 |
|-------------------|---------------|----------------------------------------------------------------------|
| `payment_mode_cd` | int           | **required**, must exist in `mst_appl_options` grp 41 and be active  |
| `beneficiary_name`| string\|null  | required if mode 2 or 3; optional for 1; must be `null` for 4, 5     |
| `bank_name`       | string\|null  | optional, mode 3 only, max 100                                       |
| `bank_account_no` | string\|null  | required if mode 3; digits only, 9–18                                |
| `ifsc_code`       | string\|null  | required if mode 3; regex `^[A-Z]{4}0[A-Z0-9]{6}$`                   |
| `sb_account_id`   | int\|null     | required if mode 4 (individual)                                      |
| `adjustment_ref`  | string\|null  | required if mode 5; max 50                                           |

The frontend always sends every field; fields that don't belong to the chosen mode are sent as `null`, so the backend should **store them as NULL** (this also clears old values on edit).

Example (Bank Transfer):

```json
{
  "application_date": "2026-10-29",
  "cust_type_cd": 2,
  "cust_id_primary": 6,
  "scheme_id": 1,
  "appl_amount": 20000,
  "appl_tenure": 12,
  "repay_duration_cd": 4,
  "branch_id": 1,
  "fo_id": 5,
  "payment_mode_cd": 3,
  "beneficiary_name": "DA",
  "bank_name": "State Bank of India",
  "bank_account_no": "12345678901",
  "ifsc_code": "SBIN0001234",
  "sb_account_id": null,
  "adjustment_ref": null,
  "remarks": null
}
```

Example (S/B Account):

```json
{ "...": "...", "payment_mode_cd": 4, "beneficiary_name": null, "bank_name": null,
  "bank_account_no": null, "ifsc_code": null, "sb_account_id": 42, "adjustment_ref": null }
```

### 3.2 `POST /api/LoanApplicationBulkAdd` (JLG / group)

Same fields at the top level, **except `sb_account_id`** (not sent). Rules:

- Mode 4 (S/B Account): the backend must check that **every member** in `members[]` has exactly one active savings account (`Deposit_Type_Cd = 1`, not closed, `Status_Cd = 1`). If any member has none, reject with
  `"Member {ref_code} has no active savings account for S/B disbursement"`.
  Resolve and store each member's account in `mst_loan_application_bulk.SB_Account_Id` (add the column if missing: `ALTER TABLE mst_loan_application_bulk ADD COLUMN SB_Account_Id INT NULL;`).
- Mode 3 (Bank Transfer) on a group loan means one transfer to the group's account (the details entered).

### 3.3 `POST /api/LoanApplicationEdit`

Accepts the same fields. Same validation. Only allowed while the application is still editable (current rule).

### 3.4 `LoanApplicationList` / `LoanApplicationGet` response

Add to each row:

```json
{
  "payment_mode_cd": 4,
  "payment_mode": "S/B Account",
  "beneficiary_name": null,
  "bank_name": null,
  "bank_account_no": null,
  "ifsc_code": null,
  "sb_account_id": 42,
  "sb_account_no": "SB-2026-00042",
  "adjustment_ref": null
}
```

`payment_mode` = `mst_appl_options.Opt_Description` (grp 41). `sb_account_no` = the savings account's display number (`Ref_Ac_No`, fallback `Appl_No`).

---

## 4. Validation rules (Laravel)

```php
$rules = [
    'payment_mode_cd'  => ['required', 'integer', Rule::exists('mst_appl_options', 'Opt_Code')
                              ->where('Opt_Grp_Id', 41)->where('Is_Active', 1)],
    'beneficiary_name' => ['nullable', 'string', 'max:100', 'required_if:payment_mode_cd,2,3'],
    'bank_name'        => ['nullable', 'string', 'max:100'],
    'bank_account_no'  => ['nullable', 'regex:/^\d{9,18}$/', 'required_if:payment_mode_cd,3'],
    'ifsc_code'        => ['nullable', 'regex:/^[A-Z]{4}0[A-Z0-9]{6}$/', 'required_if:payment_mode_cd,3'],
    'sb_account_id'    => ['nullable', 'integer', 'required_if:payment_mode_cd,4'], // Add / Edit (individual) only
    'adjustment_ref'   => ['nullable', 'string', 'max:50', 'required_if:payment_mode_cd,5'],
];
```

Extra checks for mode 4 (individual) inside the stored procedure or service:

1. `SB_Account_Id` exists in the deposit account table, `Deposit_Type_Cd = 1`, not closed, `Status_Cd = 1`.
2. The account belongs to the borrower: `Cust_Id_Primary = cust_id_primary` (or the borrower is a joint holder).

Error messages:

| Case                          | Message                                                        |
|-------------------------------|----------------------------------------------------------------|
| Mode missing / invalid        | `Please select a valid payment mode`                           |
| SB account not the borrower's | `Selected savings account does not belong to this borrower`    |
| SB account closed / inactive  | `Selected savings account is not active`                       |
| Bad IFSC                      | `Enter a valid 11-character IFSC code`                         |

---

## 5. Stored procedure changes

In the Add, BulkAdd and Edit procedures for `mst_loan_application`:

1. Add the parameters `p_payment_mode_cd`, `p_bank_name`, `p_sb_account_id`, `p_adjustment_ref`.
2. Write them to the new columns. Force irrelevant fields to NULL by mode:
   ```sql
   SET p_bank_name        = IF(p_payment_mode_cd = 3, p_bank_name, NULL);
   SET p_bank_account_no  = IF(p_payment_mode_cd = 3, p_bank_account_no, NULL);
   SET p_ifsc_code        = IF(p_payment_mode_cd = 3, UPPER(p_ifsc_code), NULL);
   SET p_sb_account_id    = IF(p_payment_mode_cd = 4, p_sb_account_id, NULL);
   SET p_adjustment_ref   = IF(p_payment_mode_cd = 5, p_adjustment_ref, NULL);
   SET p_beneficiary_name = IF(p_payment_mode_cd IN (1, 2, 3), p_beneficiary_name, NULL);
   ```
3. For mode 4, validate the savings account (section 4) and return `status = 'ERROR'` with the message if it fails.
4. In the List / Get procedure, join `mst_appl_options` (grp 41) for `payment_mode` and the deposit account for `sb_account_no`.

---

## 6. Disbursement behaviour (follow-up)

When the loan is disbursed (Disbursement screen):

| Mode | Accounting at disbursement                                                                 |
|------|---------------------------------------------------------------------------------------------|
| 1    | Dr Loan A/c, Cr Cash (branch cash ledger)                                                   |
| 2    | Dr Loan A/c, Cr Bank; record `Cheque_No`, `Cheque_Date`                                     |
| 3    | Dr Loan A/c, Cr Bank; record `Trans_Ref_No` (UTR)                                           |
| 4    | Dr Loan A/c, Cr Savings A/c → also post a **credit transaction** on `SB_Account_Id` (savings transaction, status Posted) |
| 5    | Dr Loan A/c, Cr the account named in `Adjustment_Ref` (e.g. close/settle the old loan)      |

The disbursement screen should prefill the mode and account from the application, but allow the officer to change it, and store the final values in `mst_loan_account_disbursement`.

---

## 7. Test checklist

- [ ] `ApplOptionsList?opt_grp_id=41` returns the 5 modes; inactive ones are hidden in the form.
- [ ] Add individual with each mode 1–5 → row saved with correct `Payment_Mode_Cd`; irrelevant columns are NULL.
- [ ] Mode 3 with bad IFSC / short account no → 422 with message.
- [ ] Mode 4 with another member's savings account → error.
- [ ] Mode 4 bulk where one member has no savings account → error naming that member.
- [ ] Edit from mode 3 to mode 1 → bank columns cleared.
- [ ] List / Get return `payment_mode_cd`, `payment_mode`, `sb_account_no`, `adjustment_ref`.
- [ ] Old applications show mode 3 (had bank account) or 1 after the migration.
