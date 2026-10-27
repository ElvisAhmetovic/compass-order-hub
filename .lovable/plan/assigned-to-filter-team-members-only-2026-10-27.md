# Assigned To filter: team members only

In the dashboard's Advanced filters, the "Assigned To" list will show only these people:

Thomas Klein, Suzie Mckenna, Stefan Wolf, Ahmetovic Elvis, Paul Katz, Max Pfenning, Marco Lenovski, Johann Nowak, Johan Novak, Ikram Ayoub, David Bergius, Amir Sumez, Ajos Sale

Clients, portal accounts and test or other accounts (Eldin, Fudo, Finance Test, johansuperadmin) will be removed from the list. Names that appear twice (Ajos Sale, David Bergius) will show only once.

## Notes
- I couldn't find any account named "Ahmetovic Elvis". He will appear in the list once his account exists under that name. If he uses a different name in the CRM, please tell me what it is.
- "Johan Novak" is currently a client account (spelled Novak, not Nowak). It will still be included, because you asked for it.
- Nothing else changes: orders, assignments and other screens stay the same.

## Technical
- In `SearchService.getFilterOptions` (`src/services/searchService.ts`), filter profiles against a fixed allowlist of team names (case-insensitive, matching first name + last name in either order, so "Ahmetovic Elvis" also matches "Elvis Ahmetovic"), and remove duplicates by name.
- Store the allowlist in `src/config/assignableTeam.ts`, and add a small test that checks a client or test name is excluded.
