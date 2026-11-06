# Smarter AI Outreach: full client picture, monthly runs, own test inbox, Services knowledge base

## 1. AI reads the whole client history

For each client, the AI gets everything we already store, not just the service and price:

- Every order: description, internal notes, status, price, dates, assigned team member.
- Every invoice: paid, open, overdue, cancelled, and amounts.
- Monthly/yearly packages, including stopped and older ones.
- Past outreach emails and replies status.

Rules for using it:

- Clients with **unpaid or overdue invoices** get no offer draft. They show in a separate "Skipped – unpaid invoice" list so the team can see why.
- Internal notes help the AI understand the client, but are **never quoted or revealed** in the email.
- The more detail you write into orders, the better the drafts get.

## 2. Monthly scan, including older contracts

- Runs automatically on the first weekday of each month (instead of every weekday), plus a "Scan now" button.
- Covers clients with no order for 3+ months **and** stopped/ended packages (older contracts), so former package clients get a "come back" draft.
- All existing safety rules stay: human approval, 50/day, weekdays 09:00–17:00 Sarajevo, opt-outs, 90-day cooldown, no invented prices or promises.

## 3. "Send test to me" goes only to whoever clicked it

- The test is sent to the email of the logged-in person who pressed the button (e.g. Max Pfenning gets it at his own login email). Nobody else, never the client.
- The button shows the address before sending.
- I found the current send step doesn't handle test mode properly, so this gets fixed too.

## 4. New sidebar page: "Services Knowledge"

- **Our services (manual):** you add, edit or remove what we sell: name, short description, typical price (optional), languages, active yes/no.
- **What clients buy (AI-collected):** monthly the AI groups all orders into services and shows how often each was bought, revenue share, typical clients, and which services are often bought together. You can confirm, rename or hide these.
- When writing drafts, the AI uses only **active** services from this list plus the client's own history. It can suggest a related service, but only from your list and without inventing prices.

## Open points

- Google review checking (earlier plan) stays separate; it can be added on top later.  
  
once you implement do extensive QA testing on this to make sure it works, following things such as 
  ```markdown
  # Project Rules, Quality Gates & Team Workflow — Media Marketing website

  Rules for anyone (people or AI agents) changing this repository. The git workflow lives in
  [WORKFLOW.md](WORKFLOW.md) and is part of these rules.

  ## 1. Stack & Architecture
  - **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, next-intl (`/frontend`). Hosted on Vercel.
  - **Backend**: FastAPI (Python) (`/backend`). Hosted on Render (`render.yaml`).
    - `routers/` hold the HTTP layer only: paths, parameters, auth dependencies.
    - `controllers/` hold the logic and the Supabase queries.
    - `schemas/` hold the Pydantic request/response models.
    - `models/` and `utils/` hold shared helpers: sanitizer, slugify, email, Stripe, image upload.
  - **Database**: Supabase (PostgreSQL + Auth + Storage). There is a single live project; no separate staging database exists.
    - The repo has **no migrations folder**. Tables, policies and RPC functions (for example `get_services_by_locale_v3`) exist only in Supabase. See Forward Migrations in section 5.
  - **Languages**: locales `de` (default), `en`, `nl`, `da`, `sv`, `fr`, `cs`, with `cs` kept out of Google's index (`INDEXABLE_LOCALES`), all configured in `frontend/src/config/locales.ts`.
    - UI text lives in `frontend/messages/*.json`.
    - Content translations live in the database: the `service_translations` table and the `translations` JSON on posts.
  - **Deploys**: the user merges PRs. Vercel then deploys the frontend from `main` (see section 7 for the one case where it refuses); the user triggers the Render deploy. Never assume a merged change is live until it has been checked on the live site.

  ### Frontend Module Boundaries
  `components/` is grouped by feature (`admin`, `blog`, `checkout`, `services`, `home`, …). `lib/`, `utils/`, `hooks/` and `config/` are shared technical folders. **Work with the structure actually present in the working tree — never write imports against a layout that does not exist.**

  - **A feature owns its own code.** Code that is specific to one feature lives in that feature's folder (`components/<feature>/`), not in a shared folder.
  - **Shared means domain-agnostic.** `components/ui/`, `utils/`, `hooks/` and `config/` hold generic building blocks: UI primitives, formatting, config. Moving something there requires evidence that it is genuinely generic or meaningfully reused.
  - **Cross-feature dependencies must be explicit, minimal, and one-directional.** Never create import cycles between features.
  - **Routes stay thin.** `app/**/page.tsx` fetches, composes and sets metadata. Business logic belongs in components, `lib/` or the backend.
  - **Restructuring is not optimization.** Moving a file changes no runtime behavior. Never claim a performance improvement from reorganization without a before/after measurement.
  - **Prove behavior before optimizing.** A structural refactor must first be shown to change nothing: lint, type-check, build and the smoke journeys (section 4) all pass. Only then may performance or security work be layered on top. Otherwise a later failure cannot be traced to its cause.

  ---

  ## 2. Mandatory Pre-Implementation Protocol
  1. **Gherkin Requirements Specification** (Given / When / Then: a plain-language description of the expected behavior):
     - Before writing implementation code, state your understanding of the requirement in Gherkin format.
     - For a new feature (not a bugfix or content change), wait for explicit user approval before writing implementation code.
  2. **Ambiguity Gate**:
     - If requirements are ambiguous, vague or underspecified, stop and ask. Never make unverified assumptions.

  ---

  ## 3. Implementation Standards & Risk-Based Test Discipline
  - **Write tests with the code, not after it**, wherever a test tool exists (see Current test tooling).
  - **Behavioral coverage, not a test count.** Testing effort is proportional to risk. For new or materially changed behavior, cover:
    - the primary successful behavior
    - every meaningful decision branch introduced or modified
    - relevant boundary conditions
    - relevant failure and error states
    - authorization behavior where applicable
    - a regression case for every bug being fixed
  - **Trivial code needs no artificial tests.** Types, constants, schemas without validation logic, presentation-only components, generated code and pass-through wrappers do not need invented edge cases. Never write a test only to reach a number.
  - **Route authorization is opt-in — prove it per route.** Auth is added per route with a dependency from `backend/dependencies.py`. Nothing at framework level catches a route that forgot it.
    - `Depends(require_user)`: the route needs a login. Guests get 401.
    - `Depends(require_admin)`: the route is admin-only. Guests get 401, and logged-in non-admins get 403.
    - `Depends(get_current_user)`: only for routes that also serve guests, such as checkout. It returns `None` for a guest, and the route must handle that `None`.
    - Every new route that reads or changes user, order, payment or admin data must show its auth dependency in the PR.
    - Every such route ships a test asserting the unauthorized (401) and, where relevant, forbidden (403) responses. See `backend/tests/test_require_user.py` and `test_require_admin.py`.
  - **Strict static typing**:
    - TypeScript: no `any` in new or changed code. The codebase still has many existing `any`s; don't add more, and don't rewrite unrelated ones without approval.
    - Python: complete type annotations on every new or changed function signature and return type.
  - **User-facing Gherkin specifications**: every new user-facing behavior gets its Gherkin scenarios written into the PR description.
    - Executable `.feature` files (under `/tests/features/`, bound to step definitions with `pytest-bdd`) become required once that tooling is approved and installed.
    - Until then, don't add `.feature` files that nothing runs. An unbound feature file is not coverage.
    - Don't write scenarios for trivial implementation details.

  ### Current test tooling (what exists today)
  - **Backend**: pytest.
    - It's listed in `backend/requirements-dev.txt`, which is for development only; Render installs `requirements.txt` only.
    - Set up with `venv\Scripts\python -m pip install -r requirements-dev.txt`.
    - Run from the `backend` folder: `venv\Scripts\python -m pytest`.
  - **Backend test rules:**
    - Tests replace Supabase with a fake, or stop before the database is reached. A test must never read from or write to the live database.
    - When a test loads the real app (`main.app`), use `TestClient` **without** a `with` block. A `with` block runs the startup tasks (section 5, Local backend runs).
  - **Frontend**: no test runner is installed. `src/utils/__tests__/slugify.test.ts` is a standalone script.
  - **Both**: no E2E, coverage or mutation-testing tools.
  - **Adding any further tool** (Vitest/Jest, Playwright, pytest-bdd, Stryker, mutmut) is a dependency change. It needs explicit user authorization (section 5).
  - **Until then, frontend verification** means lint, type-check, production build, and running the change on the local dev server or with read-only checks against live data.

  ---

  ## 4. Tiered Verification Gates
  Use the smallest verification scope that gives reliable confidence. Always report which gate ran, what it covered and what was `N/A` and why. Stop and resolve failures before proceeding.

  ### Gate A — Task Gate (after each implementation task)
  1. Lint the changed frontend files (`npx eslint <files>`).
     - The repo already has lint errors. Show that none of them are on lines you changed.
     - Never add new ones.
  2. Type-check the frontend (`npx tsc --noEmit -p .`). For backend changes, import or compile the changed modules with `backend/venv/Scripts/python.exe`.
  3. Run the tests that cover the changed behavior. For backend changes, that means pytest from `backend/`.
  4. When an API or database boundary is touched, exercise it: call the endpoint, load the page.

  Do not automatically run the full smoke suite or a production build at this stage, unless the dependency impact of a change is uncertain.

  ### Gate B — Pull Request Gate (before a PR is ready to merge)
  1. Full lint (`npm run lint` in `/frontend`). No new errors.
  2. Full type check.
  3. Production build:
     - Turbopack fails locally on this Windows machine (symlink privilege), so build with `npx next build --webpack`.
     - Vercel builds normally.
  4. All unit tests for the affected app, 100% passing. Backend: the full pytest suite. Frontend: `N/A` until a runner is installed; say so.
  5. Integration checks against the live Supabase project for changes to database access, auth, admin or payment paths. These checks are **read-only**: see the Production Data rule in section 5. Otherwise `N/A` with the reason.
  6. Smoke journeys (E2E Policy below) affected by the change, run on the local server.
  7. Coverage and mutation testing as their policies require. Today these are `N/A`: the tools are not installed.

  ### Gate C — Release / Architecture Gate
  Run for a major architectural change, any change to auth, payments (Stripe), the database schema or RPCs, shared infrastructure or critical dependencies, and after a deploy that changes SEO (metadata, sitemap, redirects):
  1. Everything in Gate B.
  2. All smoke and full journeys in every indexable locale.
  3. Authorization regression checks on admin and account routes.
  4. After the user deploys, verify on the live site:
     - status codes
     - canonical/hreflang tags
     - `sitemap.xml`
     - `robots.txt`
     - the changed journeys

  ### Coverage Policy (applies once a coverage tool is installed)
  - New or materially changed business logic keeps at least **80% line and branch coverage** unless a technical justification is documented.
  - Prefer changed-code (diff) coverage. Repository-wide totals belong to Gate C.
  - Never require unchanged legacy code to meet a threshold as a condition of an unrelated change.

  ### Mutation Testing Policy (applies once a mutation tool is installed)
  Mutation testing deliberately introduces small bugs to check that the tests notice.

  **When it is required.** It is required for materially changed logic involving:
  - authentication or admin authorization
  - payments or prices (Stripe, order totals, offers, loyalty/referrals)
  - order and offer state changes
  - persistence writes
  - security-sensitive validation or HTML sanitization
  - slug or URL resolution
  - complex branching

  **When it is `N/A`.** Types, display-only components, constants, configuration, generated code, translations/message files and one-off scripts unsafe to execute under mutation are `N/A` unless they contain real branching. Report the reason for every `N/A`; never omit a changed file silently.

  **How to run it.**
  - Mutate the changed functions, not whole files. Select only the tests that exercise them.
  - Cap a normal PR's mutation work at 30 minutes.
    - Report every completed target's score and survivors.
    - Report unfinished targets as deferred. Never describe a partial run as passing.
  - A score below **70%** on a completed in-scope target is a failure: fix it, or have the reviewer explicitly accept the residual risk.
  - Genuinely equivalent survivors may be documented with specific, verifiable reasoning.
  - Clean up mutation sandboxes after a run.

  ### E2E / Smoke Policy
  - **Smoke** (critical journeys, Gate B):
    - homepage in `de` and `en`, and the language switch
    - services list and a service detail page in a translated locale
    - blog index and a post
    - cart → checkout (Stripe test mode)
    - login/logout
    - order/offer tracking
    - the admin service edit → save
    - the contact form
  - **Full** (Gate C or on a schedule):
    - all admin CRUD flows
    - filters, search, pagination
    - account dashboard
    - legal pages
    - error states
    - every locale

  ---

  ## 5. Non-Negotiable Hard Rules
  - **Strict File Scoping**: Never modify files outside the explicit task scope without prior user approval. If an unrelated bug is observed, log and report it without altering the file.
  - **Explicit Staging Only**: Never use `git add .` or `git add -A`. Inspect `git status` and `git diff`, then stage named paths only. Broad staging has already caused credentials to be committed to this repository.
  - **Never Commit or Print Secrets**: `.env`, `.env.local`, `backend/.env`, API keys, Supabase service-role keys, Stripe keys, Resend keys, tokens and passwords must never be staged or committed. Never echo their values in command output, logs or messages either. `.env.example` files contain placeholders only. Verify before every commit.
  - **Production Data**: the Supabase project is the live site's only database.
    - Never insert, update or delete live data without the user's explicit approval for that specific run. This covers scripts, admin API calls and SQL.
    - Read-only queries are fine.
    - Data scripts default to a dry run and need a flag such as `--apply` to write.
  - **Local Backend Runs — WARNING**: the backend's startup (`main.py`) starts the order auto-approve loop. Every hour it approves delivered orders older than 24 hours **in the live database** and emails customers.
    - Never start the backend locally (`uvicorn`, or `TestClient(main.app)` inside a `with` block) unless `DISABLE_DB_BACKGROUND_TASKS=1` is set in `backend/.env` or in the shell.
    - The loop's first pass runs the moment the server starts, so check **before** starting it. From `backend/`, `venv\Scripts\python -c "import main; print(main.db_background_tasks_enabled())"` must print `False`.
    - The startup log must then say "Auto-approve background task disabled". If it ever says "started", stop the server and tell the user.
    - Render must **not** set this variable; production relies on the loop.
    - The same applies to any future background task that writes to the database: put it behind `db_background_tasks_enabled()`.
  - **Dependency Control**: Never install packages or dependencies (npm or pip) without explicit authorization and a stated reason.
  - **Test Integrity**: Never weaken, disable, skip, `xfail` or delete a failing assertion to force a pass. Never filter mutation survivors to inflate a score. Fix the implementation or report the requirement flaw.
  - **Forward Migrations Only**:
    - Any schema change, RLS policy or RPC function applied in Supabase must also be saved in the same PR as a new, dated SQL file under `supabase/migrations/` (create the folder with the first one).
    - Never edit a migration file that has already been applied. Changes ship as new forward migrations.
  - **Explicit Uncertainty Disclosure**: Report technical uncertainty, boundary-condition concerns and residual risks explicitly. Never present a self-reported result (including a sub-agent's) as verified when it has not been checked against a primary source: the code, the live site, the database.
  - **No Unassigned Architectural Change**: the stack is fixed — Next.js App Router with next-intl, FastAPI with the routers/controllers split, and Supabase.
    - Never independently replace any of these, or redesign auth, routing, the locale/slug model or data access.
    - Never introduce Redis, task queues, message brokers, read replicas, sharding or multi-region setups.
    - Never convert pages between server and client rendering purely for optimization.
    - Propose such work and wait for explicit assignment. "Performance could improve" is never authorization to restructure.
  - **Current-Branch Evidence Rule**: audits, checklists, issue notes (for example `ISSUE-i18n-slugs.md`), hand-off reports, code comments and earlier analyses are evidence to investigate, never current truth. They often describe an older commit. Before implementing a reported defect or missing capability:
    1. Record which branch/commit and date the report evaluated, when knowable.
    2. Inspect the current working branch.
    3. Prove the problem still exists, citing file and line or runtime output.
    4. Search for later fixes and existing tests covering it.
    5. Do not duplicate work that is already resolved.
    6. Where an old test conflicts with an intentional later change, establish the current intended behavior before modifying either code or test.
  - **A Failing Legacy Test Is Not Proof the Code Is Wrong**:
    - When an existing test fails, first check whether a deliberate later change made its assertion obsolete. Establish the intended behavior, correct the stale assertion, and name the change that made it obsolete.
    - This is never a route around Test Integrity. Never adjust an assertion whose failure reflects a real defect, and never revert a deliberate fix to satisfy an old expectation.

  ---

  ## 6. Communication & Dual-Layer Presentation Rule
  - **Dual-layer precision**: be technically exact, and make it immediately clear in plain language.
  - **Inline clarifications**: whenever you use architectural jargon, an algorithm or database/security terminology, follow it with a short everyday explanation in parentheses.
  - **Fact-based rigor**: base claims on data, code inspection and verifiable facts. When claiming prior approval for a decision, cite where it was given.

  ---

  ## 7. Team Git Branching & PR Workflow
  Follow [WORKFLOW.md](WORKFLOW.md) for every task. In short:
  1. `git switch main` and `git pull origin main`.
  2. `git switch -c feature/<short-descriptive-name>`.
  3. Run `git status` and `git diff`, then stage named paths only.
  4. Commit with `feat:` / `fix:` / `docs:` messages and push with `-u`.
  5. Open a PR with `base: main` ← `compare: feature/<name>`.

  Project specifics:
  - Never commit directly to `main`, and never reuse a branch after its PR is merged.
  - **The agent opens the PR; the user merges it.**
    - The GitHub CLI (`gh`) is not installed on this machine. Open the PR through the GitHub REST API (`POST /repos/joka4927-prog/newabmediateam/pulls`), authenticated with the token that `git credential fill` returns for `github.com`. Never print or log that token.
    - After opening it, check that GitHub reports it mergeable and that the Vercel preview build passed, then give the user the PR link.
    - If the API is unavailable, fall back to a compare link with the title and description pre-filled:
      `https://github.com/joka4927-prog/newabmediateam/compare/main...<branch>?expand=1&title=…&body=…`
  - **Never merge through the API.** The login stored in git on this machine is a different GitHub account (MaxPfenning) from the repo owner (joka4927-prog).
    - Vercel blocks the production deploy of a merge made by that account. This happened with PR #308: its status read "Deployment was blocked".
    - The user merges as joka4927-prog, and Vercel then deploys normally.
  - After a merge, Vercel deploys the frontend and the user deploys Render (backend). Say which of the two a PR needs.

  ### Working environment notes (Windows)
  - The shell is PowerShell, with Git Bash also available.
    - In Git Bash, arguments starting with `/` are rewritten into Windows paths. Prefix the command with `MSYS_NO_PATHCONV=1` when passing URL paths.
  - The backend's Python packages are in `backend/venv`. Use `backend/venv/Scripts/python.exe`, not the system Python.
  - `frontend/messages/*.json` use CRLF line endings, 2-space indentation and no trailing newline. Keep that format when editing them programmatically.

  ```

## Technical details

- `outreach-scan`: extend order select with `description, internal_notes, status, assigned_to`; load `invoices` per client email (exclude if any `status in (sent, overdue)` and unpaid); include `monthly_contracts` with status stopped/ended as eligible "lapsed contract" source. Store skip reason in a new `outreach_skips` table (email, reason, scanned_at). Notes passed to prompt flagged as "context only, never quote".
- Cron: change `outreach-scan-daily` to monthly (first weekday) with bounded batches; keep lock + per-run cap; continue in following daily runs until the month's queue is done.
- `outreach-send` test mode: resolve recipient from the caller's JWT email (`auth.getUser`), ignore any client-provided address, prefix subject `[TEST]`, don't change draft status or daily count.
- New tables `service_catalog` (manual) and `service_insights` (AI aggregates), with grants + RLS for non-client team members. New page `/services-knowledge` + sidebar entry. `_shared/outreachDraft.ts` prompt receives active catalog entries.
- Tests: unpaid-invoice exclusion, lapsed-contract eligibility, test recipient = caller email.