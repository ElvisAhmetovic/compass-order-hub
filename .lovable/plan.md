# AI Outreach QA: results so far and next step

## What happened
- **QA Fail test**: "Not sent – email failed" is the **expected** result. The address was invalid on purpose, and the draft now sits in Failed with a clear error. PASS.
- **QA Reject test**: Send was clicked instead of Reject, so it was sent to a dummy address that doesn't exist. Nobody received it. Sending works, and the approver name (Max Pfenning) is recorded. Reject itself is still untested.
- **QA Send test** (invoice@mediaamarketing.com): still pending, not clicked yet.

## Next step
1. You click **Send** on "QA Send test", then open the email in the invoice inbox and click the unsubscribe link.
2. I add one more draft for testing Reject, and you click **Reject** on it.
3. I check the results:
   - the unsubscribe was recorded
   - a new draft to that address gets blocked
   - the rejected draft shows your name
4. I delete all the QA drafts and the test unsubscribe entry.

No code changes are needed. The app is behaving correctly.
