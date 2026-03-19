

## Fix: Reminder Not Disappearing After Deletion

### Problem
`handleDelete` deletes the reminder from the database but does not remove it from local `reminders` state. It relies entirely on the realtime subscription to trigger a refetch, which can be unreliable or delayed.

### Changes

**`src/pages/Reminders.tsx`** — Update `handleDelete` to optimistically remove the deleted reminder from local state after successful deletion:

```tsx
const handleDelete = async (id: string) => {
  const { error } = await supabase.from('follow_up_reminders').delete().eq('id', id);
  if (error) {
    toast({ title: 'Error deleting', description: error.message, variant: 'destructive' });
  } else {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Reminder deleted' });
  }
};
```

Single line change — adds `setReminders(prev => prev.filter(r => r.id !== id))` so the UI updates immediately without waiting for the realtime event.

