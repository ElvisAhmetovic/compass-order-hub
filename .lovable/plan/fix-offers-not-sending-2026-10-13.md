# Fix offers not sending

## What is wrong

Every offer send today failed with the same error from the email service (Resend): "The abm-team.com domain is not verified." The app code did not change. The email account (RESEND_API_KEY_ABMEDIA) no longer sees abm-team.com as a verified sending domain. Most likely the DNS records for abm-team.com changed or were removed, or the domain was removed from that Resend account. All other emails sent from [noreply@abm-team.com](mailto:noreply@abm-team.com) (invoices, reminders, order confirmations) are probably failing too.

## Steps

1. You (owner): log in to resend.com, open Domains, check abm-team.com.
  - If it shows "Failed/Not started": copy the DNS records it lists (SPF, DKIM, MX for "send") into the DNS settings where abm-team.com is managed, then press Verify.
  - If abm-team.com is missing: add it again and add the shown DNS records.
  - If it is verified there, the saved API key belongs to a different Resend account. Create a new key in the right account and I will replace the stored key.
2. Me: after you confirm, send one test offer and check the email logs, plus a test invoice email, to confirm all sending paths work.
3. Me (optional, only if you want): show a clear message to workers in the CRM ("Email service domain not verified, contact admin") instead of a generic error.

## Not changing

- Sender stays AB Media Team [noreply@abm-team.com](mailto:noreply@abm-team.com); empriatech.com is not verified for sending, so switching to it would also fail.  
  
well we did remove [abm-team.com](http://abm-team.com) domain, were using a different resend domain which you should use from now on here adn test it, it is this one : [mediaamarketing.com](http://mediaamarketing.com)