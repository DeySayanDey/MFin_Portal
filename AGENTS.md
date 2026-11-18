<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# MFIN Portal

Production Next.js app. Backend is Laravel. Auth and protected APIs go through the BFF only. Do not invent endpoints, mock APIs, or a second auth mechanism. Map APIs in the feature service layer. Reuse `src/components/shared` and existing tokens. No new UI library without approval.

Locales: `en`, `bn`, `hi`, `or`. Run typecheck, lint, tests, build, or a browser check only when the user asks. Do not open the browser on your own.