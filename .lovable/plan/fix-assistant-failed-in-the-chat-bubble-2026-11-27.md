# Fix "Assistant failed" in the chat bubble

## What's wrong
The chat bubble remembered a conversation that no longer exists (that's why the conversation picker at the top is empty). Every message goes to that missing conversation, the server answers "conversation not found", and you see "Assistant failed". The AI itself is fine; it was never reached.

## Fix
1. When the bubble opens, if the remembered conversation isn't in your list anymore, forget it and show "Start a chat" (or pick your latest one).
2. If sending ever gets "conversation not found", start a fresh conversation automatically and resend your message, so nothing is lost.
3. Show a clear message for other failures instead of the generic one.

## Technical details
- `AssistantBubble.tsx`: after `useAssistantThreads` loads, clear `threadId` when it is not in `threads` (also clears sessionStorage).
- `AssistantChat.tsx`: read `FunctionsHttpError` context; on 404 "Thread not found" call `onNewChat`-style create and retry once; surface the server error text in the toast.
- Test: bubble drops a stale saved thread id.
