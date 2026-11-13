# Implementation Plan: Session Type Capacity and Descriptions

## Goal

Add editable default capacity and descriptions to session types, inherit both values when creating scheduled sessions, and expose the information clearly in the admin UI without changing existing booking, authorization, or RLS behavior.

## Scope

- Add or verify a capacity column on `public.session_types`.
- Add an editable description field to session type create/edit flows.
- Keep new session type capacity empty until an administrator enters it.
- Display session type description and capacity in the Session Types table.
- Remove the old truncated description subtitle under the session type title.
- Prefill a new session's capacity and description from the selected session type.
- Keep session capacity and description editable after prefilling.
- Display session description immediately after the session name in the active Sessions table.

## Database checklist

- [ ] Inspect the live `public.session_types` schema before making changes.
- [ ] Inspect the live `public.sessions` schema and existing nullability/defaults.
- [ ] Add `session_types.capacity` only if the column is missing.
- [ ] Add or verify the session type description column used by the application.
- [ ] Choose compatible integer/nullability/default rules without invalidating existing rows.
- [ ] Preserve existing foreign keys, indexes, RLS policies, and admin authorization.
- [ ] Apply schema changes through the approved Supabase MCP workflow.
- [ ] Re-query the schema after migration and verify the resulting columns.
- [ ] Run Supabase security advisors and resolve relevant findings.

## Frontend checklist

### Session type create/edit modal

- [ ] Add a numeric capacity input with minimum value `1`.
- [ ] Render capacity empty for a new session type.
- [ ] Load saved capacity when editing a session type.
- [ ] Add a description textarea to create and edit flows.
- [ ] Load and save the existing description value when editing.
- [ ] Validate capacity and show an accessible validation error before saving.
- [ ] Keep existing category, slug, duration, active state, and modal actions working.

### Session Types table

- [ ] Render columns in this order: Title, Description, Capacity, Actions.
- [ ] Show the full description in its own column, with safe responsive truncation only if needed.
- [ ] Remove description text rendered beneath the title.
- [ ] Keep the view icon visible on every row.
- [ ] Preserve row-click and keyboard-open behavior.
- [ ] Keep view modal actions available.

### New/edit session modal

- [ ] When a session type is selected, prefill capacity from its default capacity.
- [ ] When a session type is selected, prefill description from its description.
- [ ] Keep capacity and description editable on the concrete session.
- [ ] Avoid overwriting manually edited values during unrelated form changes.
- [ ] Preserve duration, date, time, coach, recurrence, validation, and existing actions.

### Active Sessions table

- [ ] Add Description immediately after Session name.
- [ ] Show an empty-state value safely when description is null or blank.
- [ ] Preserve search, sorting, row-click view behavior, and the always-visible view icon.
- [ ] Keep the table usable on narrow screens without horizontal content escaping.

## Compatibility checklist

- [ ] Existing sessions continue to load when optional description values are null.
- [ ] Existing bookings continue to use the concrete session capacity.
- [ ] Changing a session type default does not mutate existing sessions or bookings.
- [ ] No existing Auth, roles, RLS, profiles, dashboard, or public booking behavior changes.
- [ ] All writes remain parameterized through the existing Supabase client patterns.
- [ ] No localStorage or client-only persistence is introduced.

## Verification checklist

- [ ] Create a session type with no capacity and verify the empty/default UI state.
- [ ] Create a session type with capacity and description.
- [ ] Edit the session type and verify both fields load and save.
- [ ] Confirm Session Types columns are Title, Description, Capacity, Actions.
- [ ] Confirm every session type row always shows the view icon.
- [ ] Create a session, select a session type, and verify capacity and description are prefilled.
- [ ] Edit the inherited capacity and description and verify custom values persist.
- [ ] Confirm the active Sessions table shows Description after Session name.
- [ ] Confirm existing sessions and bookings remain unchanged.
- [ ] Run TypeScript checks.
- [ ] Run `git diff --check`.
- [ ] Run browser smoke tests for create, edit, search, row view, and modal actions.
- [ ] Review Supabase security advisor results.
- [ ] Update issue #33 acceptance criteria and close it only after all checks pass.

## Expected files

- `components/admin/session-manager.tsx`
- Supabase migration/schema file only if a required column is missing
- Existing test or validation files only if the project already uses them for this flow

## Out of scope

- Changing booking capacity enforcement rules.
- Recalculating capacity for existing sessions.
- Adding roles or changing RLS authorization.
- Changing public scheduling behavior outside the admin flow.
- Payments, waitlists, notifications, or unrelated session management.

## Acceptance criteria

- Session types support editable default capacity and description.
- New session type capacity starts empty until entered.
- Session Types displays Title, Description, Capacity, and Actions in that order.
- Selecting a session type prefills capacity and description on a new session.
- Session capacity and description remain editable after prefilling.
- Active Sessions displays Description immediately after Session name.
- Existing sessions, bookings, Auth, and RLS behavior remain intact.
- TypeScript, diff validation, browser smoke tests, and Supabase advisor checks pass.

## Delivery

- Branch: `feat/session-type-capacity-descriptions`
- Related issue: `#33`
- Keep implementation commits focused.
- Update the checklist as each phase is completed.
- Close issue #33 only after verification is complete.
