# AI dropdown in the sidebar

## What changes
- Remove "AI Outreach" and "Services Knowledge" from the main sidebar list.
- Add one new sidebar item called **AI** (sparkles icon) with an arrow.
- Clicking **AI** opens it to show two sub-items:
  - AI Outreach
  - Services Knowledge
- It opens automatically when you're already on one of those two pages, and the active page stays highlighted.
- Same team members as today can see it. The pages themselves don't change.

## Technical details
- `src/components/dashboard/Sidebar.tsx`: drop the two entries from the nav array; add an `aiOpen` state and a collapsible group copying the existing Social / More dropdown pattern (ChevronDown rotate, indented children). Default open when the path starts with `/ai-outreach` or `/services-knowledge`. Collapsed sidebar mode follows the existing dropdowns' behaviour.
