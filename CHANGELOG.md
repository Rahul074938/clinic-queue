# Changelog

All notable changes to ClinicQueue are documented here.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.0] - 2026-07-10

### Added

#### Patient-Facing Features
- **Appointment Booking** — multi-step wizard: doctor selection → date/time picker → patient info → confirmation with check-in token
- **Digital Check-In** — token-based self-service check-in from phone or clinic tablet
- **Live Queue Tracker** — real-time queue position, estimated wait time, and "called" notification via SSE
- **Kiosk Mode** — fullscreen tablet check-in with auto-reset after 15 s idle
- **Public TV Dashboard** — lobby display showing waitlist and currently-serving columns with patient-name privacy masking

#### Staff / Admin Features
- **Live Queue Dashboard** — real-time management panel; call next patient, mark complete/no-show/cancel per entry
- **Appointments CRUD** — paginated table with search, sort, multi-filter (status, doctor, date), bulk soft-delete, CSV export
- **Doctors Directory** — add/edit/deactivate physicians with color-coded avatars and room assignments
- **Analytics Dashboard** — 7-day patient volume area chart, average wait-time bar chart, per-physician workload table

#### System & Infrastructure
- **Auth.js v5 (NextAuth)** — email+password credentials with bcrypt cost 12, Google OAuth, JWT sessions
- **RBAC middleware (proxy)** — `ADMIN` and `STAFF` roles enforced server-side; unauthenticated users redirected to login
- **Real-time SSE** — `GET /api/queue/stream` pushes queue updates every 2 s; clients auto-reconnect on error
- **Rate limiting** — in-memory token bucket (5 req / 15 min) on auth endpoints; swap for Upstash Redis in production
- **Prisma ORM + SQLite** — full schema with `User`, `Doctor`, `Appointment`, `AuditLog`, `PasswordResetToken`, Auth.js adapter tables; indexes on hot columns
- **Audit logging** — every status change and delete records actor, entity, before/after JSON to `AuditLog`
- **Soft deletes** — `deletedAt` field on `User` and `Appointment`; all queries exclude soft-deleted rows
- **Zod validation** — shared schemas on every API route boundary
- **SEO** — per-route `metadata`, OG tags, `sitemap.ts`, `robots.ts`, `viewport` theme color
- **Vitest unit tests** — utility function coverage in `lib/utils.test.ts`

---

[1.0.0]: https://github.com/your-org/clinic-queue/releases/tag/v1.0.0
