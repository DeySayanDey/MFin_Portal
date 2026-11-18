# Member 360 Enquiry — Backend API Guide

Source of truth: `priomicro_basundhara.sql` (tenant schema). Screen: `/onboarding/member-360-enquiry?member={memberCode}`.

**Implementation order for the backend:** section 5 (procedure) → section 6 (Laravel controller and route) → section 7 (quick checks) → section 9 (tests).

The browser only calls the Next.js BFF. The BFF resolves the member code, binds the branch to the session, and calls one Laravel endpoint with the user's Bearer token. The search box reuses the existing member list (`GET /api/onboarding/member-registration` → `USP_MEMBER_LIST`), so nothing new is needed for search.

| BFF route (Next.js) | Laravel endpoint | Method | Stored procedure | Status |
| --- | --- | --- | --- | --- |
| `GET /api/onboarding/member-registration?keyword=` (search box) | existing member list | GET | `USP_MEMBER_LIST` | existing |
| `GET /api/onboarding/member-360?member={code}` | `/api/Member360Get?member_id=&branch_id=` | GET | `USP_MEMBER_ENQUIRY_GET` | **new** |

Frontend files: `src/features/onboarding/member-360/` (types, schema, mapper, services, components). Endpoint constants: `endpoints.member360.get` and `endpoints.bff.member360` in `src/lib/api/endpoints.ts`.

> The procedure name has no digits on purpose. The `StoredProcedure` helper from the FD settlement guide (section 15.2) only accepts `USP_[A-Z_]+`.

---

## 1. What the screen shows

| Area | Data | Links to |
| --- | --- | --- |
| Profile header | Name, codes, status, KYC badge, mobile, branch, center, joining date | — |
| Quick access | — | Member registration, `/customer-kyc?member_id=`, `/onboarding/group-member-mapping?member_id=`, share subscription, member ledger, open savings, open FD, loan applications, disbursement, collections, membership closure |
| Totals | Savings balance, term deposit balance, loan outstanding, overdue, share capital | — |
| Attention list | Inactive member, missing / pending / rejected / expired KYC, overdue loans, NPA, FDs maturing in 30 days | — |
| Overview tab | Personal details, KYC documents, groups, nominees, shares | KYC, group mapping, shares |
| Deposits tab | Every savings and term deposit account the member holds (own, joint, or through a group) | `/deposits/savings/{code}`, savings transactions, `/deposits/fd?account_id=`, FD settlement |
| Loans tab | Loan accounts with overdue and next due, plus applications that are not loans yet | Collections, disbursement, loan applications |
| Activity tab | Latest 20 transactions across savings, term deposits, loans and shares | — |

Totals and the attention list are computed by the frontend from the rows below, so every message is translated. The backend only returns data.

---

## 2. Common rules

- Auth: `auth:sanctum` (or the existing guard). Resolve the tenant schema from the token, never from the request.
- **Branch isolation:** a non-head user may only open members where `mst_member.Branch_Id = user branch`. The BFF already sends `branch_id` for non-head users and re-checks `profile.branch_id`. Laravel must **still** enforce it, because the BFF is not the security boundary for the database. Accounts, loans and applications are also filtered by that branch.
- Read-only endpoint. No audit row is needed. Apply the existing menu-permission middleware (`allow_read` on `/onboarding/member-360-enquiry`) and `throttle:60,1`.
- Never return full identity numbers. The procedure masks PAN and KYC numbers (last 4 characters visible).
- Dates are `YYYY-MM-DD` strings, amounts are numbers, flags are `0` / `1`. The frontend also accepts numeric strings.
- Envelope (same as every other endpoint):

```json
{ "success": true, "message": "Member retrieved", "data": { } }
```

```json
{ "success": false, "message": "Member not found", "errors": null, "data": null }
```

| Case | HTTP | Message |
| --- | --- | --- |
| `member_id` missing or not a positive integer | 422 | Laravel validation message |
| Member does not exist | 404 | `Member not found` |
| Member belongs to another branch (non-head user) | 403 | `This member belongs to another branch` |

---

## 3. Request

`GET /api/Member360Get?member_id=125&branch_id=3`

| Param | Type | Rule |
| --- | --- | --- |
| `member_id` | int | required, min 1 |
| `branch_id` | int | optional. **Ignored for non-head users**: always use the logged-in user's branch. Head-office users may pass it to restrict, or omit it to see any branch. |

---

## 4. Response shape (`data`)

Each key is one result set of the procedure. Missing lists can be `[]`; `shares` can be `null`.

```json
{
  "profile": {
    "member_id": 125, "member_code": "1000125", "ref_code": "BSN/0125", "member_name": "Rina Das",
    "father_name": "Haren Das", "spouse_name": "Amit Das", "gender_desc": "Female",
    "date_of_birth": "1991-04-12", "age": 35, "mobile_no": "9876543210", "alternate_mobile_no": null,
    "email_id": null, "pan_masked": "XXXXXX234F", "address": "Ward 4, Basundhara, Kolkata, 700156",
    "branch_id": 3, "branch_name": "Basundhara", "center_name": "Center 12", "fo_name": "S. Roy",
    "joining_date": "2024-02-01", "occupation": "Tailoring", "monthly_income": 18000,
    "status_cd": 1, "status_desc": "Active"
  },
  "kyc": [
    { "member_kyc_id": 88, "doc_type_desc": "Aadhar Card", "kyc_no_masked": "XXXXXXXX4521",
      "verify_status": 1, "expiry_date": null, "is_expired": 0 }
  ],
  "groups": [
    { "group_id": 14, "group_code": "GRP/014", "group_name": "Ma Durga SHG", "member_role": "Member",
      "join_date": "2024-02-10", "exit_date": null, "is_active": 1 }
  ],
  "nominees": [ { "nominee_name": "Amit Das", "relation_desc": "Husband", "share_percent": 100 } ],
  "shares": {
    "total_shares": 10, "face_value": 100, "total_amount": 1000, "paid_amount": 1000,
    "pending_shares": 0, "last_subscription_date": "2024-02-01"
  },
  "deposits": [
    { "account_id": 501, "deposit_type_cd": 1, "full_account_no": "SB01/00501", "appl_no": "DA-2024-0501",
      "scheme_name": "Regular Savings", "holder_role": "primary", "open_date": "2024-02-05",
      "balance": 4520.5, "maturity_date": null, "maturity_amt": null,
      "status_cd": 1, "status_desc": "Active", "is_closed": 0 }
  ],
  "loans": [
    { "loan_account_id": 77, "loan_account_no": "LN/00077", "application_no": "LA-2025-0077",
      "scheme_name": "JLG Loan", "borrower_role": "group", "group_name": "Ma Durga SHG",
      "loan_date": "2025-06-01", "loan_amount": 30000, "disbursed_amount": 30000,
      "principal_outstanding": 12500, "overdue_amount": 2650, "overdue_days": 17,
      "next_due_date": "2026-11-10", "next_due_amount": 2650,
      "status_cd": 1, "status_desc": "Active", "is_closed": 0, "is_npa": 0 }
  ],
  "applications": [
    { "application_id": 91, "application_no": "LA-2026-0091", "application_date": "2026-10-20",
      "scheme_name": "Business Loan", "appl_amount": 50000, "status_desc": "Submitted" }
  ],
  "activity": [
    { "module": "savings", "ref_id": 9921, "trans_date": "2026-10-30", "reference": "SB01/00501",
      "description": "Cash deposit", "credit_amount": 500, "debit_amount": 0 }
  ]
}
```

Field rules the screen relies on:

| Field | Values |
| --- | --- |
| `profile.status_cd` | `mst_appl_options` group 27: 1 Active, 2 Inactive, 3 Suspended, 4 Closed, 5 Death. Anything except 1 shows an "inactive" alert. |
| `kyc.verify_status` | `mst_member_kyc.KYC_Verified`: 0 pending, 1 verified, 2 rejected |
| `deposits.deposit_type_cd` | 1 savings, 2 term deposit |
| `deposits.holder_role`, `loans.borrower_role` | `primary`, `joint` or `group` (held through an active group membership) |
| `deposits.full_account_no` | **Must match** `full_account_no` in `DepositAccountList` / `SavingsTransactionList`. The savings and FD-settlement links are built from it. |
| `loans.principal_outstanding`, `loans.overdue_amount` | For group loans, the **member's own share**, not the whole group's (see section 5) |
| `loans.is_closed` | `Ln_Status_Cd <> 1` |
| `activity.module` | `savings`, `term`, `loan` or `share`. `(module, ref_id)` must be unique. |
| `activity.credit_amount` / `debit_amount` | Money paid in / paid out from the member's point of view |

---

## 5. SQL — `USP_MEMBER_ENQUIRY_GET`

Result sets, in order: **0** status, **1** profile, **2** kyc, **3** groups, **4** nominees, **5** shares, **6** deposits, **7** loans, **8** applications, **9** activity. On error only set 0 is returned.

Code values used below (from `mst_appl_options`):

- `Cust_Type_Cd` (group 34): 1 Group, 2 Individual
- Shares `Tr_Status_Cd` (group 48): 1 Entered (pending), 2 Approved
- Savings `Tr_Status_Cd`: 1 posted (same as the FD settlement guide)
- Loan collections: `Tr_Status_Cd IN (1, 2)` are live rows; 3/4/5 are rejected, reversed or deleted

```sql
DROP PROCEDURE IF EXISTS USP_MEMBER_ENQUIRY_GET;
DELIMITER ;;
CREATE PROCEDURE USP_MEMBER_ENQUIRY_GET(
    IN p_member_id INT,
    IN p_branch_id INT          -- NULL only for head-office users
)
BEGIN
    DECLARE v_branch INT DEFAULT NULL;

    SET v_branch = (SELECT Branch_Id FROM mst_member WHERE Member_Id = p_member_id);

    IF v_branch IS NULL THEN
        SELECT 'ERROR' AS status, 'Member not found' AS message, 404 AS http_status;
    ELSEIF p_branch_id IS NOT NULL AND v_branch <> p_branch_id THEN
        SELECT 'ERROR' AS status, 'This member belongs to another branch' AS message, 403 AS http_status;
    ELSE
        SELECT 'SUCCESS' AS status, 'OK' AS message, 200 AS http_status;

        -- 1. profile
        SELECT
            m.Member_Id AS member_id,
            m.Member_Code AS member_code,
            m.Ref_Code AS ref_code,
            m.Member_Name AS member_name,
            m.Father_Name AS father_name,
            m.Spouse_Name AS spouse_name,
            gd.Opt_Description AS gender_desc,
            DATE_FORMAT(m.Date_of_Birth, '%Y-%m-%d') AS date_of_birth,
            TIMESTAMPDIFF(YEAR, m.Date_of_Birth, CURDATE()) AS age,
            m.Mobile_No AS mobile_no,
            m.Alternate_Mobile_No AS alternate_mobile_no,
            m.Email_Id AS email_id,
            IF(IFNULL(m.PAN_No, '') = '', NULL,
               CONCAT(REPEAT('X', GREATEST(CHAR_LENGTH(m.PAN_No) - 4, 0)), RIGHT(m.PAN_No, 4))) AS pan_masked,
            (SELECT CONCAT_WS(', ', NULLIF(l.Address_Line1, ''), NULLIF(l.Address_Line2, ''), NULLIF(l.Village, ''),
                              NULLIF(l.Block_Name, ''), NULLIF(l.District_Name, ''), NULLIF(l.Pin_Code, ''))
               FROM mst_member_location l
              WHERE l.Member_Id = m.Member_Id AND l.Is_Active = 1
              ORDER BY l.Add_Type_Cd, l.Member_Loc_Id DESC
              LIMIT 1) AS address,
            m.Branch_Id AS branch_id,
            b.Branch_Name AS branch_name,
            c.Center_Name AS center_name,
            fo.Full_Name AS fo_name,
            DATE_FORMAT(m.Joining_Date, '%Y-%m-%d') AS joining_date,
            m.Occupation_Details AS occupation,
            m.Monthly_Income AS monthly_income,
            m.Current_Status_Cd AS status_cd,
            cs.Opt_Description AS status_desc
        FROM mst_member m
        LEFT JOIN mst_appl_options gd ON gd.Opt_Grp_Id = 28 AND gd.Opt_Code = m.Gender_Cd
        LEFT JOIN mst_appl_options cs ON cs.Opt_Grp_Id = 27 AND cs.Opt_Code = m.Current_Status_Cd
        LEFT JOIN mst_center c ON c.Center_Id = m.Center_Id
        LEFT JOIN mst_staff fo ON fo.Staff_Id = m.FO_Id
        LEFT JOIN priomicro_core.mst_org_branch b ON b.Branch_Id = m.Branch_Id
        WHERE m.Member_Id = p_member_id;

        -- 2. kyc (group 33 holds two option sets, so filter on Opt_Group)
        SELECT
            k.Member_Kyc_Id AS member_kyc_id,
            dt.Opt_Description AS doc_type_desc,
            IF(CHAR_LENGTH(k.KYC_No) > 4,
               CONCAT(REPEAT('X', CHAR_LENGTH(k.KYC_No) - 4), RIGHT(k.KYC_No, 4)), k.KYC_No) AS kyc_no_masked,
            k.KYC_Verified AS verify_status,
            DATE_FORMAT(k.Expiry_Date, '%Y-%m-%d') AS expiry_date,
            IF(k.Expiry_Date IS NOT NULL AND k.Expiry_Date < CURDATE(), 1, 0) AS is_expired
        FROM mst_member_kyc k
        LEFT JOIN mst_appl_options dt
               ON dt.Opt_Grp_Id = 33 AND dt.Opt_Group = 'Document Type' AND dt.Opt_Code = k.Doc_Type_Cd
        WHERE k.Member_Id = p_member_id AND k.Is_Active = 1
        ORDER BY k.Doc_Type_Cd, k.Member_Kyc_Id;

        -- 3. groups (current first, then history)
        SELECT
            mg.Group_Id AS group_id,
            COALESCE(NULLIF(g.Ref_Code, ''), CAST(g.Group_Code AS CHAR)) AS group_code,
            g.Group_Name AS group_name,
            mg.Member_Role AS member_role,
            DATE_FORMAT(mg.Join_Date, '%Y-%m-%d') AS join_date,
            DATE_FORMAT(mg.Exit_Date, '%Y-%m-%d') AS exit_date,
            IF(mg.Is_Active = 1 AND mg.Exit_Date IS NULL, 1, 0) AS is_active
        FROM mst_member_group mg
        JOIN mst_group g ON g.Group_Id = mg.Group_Id
        WHERE mg.Member_Id = p_member_id
        ORDER BY is_active DESC, mg.Join_Date DESC;

        -- 4. nominees (table from docs/member-nominee-admission-voucher-api.md)
        SELECT
            n.Nominee_Name AS nominee_name,
            r.Opt_Description AS relation_desc,
            n.Share_Percent AS share_percent
        FROM mst_member_nominee n
        LEFT JOIN mst_appl_options r ON r.Opt_Grp_Id = 35 AND r.Opt_Code = n.Nominee_Rel_Cd
        WHERE n.Member_Id = p_member_id AND n.Is_Active = 1
        ORDER BY n.Sort_Order, n.Member_Nominee_Id;

        -- 5. shares (same rules as USP_SHARE_HOLDING_GET)
        SELECT
            COALESCE(SUM(IF(s.Tr_Status_Cd = 2, s.No_Of_Shares, 0)), 0) AS total_shares,
            MAX(s.Face_Value) AS face_value,
            COALESCE(SUM(IF(s.Tr_Status_Cd = 2, s.Subscription_Amount, 0)), 0) AS total_amount,
            COALESCE(SUM(IF(s.Tr_Status_Cd = 2, s.Paid_Amount, 0)), 0) AS paid_amount,
            COALESCE(SUM(IF(s.Tr_Status_Cd = 1, s.No_Of_Shares, 0)), 0) AS pending_shares,
            DATE_FORMAT(MAX(IF(s.Tr_Status_Cd = 2, s.Subscription_Date, NULL)), '%Y-%m-%d') AS last_subscription_date
        FROM trans_share_subscription s
        WHERE s.Cust_Type_Cd = 2 AND s.Customer_Id = p_member_id;

        -- 6. deposits: own, joint, and accounts of groups the member is active in
        DROP TEMPORARY TABLE IF EXISTS tmp_m360_dep;
        CREATE TEMPORARY TABLE tmp_m360_dep AS
        SELECT
            a.Account_Id AS account_id,
            a.Deposit_Type_Cd AS deposit_type_cd,
            IF(a.Deposit_Type_Cd = 1,
               COALESCE(NULLIF(sb.Ref_AcNo, ''), CONCAT(s.Scheme_Code, '/', LPAD(sb.Account_No, 5, '0'))),
               COALESCE(NULLIF(td.Ref_AcNo, ''), CONCAT(s.Scheme_Code, '/', LPAD(td.Account_No, 5, '0')))) AS full_account_no,
            a.Appl_No AS appl_no,
            s.Scheme_Name AS scheme_name,
            CASE WHEN a.Cust_Type_Cd = 1 THEN 'group'
                 WHEN a.Cust_Id_Primay = p_member_id THEN 'primary'
                 ELSE 'joint' END AS holder_role,
            DATE_FORMAT(COALESCE(sb.Start_Date, td.Start_Date, a.Appl_Date), '%Y-%m-%d') AS open_date,
            COALESCE(sb.Current_Balance, td.Current_Balance) AS balance,
            DATE_FORMAT(td.Maturity_Date, '%Y-%m-%d') AS maturity_date,
            td.Maturity_Amt AS maturity_amt,
            a.Appl_Status_Cd AS status_cd,
            IF(a.Closing_Date IS NOT NULL, 'Closed', st.Opt_Description) AS status_desc,
            IF(a.Closing_Date IS NOT NULL, 1, 0) AS is_closed
        FROM mst_deposit_account a
        JOIN mst_deposit_scheme s ON s.Scheme_Id = a.Scheme_Id
        LEFT JOIN mst_deposit_account_sb sb
               ON sb.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_sb x WHERE x.Account_Id = a.Account_Id)
        LEFT JOIN mst_deposit_account_td td
               ON td.Id = (SELECT MAX(x.Id) FROM mst_deposit_account_td x WHERE x.Account_Id = a.Account_Id)
        LEFT JOIN mst_appl_options st ON st.Opt_Grp_Id = 14 AND st.Opt_Code = a.Appl_Status_Cd
        WHERE (p_branch_id IS NULL OR a.Branch_Id = p_branch_id)
          AND (
                (a.Cust_Type_Cd = 2 AND p_member_id IN (a.Cust_Id_Primay, a.Cust_Id_Joint1, a.Cust_Id_Joint2))
             OR (a.Cust_Type_Cd = 1 AND a.Cust_Id_Primay IN (
                    SELECT mg.Group_Id FROM mst_member_group mg
                    WHERE mg.Member_Id = p_member_id AND mg.Is_Active = 1 AND mg.Exit_Date IS NULL))
          );

        SELECT * FROM tmp_m360_dep ORDER BY is_closed, deposit_type_cd, account_id DESC;

        -- 7. loans: individual (primary / joint) and the member's share of group loans
        DROP TEMPORARY TABLE IF EXISTS tmp_m360_loan;
        CREATE TEMPORARY TABLE tmp_m360_loan (
            Loan_Account_Id INT PRIMARY KEY,
            Role VARCHAR(10) NOT NULL,
            Group_Id INT NULL,
            Share_Ratio DECIMAL(12, 8) NOT NULL DEFAULT 1,
            Member_Sanction DECIMAL(14, 2) NULL,
            Member_Disb DECIMAL(14, 2) NULL,
            Overdue_Amount DECIMAL(14, 2) NULL,
            Overdue_Days INT NULL,
            Next_Schedule_Id INT NULL
        );

        INSERT INTO tmp_m360_loan (Loan_Account_Id, Role)
        SELECT la.Loan_Account_Id, IF(ap.Cust_Id_Primay = p_member_id, 'primary', 'joint')
        FROM mst_loan_account la
        JOIN mst_loan_application ap ON ap.Application_Id = la.Application_Id
        WHERE ap.Cust_Type_Cd = 2
          AND p_member_id IN (ap.Cust_Id_Primay, ap.Cust_Id_Joint1, ap.Cust_Id_Joint2)
          AND (p_branch_id IS NULL OR ap.Branch_Id = p_branch_id);

        INSERT IGNORE INTO tmp_m360_loan (Loan_Account_Id, Role, Group_Id, Share_Ratio, Member_Sanction, Member_Disb)
        SELECT la.Loan_Account_Id, 'group', bk.Group_Id,
               IF(IFNULL(la.Disbursed_Amount, 0) > 0, IFNULL(bk.Disb_Amount, 0) / la.Disbursed_Amount, 0),
               bk.Sanction_Amount, bk.Disb_Amount
        FROM mst_loan_account la
        JOIN mst_loan_application ap ON ap.Application_Id = la.Application_Id
        JOIN mst_loan_application_bulk bk
          ON bk.Loan_Application_Id = ap.Application_Id AND bk.Customer_Id = p_member_id
        WHERE ap.Cust_Type_Cd = 1
          AND IFNULL(bk.Appl_Status_Cd, 1) <> 3
          AND (p_branch_id IS NULL OR ap.Branch_Id = p_branch_id);

        -- MySQL can't read a TEMPORARY table twice in one statement, so dues are filled in first
        UPDATE tmp_m360_loan t
        SET t.Overdue_Amount = (SELECT SUM(sc.Total_Due - IFNULL(sc.Advance_Paid, 0))
                                  FROM trans_loanac_schedule sc
                                 WHERE sc.Loan_Account_Id = t.Loan_Account_Id AND sc.Is_Active = 1
                                   AND sc.Collection_Id IS NULL AND sc.Due_Date < CURDATE()),
            t.Overdue_Days = (SELECT DATEDIFF(CURDATE(), MIN(sc.Due_Date))
                                FROM trans_loanac_schedule sc
                               WHERE sc.Loan_Account_Id = t.Loan_Account_Id AND sc.Is_Active = 1
                                 AND sc.Collection_Id IS NULL AND sc.Due_Date < CURDATE()),
            t.Next_Schedule_Id = (SELECT sc.Schedule_Id
                                    FROM trans_loanac_schedule sc
                                   WHERE sc.Loan_Account_Id = t.Loan_Account_Id AND sc.Is_Active = 1
                                     AND sc.Collection_Id IS NULL AND sc.Due_Date >= CURDATE()
                                   ORDER BY sc.Due_Date, sc.Installment_No
                                   LIMIT 1);

        SELECT
            la.Loan_Account_Id AS loan_account_id,
            COALESCE(NULLIF(la.Ref_Account_No, ''), CAST(la.Loan_Account_No AS CHAR)) AS loan_account_no,
            ap.Application_No AS application_no,
            ls.Scheme_Name AS scheme_name,
            t.Role AS borrower_role,
            g.Group_Name AS group_name,
            DATE_FORMAT(la.Loan_Date, '%Y-%m-%d') AS loan_date,
            IF(t.Role = 'group', t.Member_Sanction, la.Loan_Amount) AS loan_amount,
            IF(t.Role = 'group', t.Member_Disb, la.Disbursed_Amount) AS disbursed_amount,
            IF(t.Role = 'group',
               COALESCE((SELECT d.Principal_Outstanding
                           FROM trans_loan_collection_bulk d
                           JOIN trans_loan_collection c ON c.Collection_Id = d.Collection_Id
                          WHERE c.Account_Id = la.Loan_Account_Id AND d.Customer_Id = p_member_id
                            AND c.Tr_Status_Cd IN (1, 2)
                          ORDER BY c.Collection_Date DESC, d.Detail_Id DESC
                          LIMIT 1), t.Member_Disb),
               la.Principal_Outstanding) AS principal_outstanding,
            ROUND(IFNULL(t.Overdue_Amount, 0) * t.Share_Ratio, 2) AS overdue_amount,
            IFNULL(t.Overdue_Days, 0) AS overdue_days,
            DATE_FORMAT(nd.Due_Date, '%Y-%m-%d') AS next_due_date,
            ROUND((nd.Total_Due - IFNULL(nd.Advance_Paid, 0)) * t.Share_Ratio, 2) AS next_due_amount,
            la.Ln_Status_Cd AS status_cd,
            ls2.Opt_Description AS status_desc,
            IF(la.Ln_Status_Cd <> 1, 1, 0) AS is_closed,
            IF(la.Is_NPA = 1, 1, 0) AS is_npa
        FROM tmp_m360_loan t
        JOIN mst_loan_account la ON la.Loan_Account_Id = t.Loan_Account_Id
        JOIN mst_loan_application ap ON ap.Application_Id = la.Application_Id
        JOIN mst_loan_scheme ls ON ls.Scheme_Id = ap.Scheme_Id
        LEFT JOIN mst_group g ON g.Group_Id = t.Group_Id
        LEFT JOIN mst_appl_options ls2 ON ls2.Opt_Grp_Id = 40 AND ls2.Opt_Code = la.Ln_Status_Cd
        LEFT JOIN trans_loanac_schedule nd ON nd.Schedule_Id = t.Next_Schedule_Id
        ORDER BY is_closed, la.Loan_Date DESC;

        -- 8. applications that have not become loan accounts (latest 20, rejected excluded)
        SELECT
            ap.Application_Id AS application_id,
            ap.Application_No AS application_no,
            DATE_FORMAT(ap.Application_Date, '%Y-%m-%d') AS application_date,
            ls.Scheme_Name AS scheme_name,
            IF(ap.Cust_Type_Cd = 1, bk.Requested_Amount, ap.Appl_Amount) AS appl_amount,
            os.Opt_Description AS status_desc
        FROM mst_loan_application ap
        JOIN mst_loan_scheme ls ON ls.Scheme_Id = ap.Scheme_Id
        LEFT JOIN mst_loan_application_bulk bk
               ON ap.Cust_Type_Cd = 1 AND bk.Loan_Application_Id = ap.Application_Id AND bk.Customer_Id = p_member_id
        LEFT JOIN mst_appl_options os ON os.Opt_Grp_Id = 37 AND os.Opt_Code = ap.Appl_Status_Cd
        WHERE ap.Appl_Status_Cd <> 3
          AND NOT EXISTS (SELECT 1 FROM mst_loan_account la WHERE la.Application_Id = ap.Application_Id)
          AND (p_branch_id IS NULL OR ap.Branch_Id = p_branch_id)
          AND (
                (ap.Cust_Type_Cd = 2 AND p_member_id IN (ap.Cust_Id_Primay, ap.Cust_Id_Joint1, ap.Cust_Id_Joint2))
             OR (ap.Cust_Type_Cd = 1 AND bk.Id IS NOT NULL)
          )
        ORDER BY ap.Application_Date DESC, ap.Application_Id DESC
        LIMIT 20;

        -- 9. activity: latest 20 across products
        SELECT module, ref_id, trans_date, reference, description, credit_amount, debit_amount
        FROM (
            SELECT IF(d.deposit_type_cd = 1, 'savings', 'term') AS module,
                   CAST(t.Sav_Trans_Id AS CHAR) AS ref_id,
                   DATE_FORMAT(t.Trans_Date, '%Y-%m-%d') AS trans_date,
                   d.full_account_no AS reference,
                   COALESCE(NULLIF(t.Ledger_Narration, ''), tt.Opt_Description) AS description,
                   IF(t.Trans_Type_Cd IN (1, 3), t.Trans_Amount, 0) AS credit_amount,
                   IF(t.Trans_Type_Cd IN (2, 4, 7), t.Trans_Amount, 0) AS debit_amount,
                   t.Trans_Date AS sort_date, t.Created_At AS sort_at
            FROM trans_savings_transaction t
            JOIN tmp_m360_dep d ON d.account_id = t.Account_Id
            LEFT JOIN mst_appl_options tt ON tt.Opt_Grp_Id = 36 AND tt.Opt_Code = t.Trans_Type_Cd
            WHERE t.Tr_Status_Cd = 1

            UNION ALL

            -- one branch for individual and group loans: tmp_m360_loan may appear only once per statement
            SELECT 'loan',
                   IF(l.Role = 'group', CONCAT(c.Collection_Id, '-', d.Detail_Id), CAST(c.Collection_Id AS CHAR)),
                   DATE_FORMAT(c.Collection_Date, '%Y-%m-%d'),
                   COALESCE(NULLIF(la.Ref_Account_No, ''), CAST(la.Loan_Account_No AS CHAR)),
                   COALESCE(NULLIF(c.Ledger_Narration, ''), 'Loan collection'),
                   IF(l.Role = 'group', d.Total_Amount, c.Total_Collected), 0, c.Collection_Date, c.Created_At
            FROM trans_loan_collection c
            JOIN tmp_m360_loan l ON l.Loan_Account_Id = c.Account_Id
            JOIN mst_loan_account la ON la.Loan_Account_Id = c.Account_Id
            LEFT JOIN trans_loan_collection_bulk d
                   ON l.Role = 'group' AND d.Collection_Id = c.Collection_Id AND d.Customer_Id = p_member_id
            WHERE c.Tr_Status_Cd IN (1, 2)
              AND (l.Role <> 'group' OR d.Detail_Id IS NOT NULL)

            UNION ALL

            SELECT 'share', CAST(s.Subscription_Id AS CHAR), DATE_FORMAT(s.Subscription_Date, '%Y-%m-%d'),
                   s.Subscription_No, CONCAT('Share subscription: ', s.No_Of_Shares),
                   s.Paid_Amount, 0, s.Subscription_Date, s.Created_At
            FROM trans_share_subscription s
            WHERE s.Cust_Type_Cd = 2 AND s.Customer_Id = p_member_id AND s.Tr_Status_Cd = 2
              AND (p_branch_id IS NULL OR s.Branch_Id = p_branch_id)
        ) x
        ORDER BY sort_date DESC, sort_at DESC
        LIMIT 20;

        DROP TEMPORARY TABLE IF EXISTS tmp_m360_loan;
        DROP TEMPORARY TABLE IF EXISTS tmp_m360_dep;
    END IF;
END ;;
DELIMITER ;
```

Notes:

- **Account numbers:** copy the exact `full_account_no` expression from `USP_DEPOSIT_ACCOUNT_LIST` / `USP_SAVINGS_TRANSACTION_LIST` if it differs from the fallback above. The savings and FD-settlement links only open when both screens use the same number.
- **Group loans:** schedules exist only at group level, so the member's overdue and next due are the group figures times `member disbursed / group disbursed`. Outstanding comes from the member's latest bulk collection row (`Principal_Outstanding`), or the disbursed amount when nothing has been collected yet.
- **Field officer:** `mst_member.FO_Id` is joined to `mst_staff.Staff_Id`. Change the join if your FO id points elsewhere.
- **Nominees:** if `mst_member_nominee` is not deployed yet, replace set 4 with `SELECT Nominee_Name AS nominee_name, r.Opt_Description AS relation_desc, 100 AS share_percent FROM mst_member … WHERE Nominee_Name IS NOT NULL`.
- **Indexes** that keep this fast: `mst_deposit_account (Cust_Type_Cd, Cust_Id_Primay)`, `mst_loan_application (Cust_Type_Cd, Cust_Id_Primay)`, `mst_loan_application_bulk (Customer_Id)`, `trans_loanac_schedule (Loan_Account_Id, Collection_Id, Due_Date)`, `trans_savings_transaction (Account_Id, Trans_Date)`, `trans_loan_collection_bulk (Customer_Id)`, `trans_share_subscription (Cust_Type_Cd, Customer_Id)`. Add joint-holder indexes (`Cust_Id_Joint1`, `Cust_Id_Joint2`) if those columns are used often.

---

## 6. Laravel 12 implementation

Reuse `App\Support\StoredProcedure` and `App\Exceptions\ProcedureException` from the FD settlement guide (sections 15.2 and 15.3). Adapt the same three points: tenant connection name, user fields (`branch_id`, `is_head`), and auth middleware.

### 6.1 Controller — `app/Http/Controllers/Api/Member360Controller.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ProcedureException;
use App\Http\Controllers\Controller;
use App\Support\StoredProcedure as Sp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class Member360Controller extends Controller
{
    private const SETS = ['profile', 'kyc', 'groups', 'nominees', 'shares', 'deposits', 'loans', 'applications', 'activity'];

    /** Non-head users are always bound to their own branch, whatever the request says. */
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
            'member_id' => ['required', 'integer', 'min:1'],
            'branch_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $sets = Sp::call('USP_MEMBER_ENQUIRY_GET', [(int) $input['member_id'], $this->branch($request)]);

        $status = $sets[0][0] ?? [];
        if (($status['status'] ?? null) !== 'SUCCESS') {
            $code = (int) ($status['http_status'] ?? 404);
            throw new ProcedureException($status['message'] ?? 'Member not found', in_array($code, [403, 404], true) ? $code : 422);
        }

        $data = [];
        foreach (self::SETS as $index => $key) {
            $rows = $sets[$index + 1] ?? [];
            $data[$key] = in_array($key, ['profile', 'shares'], true) ? ($rows[0] ?? null) : $rows;
        }

        if ($data['profile'] === null) {
            throw new ProcedureException('Member not found', 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Member retrieved',
            'data'    => $data,
        ]);
    }
}
```

### 6.2 Route — `routes/api.php`

```php
use App\Http\Controllers\Api\Member360Controller;

Route::middleware(['auth:sanctum', 'tenant', 'throttle:60,1'])->group(function () {
    Route::get('Member360Get', [Member360Controller::class, 'show']);
});
```

Use the same middleware group as the other tenant routes (and the menu-permission middleware if you have one).

---

## 7. Quick API checks

```bash
# Own-branch member (non-head user) — 200 with all nine keys
curl -s "$API/api/Member360Get?member_id=125" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"

# Member from another branch (non-head user) — 403, even when branch_id is forged
curl -s "$API/api/Member360Get?member_id=999&branch_id=7" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"

# Unknown member — 404
curl -s "$API/api/Member360Get?member_id=99999999" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"

# Bad input — 422
curl -s "$API/api/Member360Get?member_id=abc" -H "Authorization: Bearer $TOKEN" -H "Accept: application/json"
```

---

## 8. What the screen does with each response

| Response | Screen |
| --- | --- |
| 200 | Profile header, totals, attention list and the four tabs |
| 200 with empty lists | Each tab shows its own empty state ("No deposit accounts", and so on) |
| 404 | "Member not found" empty state with the searched code |
| 403 | "Not allowed" message, no retry button |
| 401 | Session cleared by the BFF, user sent to login |
| 5xx / timeout | Error card with Retry |

---

## 9. Test checklist

- [ ] Non-head user: own-branch member opens; another branch's member returns 403 even with a forged `branch_id`.
- [ ] Head-office user: any branch's member opens without `branch_id`.
- [ ] PAN and KYC numbers come back masked; no full Aadhaar or PAN anywhere in the response.
- [ ] Joint holder sees the account with `holder_role = joint`; group member sees group savings with `holder_role = group`.
- [ ] Member who exited a group no longer sees that group's deposits.
- [ ] Group loan: `loan_amount`, `disbursed_amount`, outstanding and overdue are the member's share, not the group total.
- [ ] Overdue: one unpaid past-due instalment gives `overdue_amount > 0` and the right `overdue_days`; paying it clears both.
- [ ] Closed savings / matured-and-settled FD show `is_closed = 1` and drop out of the totals.
- [ ] `full_account_no` matches the savings list; "View" and "Transactions" open the right account.
- [ ] Converted applications disappear from `applications` once a loan account exists; rejected ones never appear.
- [ ] Activity returns at most 20 rows, newest first, with unique `(module, ref_id)`.
- [ ] Member with no accounts, loans, KYC or shares returns 200 with empty lists and `shares` totals of 0.
