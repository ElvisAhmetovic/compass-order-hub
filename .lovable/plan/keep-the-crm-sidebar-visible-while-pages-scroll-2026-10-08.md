# Keep the CRM sidebar visible while pages scroll

## Goal
Keep the complete CRM sidebar available on long dashboard and admin pages instead of leaving its buttons behind at the top of the page.

## Changes
1. Update the shared CRM sidebar so it stays within the browser window while the main page scrolls.
2. Give the sidebar a stable full-screen height and prevent it from shrinking beside wide or long content.
3. Let the sidebar menu scroll independently when all navigation items do not fit on screen, while keeping the CRM heading and clock visible.
4. Apply the behavior everywhere that uses the shared dashboard sidebar; public marketing pages and the client portal remain unchanged.
5. Preserve all existing navigation, active-page indicators, badges, permissions, colors, and open/closed menu behavior.

## Technical details
- Use a sticky, viewport-height sidebar rather than a fixed overlay, so the existing two-column page layout and content width remain intact.
- Add vertical overflow only to the navigation area, avoiding a second whole-page scroll region.
- Keep the sidebar width fixed at its current size.

## Verification
- Check the dashboard and another long sidebar page while scrolling.
- Confirm the sidebar stays visible and its menu can independently reach every item.
- Confirm short pages, active links, expandable groups, badges, and the main page layout are unchanged.
- Check the current build output for errors.
