# Invoice subject: "Media Marketing Rechnung"

## What I found
- The fix is already in the app: the German Send to Client subject is "Media Marketing Rechnung". No "Limited" is left in any invoice subject, in any language.
- The screenshot shows the live CRM your colleagues use. That version hasn't been published yet, so it still shows "Media Marketing Limited Rechnung".

## Steps
1. You publish the app (Publish button, top right). No code changes are needed.
2. After publishing, everyone does a hard refresh (Ctrl+Shift+R).
3. I'll check the published site: open Send to Client on one invoice, pick Deutsch, and confirm the subject reads "Media Marketing Rechnung". No email is sent.
4. If it still shows "Limited" after publishing, I'll look for a saved copy of the old subject and fix it.
