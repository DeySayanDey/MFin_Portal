# MFin Portal — Project Progress

| Field | Value |
|-------|--------|
| **Product** | eZi-Micro / MFin Portal (Next.js BFF + Laravel API) |
| **Document type** | Progress & decision log (living document) |
| **Status** | Active — Master / Security integration in progress |
| **Last updated** | 2026-09-19 |
| **Owners** | Engineering (frontend portal) |
| **Related docs** | [`PROJECT_BLUEPRINT.md`](../PROJECT_BLUEPRINT.md), [`AGENTS.md`](../AGENTS.md), [`apilist.txt`](../apilist.txt) |

---

## 1. Purpose

This file is the **single source of truth for delivery progress**:

- What is **done** and shipped in the portal
- **Why** key choices were made (rationale / decision log)
- What **remains** or must change next
- Known **risks / limitations**

Update this document whenever a phase completes, an API is integrated, or an architecture decision changes. Do not treat chat history as the project record.

---

## 2. Current status (executive)

| Area | State | Notes |
|------|--------|--------|
| App foundation (`src/`, App Router, next-intl) | **Done** | Locales: `en`, `bn`, `hi`, `or` |
| Auth BFF (login / logout / sealed session) | **Done** | Bearer never in browser |
| MenuTree + localStorage cache | **Done** | Instant paint; refresh compare; clear on logout |
| Master APIs (Org, Roles, Code Series, Timings, RBI, Branch, Staff) | **Done** | Via `/api/master/*` BFF |
| Audit Log | **Done** | `/api/security/audit-log` + MIS audit trail route |
| Shared UI (DataTable, forms, skeletons, tooltip) | **Done** | Loading = skeletons; icon actions + project tooltips |
| Security hardening (scope, errors, menu routes, HO gate) | **Done (v1)** | Laravel still final SoT for fine RBAC |
| Remaining Master / LMS / Deposit / HR screens | **Not started / mock** | Wait for documented Laravel APIs |
| Module-level permission matrix in session | **Open** | Coarse `isHead` gate only today |
| Automated tests / CI gates | **Open** | Typecheck available; expand coverage |

**Overall:** Portal BFF architecture is production-oriented for integrated Master + Audit modules. Other modules remain UI shells until APIs are documented in `apilist.txt`.

---

## 3. Completed work

### 3.1 Platform & architecture

| Item | Result |
|------|--------|
| Migrated app under `src/` | Feature folders, BFF routes, shared components |
| `PROJECT_BLUEPRINT.md` + `.cursor/rules/*` | Mandatory agent/dev standards |
| next-intl only | No alternate i18n libraries |
| Central `endpoints.ts` | Paths only from `apilist.txt` — no invented URLs |
| Env split | Server secrets (`AUTH_SESSION_SECRET`, Laravel base URL) not exposed to client |

### 3.2 Authentication & session

| Item | Result |
|------|--------|
| Login / logout BFF | `/api/auth/login`, `/api/auth/logout` |
| Sealed httpOnly session cookie | AES-GCM; `sameSite=lax`; `secure` in production |
| Middleware | Unauthenticated → login; authenticated `/login` → home |
| Client never sees Bearer token | Login response returns `{ user }` only |

### 3.3 Navigation

| Item | Result |
|------|--------|
| MenuTree BFF | `/api/menu` → Laravel `MenuTree` |
| localStorage menu cache | Keyed by `userId` + `orgId`; show immediately; background refresh; update only if changed |
| Logout / 401 | Clears memory + localStorage menu |
| Safe menu routes | Allowlist relative paths only (`/…`); reject `http(s):`, `//`, `javascript:` |

### 3.4 Integrated Master / Security features

| Feature | UI route(s) | BFF | Laravel |
|---------|-------------|-----|---------|
| Company profile | `/master/company-profile` | `/api/master/organization` | OrgGet / OrgUpdate |
| Code series | `/master/series` | `/api/master/code-series` | CodeSeriesList / Update |
| Working hours | `/master/timings` | `/api/master/working-hours` | WorkingHoursGet / Update |
| Roles | `/master/roles` | `/api/master/roles` | RoleList / Add / Edit |
| RBI lending policy | `/master/rbi-policies` | `/api/master/rbi-lending-policy` | RbiLendingPolicyGet / Update |
| Branch (Kendra Branch Master tab) | `/master/kendra-jlg` | `/api/master/branch` | BranchList / Add / Edit |
| Staff | `/master/staff` | `/api/master/staff` (+ lookups) | StaffList / Add / Edit + designations / modules |
| States (org form) | (embedded) | `/api/master/states` | StateList |
| Audit log | `/security/...`, `/mis/audit-trail` | `/api/security/audit-log` | AuditLogList (GET) |

### 3.5 UX / shared components

| Item | Result |
|------|--------|
| Shared `DataTable` | Pagination, loading skeleton, empty/error |
| Icon-only row actions | Edit / activate-deactivate / view; project `Tooltip` (not native `title`) |
| Forms | Shared `PageHeader`, `Card`, `TextField`, `CheckRow`, `Button` |
| Page loading | Skeletons for page/form/table/sidebar/dashboard |
| Route transitions | `(app)/loading.tsx` + `template.tsx` fade-in |
| Buttons | `cursor: pointer` on hover |

### 3.6 Security improvements (v1)

| Item | Result |
|------|--------|
| BFF error sanitization | `toBffErrorResponse` — no raw Laravel payloads to browser |
| Session scope binding | Non–head-office: force own `branch_id` / audit `user_id` |
| Staff/branch mutations scoped | Non-HO cannot create branches or write other-branch staff |
| Head-office page gate | Sensitive master/security paths require `user.isHead` |
| Sensitive BFF POSTs | Roles / Org / Timings / Series / RBI require head office |

---

## 4. Decision log (rationale / “why”)

Use this section like lightweight ADRs. Do not reverse these without updating this file.

### D-01 — BFF pattern (Next `/api/*` → Laravel)

**Decision:** Browser calls only same-origin BFF; Laravel Bearer attached server-side.  
**Reason:** Prevents token theft via XSS/`localStorage`, centralizes auth, matches blueprint security rules.  
**Consequence:** Every new API needs a BFF route + feature service/mapper/schema — never `fetch(laravelUrl)` from the client.

### D-02 — No invented endpoints

**Decision:** Only document APIs from `apilist.txt` in `endpoints.ts`.  
**Reason:** Avoid fake contracts and broken integrations.  
**Consequence:** UI for undocumented modules stays mock/placeholder until the API is written down.

### D-03 — Branch UI lives in Kendra “Branch Master” tab

**Decision:** Do not ship a separate `/master/branch` page; use Kendra & JLG Branch Master.  
**Reason:** Matches product IA / legacy menu; reduces duplicate navigation.  
**Consequence:** Branch list/create/edit owned by `KendraBranchMasterTab`.

### D-04 — Domain models are camelCase; DTOs stay snake_case

**Decision:** Map at the boundary (mapper + Zod).  
**Reason:** Keep UI TypeScript idiomatic; isolate Laravel naming.  
**Consequence:** Never bind forms directly to snake_case API fields.

### D-05 — Menu cache in localStorage

**Decision:** Cache menu tree per user/org; refresh and replace only on change; clear on logout.  
**Reason:** Sidebar must feel instant after refresh; menu is not a secret.  
**Consequence:** Always treat menu as UX; authorization remains on BFF/Laravel.

### D-06 — Skeletons instead of spinners for primary loads

**Decision:** Shared skeleton variants for page, table, sidebar, dashboard.  
**Reason:** Industry UX expectation; reduces layout shift; consistent brand.  
**Consequence:** Prefer specific skeletons over generic spinners for known layouts.

### D-07 — Project Tooltip over native `title`

**Decision:** `Button.tooltip` + portal Tooltip.  
**Reason:** Native browser tooltips break visual consistency.  
**Consequence:** Do not reintroduce `title=` for action labels.

### D-08 — Security: session scope + sanitized errors + HO gate

**Decision:** Bind list filters to session; sanitize BFF errors; gate sensitive pages/mutations with `isHead`.  
**Reason:** Addresses IDOR, info disclosure, and authz-only-via-menu risks.  
**Consequence:** Fine-grained module RBAC still depends on Laravel; next step is permission claims in session or a permission API.

### D-09 — Single bottom Save on page forms

**Decision:** Remove duplicate header Save; keep footer/card Save.  
**Reason:** Avoid duplicate primary actions and clutter.  
**Consequence:** Modal forms keep footer actions only (already the pattern).

---

## 5. Remaining work / backlog

Prioritize top → bottom unless product says otherwise.

### P0 — Must before wider production rollout

| ID | Item | Notes |
|----|------|--------|
| R-01 | Confirm Laravel enforces same scope as BFF | Especially `branch_id`, audit `user_id`, role mutations |
| R-02 | Production env checklist | `AUTH_SESSION_SECRET`, HTTPS, cookie `secure`, Laravel CORS/origin |
| R-03 | Expand automated tests | Auth session, BFF scope helpers, menu route sanitizer, critical forms |
| R-04 | Permission model beyond `isHead` | Module/role claims or MenuTree-driven server allowlist |

### P1 — Next API integrations (only after `apilist.txt` entries)

| ID | Item | Notes |
|----|------|--------|
| R-10 | SMS / WhatsApp Gateway | Still mock `GatewayPanel` |
| R-11 | Database & Seed admin | Mock `SeedPanel` — gate carefully |
| R-12 | Loan schemes / COA / Vault / Maker-checker / Wi-Fi Sync | Replace mocks when APIs exist |
| R-13 | Lending / Deposit / HR / Field Force / Customer Portal | Large modules; integrate per documented endpoints |

### P2 — Product / UX polish

| ID | Item | Notes |
|----|------|--------|
| R-20 | Dashboard live metrics | Still static; add `DashboardSkeleton` when API lands |
| R-21 | i18n completeness pass | Keep namespaces mirrored across `en/bn/hi/or` |
| R-22 | Accessibility audit | Focus order, dialogs, table keyboard nav |
| R-23 | README rewrite | Replace create-next-app boilerplate with portal runbook |

### Explicitly out of scope (unless product asks)

- Inventing Laravel endpoints
- Storing Bearer tokens in `localStorage`
- Alternate i18n libraries
- Treating frontend menu visibility as authorization

---

## 6. API integration tracker

| Laravel API | Portal status | BFF path |
|-------------|---------------|----------|
| auth/login | Done | `/api/auth/login` |
| auth/logout | Done | `/api/auth/logout` |
| MenuTree | Done | `/api/menu` |
| StateList | Done | `/api/master/states` |
| Role* | Done | `/api/master/roles` |
| Org* | Done | `/api/master/organization` |
| CodeSeries* | Done | `/api/master/code-series` |
| WorkingHours* | Done | `/api/master/working-hours` |
| RbiLendingPolicy* | Done | `/api/master/rbi-lending-policy` |
| Branch* | Done | `/api/master/branch` |
| Staff* + lookups | Done | `/api/master/staff` |
| AuditLogList | Done | `/api/security/audit-log` |
| *(others)* | Not integrated | — add row when documented |

---

## 7. Known limitations

1. **RBAC is coarse** — `isHead` page/API gates ≠ full module permission matrix.  
2. **BFF cannot fix weak Laravel authz** — session binding reduces risk; backend must still enforce.  
3. **Many module UIs are still demo/mock** — do not present them as live integrations.  
4. **Audit GET only** — no inventing write/delete audit APIs.  
5. **Head-office page redirects** — non-HO users hitting sensitive URLs are sent home (no dedicated 403 page yet).

---

## 8. How to maintain this document

When you finish a meaningful change:

1. Move items from **§5 Remaining** → **§3 Completed** (or add a new completed row).  
2. If you made an architecture choice, add a **§4 Decision** (`D-xx`).  
3. Update **§2 Current status** and **§6 API tracker**.  
4. Set **Last updated** (ISO date).  
5. Keep entries factual — no “almost done” without a clear Done/Open state.

**Suggested commit message when updating this file alone:**  
`docs: update project progress`

---

## 9. Quick links for contributors

| Need | Location |
|------|----------|
| Architecture rules | `PROJECT_BLUEPRINT.md` |
| Agent / Cursor rules | `AGENTS.md`, `.cursor/rules/` |
| Documented Laravel APIs | `apilist.txt` |
| Endpoint constants | `src/lib/api/endpoints.ts` |
| BFF error helper | `src/lib/api/bff-response.ts` |
| Session scope helpers | `src/lib/auth/bff-scope.ts` |
| Permissions (coarse) | `src/lib/permissions/index.ts` |
