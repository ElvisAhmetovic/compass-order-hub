

## Fix Invoice Number Sequence Reset Bug

### Root Cause
The `updateInvoiceSequence` method in `src/services/invoiceService.ts` directly upserts `last_sequence` without checking if the new value is lower than the current one. When someone manually set a sequence to 13 via the invoice editor on March 27, it overwrote the existing value of 513, causing all subsequent invoices to number from 013 onwards.

The DB function `generate_invoice_number` has a `GREATEST` check, but `updateInvoiceSequence` bypasses it entirely by writing directly to the table.

### Fix

**1. Database migration — restore correct sequence**
```sql
UPDATE invoice_sequences 
SET last_sequence = 513, updated_at = NOW() 
WHERE year = 2026 AND prefix = 'INV';
```
This restores the counter so the next invoice will be INV-2026-514 (skipping the duplicated 013-018 range).

**2. Fix `src/services/invoiceService.ts` — prevent future resets**

Update `updateInvoiceSequence` to only allow the sequence to go **up**, never down:

```typescript
static async updateInvoiceSequence(year: number, sequence: number): Promise<void> {
  const { data: current } = await supabase
    .from('invoice_sequences')
    .select('last_sequence')
    .eq('year', year)
    .eq('prefix', 'INV')
    .single();

  // Only update if new sequence is higher than current
  const newSequence = current ? Math.max(current.last_sequence, sequence) : sequence;

  const { error } = await supabase
    .from('invoice_sequences')
    .upsert(
      { year, prefix: 'INV', last_sequence: newSequence, updated_at: new Date().toISOString() },
      { onConflict: 'year,prefix' }
    );
    
  if (error) {
    console.error('Failed to update invoice sequence:', error);
  }
}
```

### About the duplicate numbers
INV-2026-013 through INV-2026-018 now exist twice (the originals from early March and the new ones from March 27-30). These are different invoices with different IDs so no data is lost, but they share invoice numbers. You may want to manually renumber the newer duplicates in the Supabase dashboard.

### Files to modify
1. **Database migration** — restore `last_sequence` to 513 for 2026
2. **`src/services/invoiceService.ts`** — add `GREATEST` logic to `updateInvoiceSequence`

