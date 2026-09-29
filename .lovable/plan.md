# Update client payment reminder wording

## What will change
- Use the boss's supplied German and English messages as the standard body of **all client-facing payment reminders**, including automatic invoice reminders, manually sent invoice reminders, and order payment reminders. Preserve the wording, Annalena Klein signature, AB MEDIA TEAM name, and phone number; format it as readable paragraphs without changing its meaning.
- Keep existing invoice/order references, outstanding amounts, and payment details where they belong in the email, but remove old introductory, closing, or urgency copy that conflicts with or repeats the new message. Leave subject lines unchanged because no new subject was supplied.
- Make the matching English or German wording appear in the editor and preview before staff send a manual reminder. Preserve staff's ability to edit a message, attach an invoice where available, and use their own custom templates.
- Keep other-language reminders, internal team follow-up notices, non-payment notifications, recipients, scheduling, opt-outs, and sending rules unchanged.

## Technical approach
- Update the English/German client body in the automatic invoice-reminder function; leave internal team email content and existing language detection untouched.
- Update English/German built-in order reminder translations and the server's fallback email so default sends agree with the preview. Account for the four existing named reminder styles without changing other languages or replacing deliberately custom template content.
- The manual invoice editor loads saved `payment_reminder` templates from the database. Update only the built-in stock template wording (without overwriting independently customized templates), and provide an English/German choice for the manual invoice reminder if needed so both versions are accessible. Use the database migration flow for any saved-template changes.
- Add focused tests for both languages and all three client-facing send paths, including no duplicate old copy or signature; inspect manual previews without emailing real clients.
