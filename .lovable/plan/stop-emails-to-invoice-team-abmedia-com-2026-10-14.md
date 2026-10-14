## Stop emails to invoice@team-abmedia.com

### What I found
- The address is no longer in any CRM email list, saved setting, template or user account.
- One part of the earlier switch is still only in the unpublished version: when someone marks an order as created or paid in the live CRM, the internal copy still goes to the old address. This is the most likely source of what still arrives.

### Steps
1. Publish the app, so the live CRM at www.empriatech.com sends those order copies to invoice@mediaamarketing.com.
2. Check the email sending logs for the last days for anything still sent to invoice@team-abmedia.com, and remove any other source found.
3. Mark one test order as paid and confirm the copy arrives only at invoice@mediaamarketing.com.

### Note
If emails still arrive after this, they come from outside the CRM (for example a forwarding rule in the mailbox provider). I'll need a screenshot of one to tell.
