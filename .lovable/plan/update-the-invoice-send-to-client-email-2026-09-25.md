# Update the invoice “Send to Client” email

## What will change
- Replace the current generic German subject with exactly: **AB MEDIA TEAM Rechnung – Bitte neue Bankverbindung beachten**.
- Replace the German message with the supplied wording, preserving its paragraphs, three-day payment request, Annalena Klein signature, telephone number, and Duisburg address.
- Include the new payment details exactly as supplied:
  - IBAN: `BE54 90 59 97 86 7497`
  - SWIFT/BIC: `TRWIBEB1XXX`
- Update the other nine available language versions—English, Dutch, French, Spanish, Danish, Norwegian, Czech, Polish, and Swedish—with faithful equivalents of the same new-bank warning and subject.
- Keep the subject and message editable before sending.

## Keep both invoice flows consistent
- Update the shared source used by the invoice-detail “Send Invoice to Client” window shown in the screenshot.
- Apply the same templates to monthly invoice sending, which currently uses that shared source too.
- Keep invoice PDF generation, attachment behavior, recipients, reminder scheduling, and sending logic unchanged.

## Selector behavior
- Ensure changing **Invoice Language** updates both subject and message together.
- Ensure the separate **Subject Template** and **Message Template** selectors continue loading the selected translation correctly.
- Keep the invoice’s saved language as the initial selection when the window opens.

## QA
- Add focused checks for all ten subjects and messages, including the exact IBAN, BIC, three-day deadline, and language-specific wording.
- Verify the regular invoice and monthly invoice windows initialize and switch templates correctly.
- Confirm the PDF remains attached and no changes affect invoice status or reminder scheduling.
- Run the project’s automated checks and inspect the dialog in the preview without sending a real client email.
