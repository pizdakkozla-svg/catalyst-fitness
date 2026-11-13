# Implementation Plan: Client Dashboard and Offline Payment History

## Goal

Build a client-facing dashboard and a separate admin experience for Catalyst Fitness. Clients can discover and manage sessions, while administrators retain complete visibility into client bookings. Payments remain offline and are represented only as historical in-person payments for attended sessions.

## Scope

- Keep `/dashboard` exclusively client-facing.
- Keep `/admin` and its child routes exclusively admin-facing.
- Preserve role-based access and avoid sharing admin data with clients.
- Allow clients to browse upcoming sessions, create bookings, and cancel eligible bookings.
- Show the client’s bookings, statuses, session details, capacity, trainer, and locked booking price.
- Show client stats based on attended bookings and `price_at_booking`.
- Add in-app notifications for clients and administrators.
- Support dismissing individual notifications and closing the notification panel.
- Do not add Stripe, online payment processing, credits, or memberships.

## Client dashboard checklist

- [ ] Keep branded welcome header and responsive mobile-first layout.
- [ ] Show upcoming sessions with title, date, time, trainer, duration, capacity, and price.
- [ ] Show a clear empty state when no upcoming sessions are available.
- [ ] Add booking action for available sessions.
- [ ] Prevent duplicate bookings for the same client and session.
- [ ] Prevent booking sessions at capacity.
- [ ] Show booking success and error feedback.
- [ ] Show “My bookings” with session details and booking status.
- [ ] Allow cancellation only for eligible future bookings.
- [ ] Preserve `price_at_booking` as the historical price for each booking.
- [ ] Add quick actions for booking, bookings, and profile.
- [ ] Show profile summary and link to profile editing.

## Client stats checklist

- [ ] Count bookings with status `attended` as completed sessions.
- [ ] Sum `price_at_booking` only for bookings with status `attended`.
- [ ] Label the total as in-person/offline payment history.
- [ ] Do not describe offline payments as credits, balance, membership, or online payments.
- [ ] Show upcoming booking count separately from attended sessions.
- [ ] Handle null prices safely without breaking the dashboard.
- [ ] Keep stats scoped to the authenticated client.

## Admin dashboard checklist

- [ ] Preserve the existing admin dashboard layout and navigation.
- [ ] Keep admin routes protected from non-admin users.
- [ ] Show the complete booking list to administrators.
- [ ] Include client name, email, session, date, time, status, and price.
- [ ] Allow administrators to manage booking status using existing admin flows.
- [ ] Keep admin session and session-type management independent from client UI.
- [ ] If admin-created bookings are supported, preserve duplicate and capacity protection.
- [ ] Do not expose all-client booking data on `/dashboard`.

## Notifications checklist

- [ ] Notify the client when their booking is created.
- [ ] Notify the client when their booking status changes.
- [ ] Notify the client when a booked session changes or is cancelled.
- [ ] Notify administrators about new booking activity.
- [ ] Notify administrators about booking status changes.
- [ ] Scope notification reads and updates to the recipient.
- [ ] Show unread count in the notification bell.
- [ ] Support “Mark all as read”.
- [ ] Support dismissing an individual notification with an `X` button.
- [ ] Support closing the notification panel without changing notification state.
- [ ] Preserve realtime updates where already implemented.

## Data and security checklist

- [ ] Use the existing Supabase integration and client patterns.
- [ ] Keep `price_at_booking` as a booking snapshot; changing a session type price must not alter old bookings.
- [ ] Use authenticated-user scoping for all client booking and notification queries.
- [ ] Preserve RLS policies for bookings, profiles, sessions, and notifications.
- [ ] Enforce duplicate and capacity checks in database-safe paths as well as UI paths.
- [ ] Avoid Stripe, membership tables, localStorage, and mock authentication.
- [ ] Avoid exposing service-role credentials to browser code.

## Expected files

- `app/dashboard/page.tsx`
- `components/dashboard/dashboard-shell.tsx`
- `components/notifications/notification-bell.tsx`
- `components/admin/admin-dashboard.tsx`
- `components/admin/admin-operations.tsx`
- `components/admin/session-manager.tsx`
- Existing Supabase schema/functions only when a data-layer change is required

## Out of scope

- Stripe checkout or payment intents.
- Online payment processing.
- Credits, packages, subscriptions, or memberships.
- Automatic payment reconciliation.
- Client access to other clients’ bookings.
- Replacing the existing admin information architecture.

## Verification checklist

- [ ] Test `/dashboard` as a client with upcoming sessions.
- [ ] Test empty sessions state.
- [ ] Test successful booking.
- [ ] Test duplicate booking rejection.
- [ ] Test full-session rejection.
- [ ] Test booking cancellation.
- [ ] Test attended stats and offline payment total.
- [ ] Test null `price_at_booking` values.
- [ ] Test `/admin` as an administrator.
- [ ] Confirm admin booking rows include complete client and session information.
- [ ] Confirm a client cannot access admin routes or other clients’ data.
- [ ] Test booking and status notifications for client and admin recipients.
- [ ] Test notification dismiss, mark-all-read, and panel-close actions.
- [ ] Run TypeScript checks.
- [ ] Run `git diff --check`.
- [ ] Run browser smoke tests for both dashboard surfaces.

## Acceptance criteria

- `/dashboard` is client-only and supports session discovery, booking management, profile access, notifications, and offline payment history.
- `/admin` remains separate and shows administrators complete client booking information.
- Attended bookings are the only source for displayed offline payment totals.
- No Stripe, credits, or memberships are introduced.
- Notification actions are scoped safely to each recipient.
- Existing authentication, RLS, booking price snapshots, and admin workflows remain intact.
- TypeScript, diff checks, and browser smoke tests pass.

## Delivery

- Keep client and admin changes in separate focused commits when possible.
- Use a feature branch for implementation.
- Do not merge or push directly to the default branch without explicit approval.
- Update this checklist as implementation phases are completed.
