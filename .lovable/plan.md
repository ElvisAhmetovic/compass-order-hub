# Teach the assistant the whole site, real client replies, full knowledge panel, outreach flow diagram

## 1. Full site walkthrough loaded into Assistant knowledge
- Go through every team page (about 85 screens: Dashboard, Orders/statuses, Invoices, Monthly/Yearly packages, Offers/Proposals, Clients + profile, Companies, Customer Tickets, Support/Tech Support, AI Outreach + Replies, Reminders, Reviews/Trustpilot/Google deletion, Rankings, Work hours, Team chat, Text library, Services knowledge, Email management, User management, Settings, Client portal, public site).
- For each: what the page is for, what every button does, what each status means, who can see it.
- Save as Assistant knowledge entries grouped by topic (orders, invoices, packages, outreach, portal, tickets, team, settings…), marked "Built-in site walkthrough" so they show in the panel and can be edited or switched off.
- Expand the short built-in site guide with the same core status meanings.
- Nothing invented: only what the screens actually do; no bank details or passwords.

## 2. Learn from real client replies and conversation history
- Read stored client replies and team answers (read-only) and save short patterns: common client questions, objections, tone, and how the team answered.
- Use: the assistant can (a) answer "how would a client react to this?" in a realistic client voice, and (b) suggest replies to clients in the team's style. Suggestions are drafts only; sending still needs a human.
- No personal details (names, emails, phone, amounts) are copied into knowledge — only anonymised patterns.
- Saved under a "Client replies" topic, refreshable with a "Learn from replies" button (admin only).

## 3. Full Assistant knowledge panel
The panel exists in a basic form; extend it to:
- Search, topic filter with counts, source badge (taught in chat / site walkthrough / learned from replies / added manually).
- Add, edit, switch on/off, delete (admin), bulk switch-off/delete.
- Separate "Processes" and "Rules" sections with a short template for each so you can write how things are done.
- Shows who taught it and when; warns when nearing the 80-facts-in-use limit (raise it to ~150 to fit the walkthrough).

## 4. Flow diagram on AI Outreach page
A collapsible "How outreach works" card, simple boxes and arrows:
```text
AI draft -> Pending -> Team approves -> Offer sent (office@, reply to app)
   -> Client replies -> Replies tab + ticket + copy to approver's email
        -> Answer in app (office@)   or   answer from own email (copied to thread)
Mail to office@ -> Gmail forward -> Replies "Office inbox"
```

## Technical details
- Seeding: one forward-only migration inserting `assistant_knowledge` rows (add `source` text column, default 'chat'). Content written from reading the source files.
- Reply learning: new team-JWT edge function `assistant-learn-replies` reads `outreach_replies` + `outreach_messages`, asks the AI gateway for anonymised patterns, runs each through `factRejectReason` plus a PII filter, upserts with source 'replies'. Prompt gets a rule: client-voice only on request, never presented as a real client.
- `MAX_FACTS_IN_PROMPT` raised to 150; prompt orders by topic.
- Panel: extend `AssistantKnowledgePanel.tsx`; diagram: new `OutreachFlowDiagram.tsx` in AI Outreach.
- Tests: PII filter, source labelling, fact limit.
