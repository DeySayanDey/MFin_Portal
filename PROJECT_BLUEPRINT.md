# Universal Next.js Project Blueprint

> Engineering standard for robust, scalable, secure, accessible, performant, and multilingual Next.js applications.
>
> Use this blueprint across HRMS, ERP, SaaS, e-commerce, admin panels, dashboards, portals, and similar production applications.
>
> Cursor must follow these rules when creating, modifying, or refactoring code unless a project-specific rule is stricter.

## 1. Core Principles

- Prefer simple, maintainable solutions over unnecessary abstraction.
- Use strict TypeScript.
- Avoid `any`; use `unknown`, proper types, and runtime validation.
- Reuse existing components, hooks, services, utilities, schemas, and patterns.
- Keep UI, business logic, API communication, and data transformation separated.
- Prefer Server Components by default.
- Use Client Components only when required.
- Never hardcode user-visible text; use **next-intl** message keys.
- Design multilingual support from the beginning with **next-intl** (mandatory i18n library).
- Validate forms and external data.
- Handle loading, success, empty, error, unauthorized, forbidden, not-found, and network-failure states.
- Design mobile-first and responsively.
- Follow accessibility standards.
- Treat security and performance as first-class concerns.

## 2. Recommended Structure

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   └── (app)/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   ├── layout/
│   └── shared/
├── features/
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       ├── schemas/
│       ├── services/
│       ├── types/
│       └── utils/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   ├── logger/
│   ├── permissions/
│   ├── utils/
│   └── constants/
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
├── messages/
│   ├── en.json
│   ├── bn.json
│   ├── hi.json
│   └── or.json
├── config/
├── types/
└── styles/
```

Avoid giant `utils.ts`, `api.ts`, `types.ts`, or monolithic component files.

## 3. Architecture

Use:

```text
UI
 ↓
Feature
 ↓
Domain/business logic
 ↓
Service
 ↓
API client
 ↓
Backend
```

Feature-specific code belongs inside its feature. Generic code belongs in shared locations only when genuinely reusable.

## 4. Next.js

- App Router.
- Server Components by default.
- Client Components only for state, effects, browser APIs, event handlers, or client-only libraries.
- Keep client boundaries as small as possible.
- Do not add `"use client"` to a whole page when a smaller child can be client-side.
- Keep server-only code out of client bundles.
- Keep middleware/proxy focused on routing-boundary concerns.

## 5. State

Separate:

- Server state: Server Components and TanStack Query where client caching/refetching is needed.
- Client UI state: React state; use a global store only when justified.
- URL state: search, filters, sorting, pagination, tabs.

Avoid duplicating URL state in global state.

## 6. API

Never scatter raw API calls across components.

Use:

```text
Component
 ↓
Hook / Server Action
 ↓
Service
 ↓
Central API Client
 ↓
Backend
```

The API client should centralize base URL, auth, headers, timeout, parsing, errors, cancellation, retry policy, and request/correlation IDs.

Separate API DTOs from domain models:

```text
API DTO
 ↓
Mapper
 ↓
Domain Model
 ↓
UI
```

Do not force backend naming conventions into the frontend.

## 7. Runtime Validation

Use Zod or an equivalent schema library at external boundaries.

Validate where appropriate:

- API responses
- form input
- environment variables
- URL input
- external service responses

TypeScript types alone do not validate runtime data.

## 8. Error Handling

Use a consistent application error model.

Never expose raw backend/internal errors directly to users.

Every production feature must consider:

```text
Loading
Success
Empty
Error
Unauthorized
Forbidden
Not Found
Network Failure
```

## 9. Authentication

Prefer secure server-managed sessions/authentication using secure, `httpOnly` cookies where compatible with the architecture.

Avoid long-lived auth tokens in `localStorage` or `sessionStorage` unless explicitly required and reviewed.

Never expose:

- secrets
- private API keys
- database credentials
- signing keys

to client-side code.

## 10. Authorization

Separate authentication from authorization.

Support where required:

- RBAC
- permission-based access
- tenant isolation
- resource-level authorization

Frontend permission checks are UX controls, not security boundaries. Backend authorization is mandatory.

## 11. Multi-Tenancy

For tenant-aware applications:

```text
User
 ↓
Tenant / Organization
 ↓
Permissions
 ↓
Resource
```

Backend must enforce tenant isolation. Never trust tenant/user IDs supplied only by the browser.

## 12. Internationalization (next-intl)

Multilingual support is mandatory for reusable projects.

**This project must use [`next-intl`](https://next-intl.dev).** Do not introduce alternate i18n libraries (for example `react-i18next`, `next-i18next`, or custom dictionary loaders) unless a project-specific rule is stricter and explicitly replaces this standard.

### Required next-intl setup

- Install and configure `next-intl` for the App Router.
- Use locale-aware routing with a `[locale]` segment.
- Centralize locale config in `i18n/routing.ts` (or equivalent next-intl routing module).
- Use `i18n/request.ts` for server request configuration (`getRequestConfig`).
- Use next-intl navigation helpers (`Link`, `redirect`, `useRouter`, `usePathname`) from the project’s `i18n/navigation` module — not raw `next/link` / `next/navigation` for locale-aware routes.
- Wire next-intl middleware/proxy for locale detection and prefix handling.
- Keep message catalogs under `messages/` with one JSON file per locale.

Prefer locale-aware routing:

```text
/[locale]/
```

Example:

```text
/en/dashboard
/bn/dashboard
/hi/dashboard
/or/dashboard
```

Centralize locale configuration with next-intl.

Example:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "bn", "hi", "or"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
```

### next-intl usage rules

- Server Components: `getTranslations` / `getLocale` from `next-intl/server`.
- Client Components: `useTranslations` / `useLocale` from `next-intl`.
- Prefer namespaced message files or nested namespaces (for example `common`, `auth`, `employees`).
- Keep translation namespaces consistent and mirrored across all locales.
- Use next-intl ICU-style messages for interpolation and pluralization.
- Use next-intl / `Intl` APIs for locale-aware date, time, number, relative-time, and currency formatting.

## 13. Translation Rules

Never hardcode user-visible text. Always go through next-intl message keys.

Translate:

- labels
- buttons
- placeholders
- validation messages
- table headers
- dropdown options
- empty states
- dialogs
- notifications
- tooltips
- accessibility labels
- user-facing errors

Use semantic keys:

```text
common.actions.save
common.actions.cancel
employees.form.firstName
employees.table.status
```

Use interpolation for dynamic values.

Use proper pluralization.

Use locale-aware date, time, number, relative-time, and currency formatting.

Design UI so translated text can grow. Avoid fixed widths for text controls.

Use CSS logical properties for future RTL support:

```css
margin-inline-start
margin-inline-end
padding-inline
inset-inline-start
```

CI should detect missing/extra translation keys and invalid interpolation variables across all next-intl message catalogs.

## 14. Forms

Use a centralized schema strategy, preferably React Hook Form + Zod when appropriate.

Every production form should have:

- schema
- validation
- defaults
- field errors
- submit/loading state
- server error handling
- success feedback
- accessibility
- responsive layout

Never rely only on frontend validation.

## 15. UI Architecture

Three levels:

```text
Primitive UI
Button, Input, Select, Dialog, Badge...

Composite UI
DataTable, FilterPanel, Pagination, PageHeader, Skeleton variants
(PageFormSkeleton, DataTableSkeleton, SidebarNavSkeleton, DashboardSkeleton, PageListSkeleton)...

Feature UI
EmployeeTable, EmployeeForm, PayrollSummary...
```

Do not put business-specific components in generic `ui/`.

Before creating a component, search for an existing implementation.

## 16. Design System

Centralize:

```text
colors
typography
spacing
radius
shadows
breakpoints
z-index
motion
```

Use semantic design tokens.

Do not scatter arbitrary visual values throughout the application.

Dark mode should use the same semantic component tokens rather than separate light/dark components.

## 17. Accessibility

Consider:

- semantic HTML
- keyboard navigation
- visible focus
- screen readers
- labels
- contrast
- reduced motion
- form error announcements
- dialog focus management
- Escape behavior

Use meaningful image alt text unless decorative.

## 18. Responsive Design

Use mobile-first design.

Test:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Avoid unnecessary fixed widths and horizontal overflow.

## 19. Tables

Reusable tables should support, as required:

- loading
- empty
- error
- pagination
- sorting
- filtering
- responsive behavior
- long text
- row actions
- accessibility

Distinguish "no data" from "no matching results."

## 20. Config-Driven UI

Use configuration for repetitive structures such as:

- navigation
- table columns
- forms
- filters
- permissions
- reports
- dashboard widgets

Do not make everything config-driven. Use normal components when configuration becomes harder to maintain than code.

## 21. File Uploads

Validate:

- MIME type
- extension
- size
- dimensions where relevant

Backend must validate uploads again.

Use private storage and signed URLs where appropriate.

## 22. Images

Prefer `next/image` when appropriate.

Provide dimensions/aspect ratio, suitable `sizes`, meaningful alt text, and appropriate loading behavior.

Avoid shipping oversized images.

## 23. Performance

Avoid unnecessary:

- client JavaScript
- re-renders
- API requests
- duplicate data fetching
- large images
- unnecessary dependencies
- bundle growth

Prefer Server Components, streaming/Suspense, caching, code splitting, and image optimization where appropriate.

Do not optimize blindly; measure when practical.

Avoid request waterfalls. Parallelize independent requests.

## 24. Logging and Observability

Centralize logging.

Useful production context can include:

```text
request ID
operation
error code
timestamp
safe user/tenant context where appropriate
```

Never log passwords, tokens, secrets, or unnecessary private data.

Monitor errors, failed/slow API calls, frontend crashes, and important performance signals where required.

## 25. Security

Consider:

```text
authentication
authorization
CSRF
XSS
CORS
input validation
output encoding
rate limiting
file upload security
secret management
dependency vulnerabilities
session security
tenant isolation
```

Never trust client-side input or permissions.

## 26. Environment

Separate public and server-only environment variables.

```text
NEXT_PUBLIC_*  → safe for browser exposure
PRIVATE_*      → server-only
```

Validate environment variables at startup.

Maintain `.env.example` without real secrets.

## 27. Naming

| Item | Convention |
|---|---|
| Files | kebab-case |
| Components | PascalCase |
| Functions | camelCase |
| Variables | camelCase |
| Constants | UPPER_SNAKE_CASE |
| Types | PascalCase |
| Hooks | useSomething |
| Translation keys | dot notation |
| API DTOs | backend convention |
| Domain models | camelCase |

## 28. Business Logic

Do not put substantial business rules inside JSX.

Extract reusable rules into testable functions/services.

Avoid magic values. Use named constants/enums where appropriate.

## 29. Testing

Use appropriate levels:

### Unit
- utilities
- schemas
- mappers
- business rules

### Integration
- services
- forms
- important components
- API interactions

### E2E
Critical journeys such as:

```text
login
create
edit
delete
search
filter
authorization
language switching
```

## 30. Error Boundaries

Use global, route, and/or feature-level error boundaries where appropriate.

Provide recovery-oriented error UI.

## 31. SEO

For public pages, configure appropriate:

- title
- description
- Open Graph
- canonical URL
- robots
- structured data where useful

Keep private application pages out of search indexing.

## 32. Git

Use meaningful commits:

```text
feat: add employee management
fix: resolve pagination issue
refactor: simplify API client
perf: reduce dashboard requests
i18n: add Bengali next-intl messages
test: add employee service tests
docs: update architecture
```

Avoid meaningless commits such as `update`, `final`, or `changes`.

## 33. Documentation

Maintain:

```text
README.md
PROJECT_BLUEPRINT.md
ARCHITECTURE.md
.env.example
CHANGELOG.md
docs/adr/
```

Record major architectural decisions as ADRs.

## 34. Refactoring

Before refactoring:

1. Understand the current implementation.
2. Identify dependencies and callers.
3. Preserve behavior unless the change intentionally alters it.
4. Make the smallest safe change.
5. Do not rewrite unrelated code.
6. Test affected areas.
7. Check for regressions.

## 35. Definition of Done

A feature is complete only when applicable checks pass:

- [ ] TypeScript
- [ ] lint
- [ ] build
- [ ] API contract
- [ ] runtime validation
- [ ] loading state
- [ ] empty state
- [ ] error state
- [ ] authorization
- [ ] form validation
- [ ] responsive UI
- [ ] accessibility
- [ ] next-intl (no hardcoded user-visible strings)
- [ ] locale-aware formatting
- [ ] security
- [ ] performance
- [ ] tests
- [ ] documentation when architecture changes

## 36. Golden Rule for Cursor

> Before writing code, understand the existing architecture. Before creating something new, search for an existing solution. Before changing behavior, understand its dependencies. Keep implementation typed, reusable, secure, accessible, responsive, performant, and multilingual by default with next-intl.
