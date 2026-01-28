

# Speed Up Inquiry Submission with Background Email Sending

## Problem

Current flow takes ~11 seconds because:
1. Edge function sends 11 emails sequentially with 600ms delays
2. Client-side code `await`s the entire process
3. User sees loading spinner for the full duration

From the session replay: 11.5 seconds between loading spinner → success toast.

## Solution

Use Supabase's `EdgeRuntime.waitUntil()` to run email sending as a **background task**. The edge function returns immediately, and emails continue sending after the response is returned.

```text
BEFORE (Blocking - 11+ seconds):
Client → Edge Function → [Send Email 1] → [600ms] → [Send Email 2] → ... → [Send Email 11] → Response → Client

AFTER (Background - ~200ms):
Client → Edge Function → Response → Client ✓ (instant!)
                      └──► [Background: Send all emails at its own pace]
```

## Technical Changes

### File 1: Edge Function Update
**File**: `supabase/functions/send-support-inquiry-notification/index.ts`

Use `EdgeRuntime.waitUntil()` to defer email sending:

```typescript
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { inquiryData, emails }: SupportInquiryNotificationRequest = await req.json();

    console.log("Received support inquiry notification request:", {
      inquiryId: inquiryData.id,
      recipientCount: emails.length,
    });

    // Validate required fields
    if (!inquiryData.id || !inquiryData.subject || !emails.length) {
      throw new Error("Missing required fields");
    }

    // Define the background email sending task
    const sendEmailsInBackground = async () => {
      const appUrl = Deno.env.get("APP_URL") || "https://www.empriadental.de";
      const emailHtml = generateEmailHtml(inquiryData, appUrl);

      for (const email of emails) {
        try {
          console.log(`[Background] Sending email to: ${email}`);
          const { error } = await resend.emails.send({
            from: "AB Media Team <noreply@empriadental.de>",
            to: [email],
            subject: `New Support Inquiry: ${inquiryData.subject}`,
            html: emailHtml,
          });

          if (error) {
            console.error(`[Background] Failed to send to ${email}:`, error);
          } else {
            console.log(`[Background] Successfully sent to: ${email}`);
          }

          // Rate limiting delay
          await new Promise((resolve) => setTimeout(resolve, 600));
        } catch (sendError: any) {
          console.error(`[Background] Error sending to ${email}:`, sendError);
        }
      }
      console.log(`[Background] Email notification complete for inquiry ${inquiryData.id}`);
    };

    // Schedule background task - function continues running after response
    EdgeRuntime.waitUntil(sendEmailsInBackground());

    // Return immediately - client doesn't wait for emails
    return new Response(
      JSON.stringify({
        success: true,
        message: "Inquiry received, email notifications queued",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-inquiry-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};
```

### How `EdgeRuntime.waitUntil()` Works

- Returns response to client immediately (~200ms)
- Edge function instance stays alive to complete background task
- Emails send at their own pace without blocking user
- Logs still work for debugging (`[Background]` prefix for clarity)

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/send-support-inquiry-notification/index.ts` | Modify | Add background task with `EdgeRuntime.waitUntil()` |

## No Client-Side Changes Needed

The `clientSupportService.ts` code stays the same - it still awaits the edge function, but now the edge function returns instantly.

## Expected Performance Improvement

| Metric | Before | After |
|--------|--------|-------|
| User wait time | ~11-12 seconds | ~0.5-1 second |
| Email delivery | Same | Same (background) |
| Error visibility | Same | Same (logs still work) |

## Outcome

1. Client submits inquiry → sees success toast in under 1 second
2. Emails still send to all 11 team members in the background
3. No emails are lost - the edge function stays alive until complete
4. Better user experience, same functionality

