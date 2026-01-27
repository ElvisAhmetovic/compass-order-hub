
# Plan: Continuation of Bug Fixes and Improvements

## Summary of Progress
We have completed the critical security fixes and migrated several data sources to Supabase:
- ✅ **RLS Security** - Fixed 10+ vulnerable policies across tables
- ✅ **Legacy Auth Removal** - Deleted insecure `authService.ts` and `adminPermissionHelper.ts`
- ✅ **Support Inquiries** - Migrated from localStorage to Supabase
- ✅ **Email Templates** - Migrated from localStorage to Supabase  
- ✅ **Proposal Templates** - Migrated from localStorage to Supabase
- ✅ **Company Settings** - Migrated from localStorage to Supabase

---

## Remaining Issues to Fix

### High Priority: Proposals Data (Data Loss Risk)
**Problem**: The main `Proposals` (not templates) are still stored in `localStorage` using two keys: `"proposals"` (basic data) and `"detailedProposals"` (full data with line items). If a user clears their browser cache, all proposal data is lost.

**Current State**: 
- A `proposals` table exists in Supabase but only has basic fields (id, number, customer, reference, amount, status, user_id, timestamps)
- Missing: subject, currency, vatEnabled, and detailed data (line items, customer details, payment terms, etc.)
- No `proposal_line_items` table exists

**Solution**:
1. Extend the `proposals` table with additional columns for complete proposal data
2. Create a `proposal_line_items` table for line items
3. Create a `proposalService.ts` service layer
4. Update `Proposals.tsx` and `ProposalDetail.tsx` to use Supabase instead of localStorage
5. Update `templateUtils.ts` to work with the new async service

---

### Medium Priority: Performance Issues

#### 1. Polling in Proposals.tsx (Lines 140-151)
**Problem**: Every 3 seconds, the page reads and parses `localStorage` to check for new proposals, even when nothing has changed.

**Current Code**:
```javascript
const interval = setInterval(checkForNewProposals, 3000);
```

**Solution**: Once proposals are migrated to Supabase, we can:
- Use Supabase realtime subscriptions for live updates, OR
- Remove polling entirely since data updates will be triggered by user actions
- Add a manual "Refresh" button for edge cases

#### 2. DashboardCards.tsx - No Issue Found
Upon review, `DashboardCards.tsx` is well-implemented:
- Uses proper React Query pattern with `OrderService`
- Listens for `orderStatusChanged` events for updates
- No redundant polling detected
- **No changes needed**

---

### Low Priority: Code Quality Issues

#### 1. AudioContext Cleanup in useNotificationSound.ts
**Problem**: The `AudioContext` is created but never explicitly closed, which could lead to resource leaks in long-running sessions.

**Current Code**: Only removes event listeners on cleanup, but doesn't close the AudioContext.

**Solution**: Add cleanup for the AudioContext in the useEffect return function:
```javascript
return () => {
  // Remove event listeners
  document.removeEventListener('click', handleUserInteraction);
  document.removeEventListener('keydown', handleUserInteraction);
  // Close AudioContext to free resources
  if (audioContextRef.current) {
    audioContextRef.current.close();
  }
};
```

#### 2. Invoice Settings (useInvoiceSettings.ts) - Partial localStorage Usage
**Problem**: While company settings are now in Supabase via `companySettingsService`, the `useInvoiceSettings` hook still saves template settings (logo, VAT rate, language, etc.) to `localStorage`.

**Solution**: This is acceptable for now because:
- These are user preferences, not critical business data
- They can be regenerated easily
- Full migration would require an `invoice_settings` table

**Recommendation**: Mark as "Future Enhancement" rather than a bug.

---

## Recommended Implementation Order

### Phase 1: Complete the High-Priority Fix
1. **Migrate Proposals to Supabase** (largest remaining data loss risk)
   - Extend `proposals` table with missing columns (subject, currency, vatEnabled, customer details, terms)
   - Create `proposal_line_items` table with RLS
   - Create `proposalService.ts`
   - Update pages to use the service
   - Remove the 3-second polling (performance fix is bundled)

### Phase 2: Apply Low-Priority Fixes
2. **Fix AudioContext cleanup** in useNotificationSound.ts

---

## Technical Details

### Database Migration for Proposals

**Extend proposals table:**
```sql
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 19,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_country TEXT,
ADD COLUMN IF NOT EXISTS customer_ref TEXT,
ADD COLUMN IF NOT EXISTS your_contact TEXT,
ADD COLUMN IF NOT EXISTS proposal_title TEXT,
ADD COLUMN IF NOT EXISTS proposal_description TEXT,
ADD COLUMN IF NOT EXISTS delivery_terms TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
ADD COLUMN IF NOT EXISTS footer_content TEXT,
ADD COLUMN IF NOT EXISTS include_payment_data BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 33,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pdf_language TEXT DEFAULT 'en';
```

**Create proposal_line_items table:**
```sql
CREATE TABLE proposal_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  item_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'unit',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their proposal line items"
  ON proposal_line_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM proposals 
    WHERE proposals.id = proposal_line_items.proposal_id 
    AND proposals.user_id = auth.uid()
  ));
```

### Service Layer Pattern
Create `src/services/proposalService.ts` following the existing pattern in `proposalTemplateService.ts` and `companySettingsService.ts`:
- `getProposals()` - Fetch all user proposals
- `getProposal(id)` - Fetch single proposal with line items
- `createProposal(data)` - Create new proposal
- `updateProposal(id, data)` - Update existing proposal
- `deleteProposal(id)` - Delete proposal

---

## Risk Mitigation

1. **Data Preservation**: The migration will not delete existing localStorage data, allowing users to still access old proposals if migration fails
2. **Backward Compatibility**: Keep the basic localStorage fallback in case of Supabase errors
3. **Incremental Changes**: Each file update is isolated to minimize cascading failures
4. **Existing Workflows**: All proposal creation, editing, viewing, and PDF download workflows will remain the same from a user perspective

---

## What Won't Change (Preserving Existing Functionality)

- Proposal number generation logic (AN-XXXX format)
- PDF generation and download
- Template loading and application
- Line item management (add/remove/edit)
- VAT calculations
- Status update workflow
- Filter and search functionality
- UI layout and styling
