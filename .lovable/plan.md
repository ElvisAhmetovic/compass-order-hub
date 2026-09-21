# Dashboard Cleanup and Timed Work-Break Banner

## Changes

- Remove the entire **Needs attention** section from the dashboard, including its background data requests.
- Add one shared break banner for authenticated staff pages so it remains visible while navigating around the CRM.
- Show the banner Monday–Friday using **Europe/Sarajevo** time during:
  - **12:00–13:00** — “Work Break 1h”
  - **15:00–15:30** — “Work Break 30min”
- Display a live countdown showing the remaining break time.
- Animate the banner down from the top when a break begins and back up when it ends.
- Restrict it to admins and workers; client portal users will not see it.
- Make the timing update automatically while the CRM stays open, without requiring a refresh.

## Presentation

- Use the existing Navy Trust design tokens and typography.
- Keep the banner fixed and clearly visible without covering page controls.
- Respect reduced-motion preferences by disabling the slide animation when requested by the device.

## Verification

- Check both break windows and their end boundaries using controlled Sarajevo-time scenarios.
- Confirm weekends and client accounts never show the banner.
- Confirm the dashboard no longer loads or displays the Needs attention section.
- Run the existing type check and test suite.
