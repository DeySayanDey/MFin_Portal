<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# AGENTS.md

## Project Instructions

This file defines the instructions for AI agents working on this project.

Before making any code changes, you MUST understand the project architecture and follow the applicable project rules.

---

## 1. Required Documentation

Before modifying the codebase, read:

1. `PROJECT_BLUEPRINT.md`
2. The relevant files inside `.cursor/rules/`
3. `docs/PROGRESS.md` — what is done, why, and what remains (update it when you complete a phase or change an architecture decision)

`PROJECT_BLUEPRINT.md` is the source of truth for the project's:
- Architecture
- Folder structure
- Feature organization
- Naming conventions
- Data flow
- API integration
- Shared components
- Development patterns
- Project-wide technical decisions

Do not make architectural changes that conflict with `PROJECT_BLUEPRINT.md` without explicitly updating the blueprint.

---

## 2. Project Rules

The `.cursor/rules/` directory contains the project's coding and development rules.

Available rules:

- `.cursor/rules/00-core.mdc` — Core project rules and general development principles
- `.cursor/rules/10-nextjs.mdc` — Next.js rules and conventions
- `.cursor/rules/20-typescript.mdc` — TypeScript rules and conventions
- `.cursor/rules/30-i18n.mdc` — Internationalization and language rules
- `.cursor/rules/40-api.mdc` — API and backend integration rules
- `.cursor/rules/50-ui.mdc` — UI/UX and component rules
- `.cursor/rules/60-security.mdc` — Security requirements
- `.cursor/rules/70-testing.mdc` — Testing requirements and conventions

### Rule Loading

Always follow `00-core.mdc`.

For a specific task, read and follow the rules relevant to that task.

Examples:

- Next.js page/component → `10-nextjs.mdc`
- TypeScript code → `20-typescript.mdc`
- Translation/i18n → `30-i18n.mdc`
- API/service/backend integration → `40-api.mdc`
- UI/component/styling → `50-ui.mdc`
- Authentication/security/sensitive data → `60-security.mdc`
- Tests → `70-testing.mdc`

When a task involves multiple areas, apply all relevant rules.

---

## 3. Priority of Instructions

When working on this project, follow this priority:

1. System and platform instructions
2. `AGENTS.md`
3. `PROJECT_BLUEPRINT.md`
4. `.cursor/rules/00-core.mdc`
5. Other applicable `.cursor/rules/*.mdc`
6. Existing project patterns and conventions
7. Task-specific requirements from the user

If two project documents conflict, identify the conflict before making a significant architectural change.

---

## 4. Before Writing Code

Before implementing a task:

1. Read `PROJECT_BLUEPRINT.md`.
2. Identify the affected feature/module.
3. Read the applicable `.cursor/rules/*.mdc` files.
4. Inspect the existing implementation and follow established patterns.
5. Check whether the requested change affects the project architecture.
6. Avoid introducing a new pattern when an existing project pattern already solves the problem.

Do not blindly create new files, folders, services, components, hooks, utilities, or APIs.

---

## 5. Architecture Consistency

All new code must fit the architecture described in:

`PROJECT_BLUEPRINT.md`

When adding or modifying a feature:

- Follow the existing feature structure.
- Reuse existing shared components and utilities.
- Reuse existing API/client/service patterns.
- Follow existing naming conventions.
- Follow existing state-management patterns.
- Follow existing validation patterns.
- Follow existing error-handling patterns.
- Do not duplicate functionality that already exists.

If the architecture needs to change, update `PROJECT_BLUEPRINT.md` accordingly.

---

## 6. Rules Are Mandatory

The files in `.cursor/rules/` are not optional documentation.

They are mandatory project development rules.

An agent must not ignore a relevant rule because an alternative implementation appears easier or faster.

Before completing a task, verify that the implementation follows all applicable rules.

---

## 7. Changes to Project Documentation

When a change introduces or modifies:

- Architecture
- Folder structure
- Major feature structure
- API conventions
- Authentication/security patterns
- Internationalization strategy
- UI architecture
- Testing strategy
- Shared infrastructure

update `PROJECT_BLUEPRINT.md` when necessary so the documentation remains synchronized with the actual codebase.

---

## 8. Keep Changes Focused

Only modify files required for the requested task.

Do not:

- Rewrite unrelated code.
- Change working architecture without a reason.
- Introduce unnecessary dependencies.
- Rename existing structures without necessity.
- Remove existing functionality without explicit requirements.
- Make unrelated formatting changes.

Prefer small, predictable, reviewable changes.

---

## 9. Verification

After implementing a change:

1. Check TypeScript/build errors.
2. Check lint errors when applicable.
3. Run relevant tests.
4. Verify API contracts when API code was changed.
5. Verify UI behavior when UI code was changed.
6. Confirm that the implementation still follows `PROJECT_BLUEPRINT.md`.
7. Confirm that all applicable `.cursor/rules/*.mdc` rules were followed.

---

## 10. Final Response

When completing a task, briefly report:

- What was changed
- Files affected
- Any important architectural decisions
- Verification performed
- Any remaining issues or limitations

Do not claim that a test, build, or verification was performed unless it was actually performed.

<!-- END:nextjs-agent-rules -->