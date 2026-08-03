# Support tickets

A developer hits a broken build, a stuck realm migration, or just has a question — the game runtime API and
the console cover the product, but someone still has to answer "why did my build fail". Support tickets are
that channel: any account can open one, staff work a shared queue, and both sides reply in a thread until the
ticket is closed.

- API: `api/src/contracts/tickets.ts`, `services/TicketService.ts`, `routers/ticketRouter.ts`,
  `repositories/tickets/TicketRepository.ts` and `TicketMessageRepository.ts`.
- Web: *Profile → Support tickets* (`web/src/modules/TicketList.tsx`, `modals/CreateTicketModal.tsx`) for a
  developer's own tickets, and the staff-only queue at `/platform/tickets`
  (`web/src/modules/TicketQueue.tsx`, `pages/TicketQueuePage.tsx`), with the shared thread view at
  `/tickets/:id` (`modules/TicketThread.tsx`, `pages/TicketDetailPage.tsx`).
- Permissions: `ticket.create` (open a ticket — granted to every paid role), `ticket.queue.read` (see and
  reply to every ticket as staff, including internal notes), `ticket.queue.write` (change status, assign).
- Feature flag: `tickets` (`FEATURE_FLAGS`) — the whole slice, API included, 404s as `feature_disabled` while
  off. Seeded on by default.
- Quota: `tickets` in `LIMITABLE_RESOURCES`, counted by `AccessPolicyRepository`'s
  `count-tickets.sql` — the number of a developer's own tickets currently in an *open* state (`open`,
  `in_progress`, `waiting_on_user`); resolving or closing a ticket frees the slot back up.

## Data model

Two tables, both soft-deleted, in `migrations/sql/00001_schema.sql`:

- `tickets` — `owner_id` (the developer, `ON DELETE CASCADE`), `assignee_id` (the staff member currently on
  it, nullable, `ON DELETE SET NULL`), `subject`, `status`, `last_message_at` (bumped by every reply, drives
  queue ordering). `status` is one of `open → in_progress → waiting_on_user → resolved → closed`
  (`TICKET_STATUSES`/`TICKET_STATUS_LABELS` in `contracts/tickets.ts`); `TICKET_OPEN_STATUSES` marks the
  first three as still counting against the quota and still repliable (`isTicketOpen`).
- `ticket_messages` — `ticket_id` (`ON DELETE CASCADE`), `author_id` (nullable, `ON DELETE SET NULL` — the
  message text survives an account deletion even though the byline does not), `body`, `internal`. An
  `internal` message is a staff-only note in the same thread; `TicketService.thread` filters those out for
  anyone who is not a moderator.

Deleting a ticket (`DELETE_TICKET` in `sql/delete-ticket.sql`) soft-deletes its messages in the same
data-modifying CTE, matching this repo's delete convention — nothing here is hard-deleted.

## Reading and replying

`TicketService.thread(id, includeInternal)` returns a `TicketThread` (`{ ticket, messages }`); whether
`includeInternal` is true is decided by the router's `canModerateTickets` (owner role or `ticket.queue.read`),
not passed by the client. `TicketService.reply` rejects a reply once the ticket is `resolved` or `closed`
(`ticket_closed`) — reopen it (a status change back to an open state) before the thread accepts new messages.
Every reply bumps `tickets.last_message_at` via `TicketRepository.touch`, which is what the queue and a
developer's own list both sort by.

Ownership is a router-level predicate, not a policy engine: `canViewTicket` is "you opened it, or you can
moderate the queue" — a 404 either way if neither holds, so a ticket's existence is not leaked to an
unrelated account. Deleting one additionally requires `ticket.queue.write` unless you are the owner.

## The queue

`GET /api/tickets/queue` (behind `ticket.queue.read`) takes `status`, `assigneeId`, `q` (subject search) and
offset/limit filters (`TicketFilters`) and returns a `TicketQueueResult` — the page of matching tickets, its
`total` for pagination, and a `counts` breakdown by status across the *whole* queue (unaffected by the current
filter) so the queue header can always show how many are open in each state.
`TicketRepository.listQueue`/`countQueue`/`countByStatus` back this with three SQL files under
`repositories/tickets/sql/`. Claiming a ticket is just `PATCH /api/tickets/:id` with
`{ assigneeId: <your id> }` — there is no separate claim endpoint or locking; two staff members can assign
the same ticket to themselves back to back, the last write wins.

## Notifications

Two notification kinds ride the existing bell/push pipeline (`contracts/notifications.ts`,
`docs/notifications-and-moderation.md`): `ticket_reply` (sent to the ticket owner when staff reply, or to the
assignee when the owner replies — never back to whoever just posted) and `ticket_status` (sent to the owner
whenever staff change the ticket's status). Both are fire-and-forget through `notify()` from
`ticketRouter.ts` — a delivery failure never fails the request that triggered it.

## Rate limit

`POST /api/tickets` is capped at 10 creates per hour per account (`rateLimit({ name: 'ticket_create', max: 10,
windowSeconds: 3600 })`, keyed by user id) on top of the `tickets` quota — the quota caps how many can be
open at once, the rate limit caps how fast new ones can be filed regardless of how many are already closed.
