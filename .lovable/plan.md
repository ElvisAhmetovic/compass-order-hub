# QA plan: AI Outreach (Pending, Sent, Rejected, Failed, All)

Right now there are 10 drafts, all **Pending**. Nothing has been sent, rejected or failed yet, so the other tabs have never been tested with real entries.

## Safety rule
No real client will get an email. I'll make 3 QA drafts addressed to an internal test address (invoice@mediaamarketing.com unless you give me another one), marked "QA test" in the subject. The 10 real drafts stay untouched.

## Checks
1. **Pending tab**: lists drafts, search by name/email works, editing subject/body saves, and the details/history panel opens.
2. **Send → Sent**: approve QA draft #1. Confirm it moves to the Sent tab and shows who approved it and when, and that the email arrives with the edited text plus a working unsubscribe link.
3. **Unsubscribe**: open that link. Confirm the address ends up on the opt-out list, and that trying to send another draft to it gets blocked and moves it to Rejected ("Client unsubscribed").
4. **Reject → Rejected**: reject QA draft #2 and confirm it appears under Rejected with its history.
5. **Failed**: make sending fail on purpose with QA draft #3 (an invalid recipient address). Confirm it lands in Failed with a readable error and doesn't get stuck in "sending".
6. **Guards**:
   - Double-clicking Send sends only one email.
   - Sending outside weekdays 09:00–17:00 Sarajevo is blocked with a clear message.
   - Approving a draft that's no longer pending is refused.
7. **All tab**: counts match the other tabs added together.
8. **Cleanup**: delete the QA drafts and the test opt-out entry so the history only shows real activity.

## Fixes
I'll fix any bug these checks turn up and re-run the check that found it. At the end I'll report pass/fail for each tab.

## Technical details
- QA drafts are inserted directly into `outreach_drafts`. Send and Reject run through the real UI with Playwright as a signed-in team user, which calls the `outreach-send` edge function.
- The failure case uses a malformed `to` value so Resend rejects it. Edge function logs are checked for every step.
