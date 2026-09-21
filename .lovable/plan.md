# Sidebar icon refresh

Update the sidebar icons so each menu item has a clearer, more distinctive symbol that matches the Navy Trust look. Icons only — no links, permissions, badges or behaviour change.

## Problems today

- Several items repeat the same icon: Invoice Sent, Invoice Paid, Invoices and Invoice Status all use the same receipt; Work Hours and Monthly Packages share a clock; Work Hours Admin and Invoice Audit Log share a shield.
- Some icons don't match the meaning: Reviews uses an eye, Clients uses a person-with-check, Offers uses a paper plane.
- Stroke weight is the library default, which reads slightly heavy next to the new lighter typography.

## New icon mapping

| Menu item | New icon |
| --- | --- |
| Dashboard | LayoutDashboard |
| Work Hours | Clock |
| Work Hours Admin | CalendarClock |
| Monthly Packages | CalendarRange |
| Invoice Status | ClipboardList |
| Reminders | BellRing |
| User Management | UsersRound |
| Support | LifeBuoy |
| Customer Tickets | TicketCheck |
| Tech Support | Wrench |
| My Orders / Active Orders | ListChecks / Loader-style Clock |
| Invoice Sent | ReceiptText with send accent (Send) |
| Invoice Paid | ReceiptEuro |
| Invoices | Receipt |
| Invoice Audit Log | FileSearch |
| Proposals | FileSignature |
| Offers | HandCoins |
| Google Deletion | UserRoundX |
| Complaints | TriangleAlert |
| Completed | CircleCheckBig |
| Cancelled | CircleX |
| Reviews | Star |
| Companies | Building2 |
| Clients | Contact |
| Inventory | Boxes |
| Rankings | Trophy |
| Analytics | ChartNoAxesColumn |
| User Statistics | ChartPie |
| Settings | Settings2 |
| Deleted | Trash2 |
| Yearly Packages | CalendarDays |
| Social Media group | Share2 |
| Facebook / Instagram / TikTok / Twitter (X) / ABM Website | unchanged |

## Visual polish

- Apply a lighter, consistent stroke (1.75) to all sidebar icons for a finer look next to Urbanist/Epilogue text.
- Keep current sizes (20px main items, 16px submenu items) and spacing so nothing shifts.
- Inactive icons use the muted sidebar foreground; the active item's icon takes the accent colour, matching the existing active underline.

## Technical notes

- Single file: `src/components/dashboard/Sidebar.tsx` — update the lucide-react imports and the `icon:` values in the menu arrays, plus `strokeWidth` and an active-state colour class in the two `<Icon />` renders.
- No changes to routes, roles, badges, counts or the sidebar config hook.
