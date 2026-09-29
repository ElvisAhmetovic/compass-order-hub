UPDATE public.email_templates
SET body = '<p>Hello,</p>
<p>We would like to kindly remind you that we have not yet received your payment!</p>
<p>Your payment means a lot to us as motivation for continuing our work on your project, and it also covers our costs, as we have substantial investments that compel us to remind you about payments.</p>
<p>It would be nice if you could let us know when you were planning to pay our invoice.</p>
<div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
  <p><strong>Company:</strong> {companyName}</p>
  <p><strong>Order Date:</strong> {orderDate}</p>
  <p><strong>Amount Due:</strong> {amount}</p>
</div>
{customMessage}
<p>Kind regards,<br>Annalena Klein<br>AB MEDIA TEAM<br>+49 203 7090 7262</p>'
WHERE type = 'payment_reminder' AND user_id IS NULL
AND name IN ('Friendly Reminder', 'Professional Notice', 'Urgent Payment Due', 'Final Notice')
AND (body LIKE '%We hope this message finds you well%' OR body LIKE '%formal notice regarding the outstanding balance%' OR body LIKE '%Your payment is now overdue%' OR body LIKE '%THIS IS YOUR FINAL NOTICE%');