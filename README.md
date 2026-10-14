# NUSC Library

Arabic RTL library visit tracking for the National University of Sadat City.
Built with React, TypeScript, TanStack Start, React Query, and Tailwind CSS.

## Development

```sh
bun install
bun run dev
```

Use the environment configuration supplied by the hosting integration. Never
commit private credentials or replace database data with browser storage.

## Quality checks

```sh
bun run lint
bun run test
bun run build
```

Lint rejects warnings and unused variables. Generated route and integration
files are excluded from lint/formatting because their generators own them;
they remain part of the application compilation.

## Structure

- `src/routes`: existing public and authenticated file-based routes.
- `src/components/ui`: UI primitives used by the application.
- `src/components/library`: shared headings, date fields, and faculty options.
- `src/hooks`: shared faculty queries and date-filter state.
- `src/services`: database reads/writes and authentication operations.
- `src/types`: application types derived from generated database types.
- `src/lib`: pure date/book utilities, CSV export, metadata, and error reporting.
- `src/integrations`: generated database integration; do not edit manually.
- `tests`: regression tests for date handling, book grouping, CSV escaping,
  and page metadata.

`src/lib/library-data.ts` preserves the previous import interface. New code
can import services, types, and utilities directly from their own modules.

## Behavior and data safety

- Public visitors use a single-student lookup, never a bulk student query.
- Anonymous visit inserts do not request a returned row because read access
  is restricted by database policies.
- Existing query keys, sorting, filtering, Cairo timestamps, record limits,
  historical manual-book records, and soft-delete behavior are preserved.
- Authentication guards still verify the current user; failed authentication
  navigates to login with a document reload to avoid hydration conflicts.
- Database policies and schema were not changed by this refactor.

## Verification scope

The refactor passed lint, 16 regression tests, automated preview builds,
and browser checks for public/admin pages, guest protection, form validation,
book/student dialogs, date filters, CSV and QR downloads, and mobile overflow.
No console errors or React warnings appeared in the final browser run.

Write operations against live records were not exercised: creating a visit,
saving edits, and activation/deactivation require a dedicated test dataset.
Do not test those flows by changing production records.
