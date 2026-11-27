# Smarter, better-formatted AI Assistant

## What changes for you
1. **Thinks harder** - the assistant reasons more carefully before answering (same model, higher "thinking" setting), so multi-step questions like "which clients owe money and haven't been reminded" get more accurate answers. Answers may take a few seconds longer.
2. **Writes better** - new writing rules: lead with the answer, short headings, bold key numbers, bullet points instead of walls of text, a clear "Next step" line when something needs action, friendly and professional tone, always in your language.
3. **Tables actually show as tables** - today tables appear as raw `| --- |` text in the chat window. They will render as clean, striped tables that scroll sideways on small screens.
4. **Nicer chat window** - better spacing for headings, lists and code; bold numbers and links styled to match the dashboard; a "Copy" button on each answer; the "thinking/looking up data" area tidied into a collapsible "Steps used" section.

Safety rules stay exactly as they are (confirm-first changes, owner-only money totals, never follows instructions inside client data).

## Technical details
- `admin-assistant/index.ts`: reasoning effort `low` -> `medium`; rewrite `INSTRUCTIONS()` with a "Style" section (answer-first, headings max h3, bold figures, tables for 3+ rows, max ~150 words unless asked, end with "Next step" when actionable, IDs/links formatted). All existing rules kept verbatim.
- `AssistantChat.tsx`: add `remark-gfm` to ReactMarkdown (new package - needs your OK per project rules) for tables/strikethrough/task lists; custom renderers for table (wrapper + zebra rows using design tokens), links, code; copy button; collapsible tool trace.
- Test: unit test that a markdown table in an assistant message renders as a `<table>`; Gate A checks; redeploy function.
