

## Fix Input Box Vertical Alignment in Contract Details

### Problem
The input boxes in the "Contract Details" grid row are not vertically aligned because labels like "Duration (months)" and "Total Value *" wrap to two lines while "Currency" and "Billing Freq." stay on one line. This pushes input boxes down inconsistently.

### Solution
Add a fixed minimum height to all `FormLabel` elements in this grid row so they occupy the same vertical space regardless of text wrapping. This keeps all input boxes aligned horizontally.

### File to Modify
**`src/components/monthly/CreateMonthlyContractModal.tsx`** (lines 272-313)

Add `className="min-h-[2.5rem] flex items-end"` wrapper `<div>` around each `<FormLabel>` in the 4-column grid, ensuring all labels take the same height before the input boxes begin.

