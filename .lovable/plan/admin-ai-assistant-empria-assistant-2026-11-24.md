# Admin AI Assistant ("Empria Assistant")

A chat page inside the CRM where admins ask questions about the business and tell the assistant to do things. It reads live data to answer. For any change it shows a confirmation card first, and nothing changes until you click **Confirm**.

## Expected behavior (Given / When / Then)

- **Given** an admin is signed in, **when** they open *AI > Assistant* in the sidebar, **then** they see their own list of past chats and a **New chat** button. Each chat has its own link, and the history stays after a reload or on another device.
- **Given** a question like "how many orders this month?", **when** it's sent, **then** the assistant looks up the live numbers and answers. It shows what it looked up in a small panel you can open.
- **Given** a request like "create an order for Max Muster, max@x.de, €499", **when** it's sent, **then** the assistant shows a card with exactly what it will create, plus **Confirm** and **Cancel**. It only creates the order after Confirm.
- **Given** a non-admin (agent or client), **when** they try to open the page or use the assistant, **then** they're refused.
- Money totals follow the existing finance-privacy rule: only the allowlisted owner emails get company-wide € totals.

## What it can do (first version)

**Read and answer (no confirmation needed):**
- Counts, sums and searches across orders, clients, invoices, monthly packages, installments, Stripe payments, reminders, support tickets, client-portal accounts and activity, offers.
- Calculations, for example VAT, totals, averages and month-to-month comparisons.

**Change (always confirm first):**
- Create or edit an order, and change an order's status (the invoice sync rule still applies).
- Create an invoice from an order, change an invoice's status, and send the invoice PDF by email using the existing sender.
- Create a payment reminder or follow-up reminder.
- Create or update a support ticket, and change its status.
- Create a monthly package, or pause or resume it.
- Create a client portal account using the existing `ensure-client-portal` flow, which never resets an existing password.
- Make a PDF: it creates the invoice or offer PDF with the existing generators and gives you a download link.

**Not included:** deleting records, Stripe refunds or cancellations, outreach sending, and changing users or permissions. These are left out on purpose, and the assistant will say so.

## Technical details

- **Storage (new migration):** add `assistant_threads` (`user_id`, `title`) and `assistant_messages` (`thread_id`, `role`, `parts` jsonb, `ui_message_id` text). Add GRANTs to `authenticated` and `service_role`, and RLS that allows only the owner when `is_admin()` is true. Also add `assistant_actions` (`thread_id`, `tool`, `args`, `status` pending/confirmed/cancelled/failed, `result`, `confirmed_by`, timestamps) as an audit log.
- **Edge function `admin-assistant`:**
  - It checks the caller's JWT and returns 401/403 unless `is_admin()`.
  - It streams `generateResponse`/`streamResponse` from `@lovable.dev/ai-gateway` with the default `openai/gpt-6-astra` model on the Responses surface, using function tools.
  - Read tools are fixed, parameterized queries. There is no raw SQL.
  - Write tools never run directly. They insert a `pending` row in `assistant_actions` and return a proposal.
- **Edge function `admin-assistant-confirm`:**
  - Admin only. It loads the pending action, checks it again with Zod, and runs it using the same service logic or the existing functions (`send-invoice-pdf`, `ensure-client-portal`, etc.).
  - It marks the action as confirmed or failed, and writes the order and invoice audit logs as today.
- **Shared rules:** `_shared/assistantTools.ts` (the tool list and Zod schemas) and `_shared/assistantRules.ts` (which tools need confirmation, and the finance-total guard).
- **Frontend:**
  - Routes `/dashboard/assistant` and `/dashboard/assistant/:threadId`, plus a sidebar entry in the AI group.
  - The chat uses AI Elements: the transcript, `MessageResponse` markdown, a collapsed `Tool` card, a custom **ConfirmActionCard** and `PromptInput`, with the textarea kept focused.
- **Tests:**
  - Deno tests: an action that needs confirmation is never run without Confirm, a non-admin gets 403, a request without a sign-in gets 401, and the finance guard works.
  - Vitest: thread routing and the message conversion.
- **Rules (PROJECT_RULES.md):** live data stays read-only during testing. I'll check with a test admin and with drafts or test records only, then report Gate A/B.
