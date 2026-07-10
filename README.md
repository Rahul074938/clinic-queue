# ClinicQueue

> Digital patient scheduling, contactless self check-in, and real-time wait-time dashboards for modern healthcare centres.

---

## ✨ Features

### For Patients
- **Self-booking** — multi-step wizard: doctor → date/time → patient info → confirmation with token
- **Digital check-in** — token-based self-service from phone or clinic tablet
- **Live queue tracker** — SSE-powered real-time queue position + estimated wait time with audio alert on call
- **Kiosk mode** — full-screen tablet check-in with 15-second auto-reset

### For Staff / Admin
- **Live Queue Dashboard** — call next, mark complete / no-show / cancel per entry
- **Appointments table** — search, filter by status/doctor/date, sortable columns, bulk soft-delete, CSV export
- **Doctors directory** — add / activate / deactivate physicians with room assignments
- **Analytics** — 7-day patient volume chart, wait-time trend, per-physician workload table
- **Lobby TV board** — public display with privacy-masked names, "Now Calling" overlay, chime alert

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 — strict mode |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Auth | Auth.js v5 — credentials + Google OAuth, JWT sessions |
| State | TanStack Query v5 |
| Real-time | Server-Sent Events (`/api/queue/stream`) |
| Styling | Vanilla CSS + Tailwind v4 utility classes |
| Charts | Recharts |
| Validation | Zod |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

### 1. Clone & install

```bash
git clone https://github.com/your-org/clinic-queue.git
cd clinic-queue
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — at minimum set:

```env
AUTH_SECRET="<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">"
DATABASE_URL="file:./prisma/dev.db"   # or your PostgreSQL connection string
```

### 3. Set up the database

```bash
# Apply migrations
node node_modules/prisma/build/index.js migrate dev

# Seed with demo data & credentials
node --import tsx/esm prisma/seed.ts
```

### 4. Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `demo@demo.com` | `demo1234` |
| Admin | `admin@clinicqueue.com` | `admin1234` |
| Staff | `staff@clinicqueue.com` | `staff1234` |

---

## 📁 Project Structure

```
clinic-queue/
├── app/
│   ├── (patient)/          # Public-facing patient routes
│   │   ├── book/           # Appointment booking wizard
│   │   ├── checkin/        # Self check-in with token
│   │   ├── queue/[token]/  # Live queue tracker (SSE)
│   │   └── kiosk/          # Tablet kiosk mode
│   ├── admin/              # Staff dashboard (auth-gated)
│   │   ├── page.tsx        # Live queue management
│   │   ├── appointments/   # Appointment CRUD table
│   │   ├── doctors/        # Doctors directory
│   │   └── analytics/      # Charts & metrics
│   ├── auth/               # Login / signup / reset
│   ├── dashboard/          # Public lobby TV board
│   └── api/                # API routes
├── lib/
│   ├── auth.ts             # Auth.js config
│   ├── prisma.ts           # Prisma client singleton
│   ├── api.ts              # requireAuth, rateLimit helpers
│   └── validations/        # Zod schemas
├── prisma/
│   ├── schema.prisma       # Data model
│   └── seed.ts             # Demo seed data
├── proxy.ts                # RBAC proxy (Next.js 16 middleware)
└── types/
    └── next-auth.d.ts      # Session type augmentation
```

---

## 🌐 Key Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/book` | Patient booking wizard |
| `/checkin` | Token check-in |
| `/queue/:token` | Live queue tracker |
| `/kiosk` | Clinic tablet kiosk |
| `/dashboard` | Lobby TV board |
| `/admin` | Staff queue dashboard |
| `/admin/appointments` | Appointments management |
| `/admin/doctors` | Doctors directory (admin only) |
| `/admin/analytics` | Analytics charts |
| `/auth/login` | Staff sign-in |

---

## 🔒 Security

- **RBAC** enforced by `proxy.ts` — unauthenticated users are redirected to login; STAFF/ADMIN roles are verified server-side on every API route
- **bcrypt** cost-12 for all passwords
- **Rate limiting** on auth and appointment-creation endpoints (in-memory; swap `Upstash Redis` for production)
- **Soft deletes** — `deletedAt` on `User` and `Appointment` to preserve audit trails
- **Audit log** — every status change and delete is recorded to `AuditLog` with before/after JSON

---

## 📋 Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Vitest unit tests
```

---

## 📄 License

[MIT](LICENSE) — see `LICENSE` for details.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, commit conventions, and PR guidelines.
