# Why the invoice email still says AB MEDIA

## Cause
The Send to Client message text is built inside the CRM screen itself, not on the email server. The fix (Media Marketing LTD + invoice@mediaamarketing.com) is saved in the editor version but has not been published yet. Your team uses the live site www.empriatech.com, which still has the old text, so this invoice went out with "AB MEDIA".

## Fix
1. Publish the app now so the live CRM gets the new signature.
2. After publishing, open Send to Client on any invoice and confirm the message ends with:

```text
Annalena Klein
Media Marketing LTD
+49 203 7090 7262
invoice@mediaamarketing.com
Düsseldorfer Str. 32
47051 Duisburg
```

Emails already sent (like INV-2026-1716) cannot be changed.
