# AcademiaHub Africa — Complete Project Description

> A teaching-oriented walkthrough of the entire codebase: what it is, how it is
> structured, how every feature works, and how all the pieces talk to each other.

---

## Table of Contents

1. [What Is AcademiaHub?](#1-what-is-academiahub)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Repository Layout](#4-repository-layout)
5. [The Database (Prisma Schema)](#5-the-database-prisma-schema)
6. [The Backend (Express + Socket.IO)](#6-the-backend-express--socketio)
7. [The Frontend (Next.js App Router)](#7-the-frontend-nextjs-app-router)
8. [Feature Walkthroughs](#8-feature-walkthroughs)
9. [The Real-Time Pipeline](#9-the-real-time-pipeline)
10. [Security Model Summary](#10-security-model-summary)
11. [Environment Variables](#11-environment-variables)
12. [Running & Developing the Project](#12-running--developing-the-project)
13. [Known Quirks & Observations](#13-known-quirks--observations)

---

## 1. What Is AcademiaHub?

**AcademiaHub Africa** is an academic platform that connects students,
lecturers, and researchers across African universities. It combines:

- **A knowledge marketplace** — users upload academic documents (research
  papers, seminar papers, final-year projects, analyses) as PDFs and others can
  discover, preview, download, like, save, comment on, rate, and report them.
- **An academic social network** — user profiles with institution/department
  bios, stats, profile visits, and a follower of activity via notifications.
- **Real-time messaging (DMs)** — 1-on-1 chat between users with presence
  (online/offline), typing indicators, and read receipts.
- **A notification system** — in-app notifications for likes, comments, and
  messages, delivered both by polling and instantly over WebSockets.
- **Analytics** — per-user dashboards showing uploads, downloads, saves, and
  profile visits with month-over-month percentage changes and time-series
  charts.

Mission (from README): *empower students and academics to learn, earn, and grow
while bridging the gap between universities and industry.*

---

## 2. High-Level Architecture

The project is an **npm-workspaces monorepo** with two services that run side
by side:

```
┌────────────────────────────┐          ┌───────────────────────────────┐
│   FRONTEND (Next.js 16)    │          │  BACKEND (Express 5 + WS)     │
│   http://localhost:3000    │          │  http://localhost:4000        │
│                            │          │                               │
│  • React UI (App Router)   │  Bearer  │  • REST API (/api/*)          │
│  • Next.js API routes      │──JWE────▶│    /api/conversations         │
│    (the "BFF" layer)       │  token   │    /api/users/search          │
│  • Own Prisma access       │          │  • Socket.IO server at /ws    │
│    (SQLite via Prisma)     │◀──socket─│  • Presence + realtime msgs   │
│  • Email via Resend        │          │  • /internal/notify bridge    │
│  • Cloudinary signed       │          │                               │
│    uploads                 │          │                               │
└────────────┬───────────────┘          └──────────────┬────────────────┘
             │                                         │
             └──────────────► SQLite (dev.db) ◄────────┘
                    shared DATABASE_URL, one schema
```

Key architectural ideas to teach:

1. **Two servers, one database.** The Next.js app talks to Prisma directly for
   most features (documents, profiles, notifications). The Express backend
   exists specifically for **real-time direct messaging** (and pushes
   notifications to sockets).
2. **Shared authentication.** NextAuth v4 issues an **encrypted JWT (JWE)**
   session cookie. The Express backend decrypts that *same* token using the
   shared `NEXTAUTH_SECRET` — so one login secures both services.
3. **Server-to-server bridge.** When the Next.js API creates a notification in
   the DB (e.g., "someone liked your paper"), it calls the backend's
   `POST /internal/notify` endpoint (authenticated with a shared
   `INTERNAL_API_SECRET`), which forwards it over Socket.IO so online users get
   it instantly.
4. **File storage is external.** PDFs and avatars live in **Cloudinary**;
   uploads are done browser → Cloudinary directly using short-lived signatures
   produced by a Next.js route.

---

## 3. Tech Stack

### Backend (`backend/`)
| Concern | Choice |
|---|---|
| Runtime/framework | Node.js + **Express 5** (CommonJS), run in dev with `tsx` |
| Realtime | **Socket.IO 4** mounted at path `/ws` |
| Auth | Decrypts **NextAuth v4 JWE tokens** using `jose` (`jwtDecrypt`) + HKDF key derivation |
| Database | **Prisma 6** client (generated into `backend/src/generated/prisma`) over SQLite |
| Security | `helmet`, `cors` (allow-listed origins), `express-rate-limit`, payload cap `10kb` |
| Config | `dotenv` |

### Frontend (`frontend/`)
| Concern | Choice |
|---|---|
| Framework | **Next.js 16** (App Router), React 19, TypeScript |
| Styling/UI | **Tailwind CSS v4**, shadcn/ui-style components in `components/ui` (Radix primitives), lucide-react icons, Geist + IBM Plex Sans fonts |
| Data fetching | **TanStack React Query v5** (queries, infinite queries, mutations, optimistic updates) |
| Forms | **react-hook-form + zod** (`@hookform/resolvers`) |
| Auth | **NextAuth v4** — Credentials (email/password with **argon2**) + Google OAuth |
| Realtime client | **socket.io-client** wrapped in a custom store + contexts |
| Email | **Resend** + **React Email** templates (`frontend/emails/`) |
| Files | **Cloudinary** (server-side signing + browser XHR upload with progress) |
| Charts | **recharts** (analytics page) |
| Misc | react-hot-toast (toasts), country-state-city (onboarding dropdowns), LogRocket + Vercel Analytics + Google Analytics (observability), @upstash/ratelimit (installed, available for edge rate limiting) |

### Database
- **SQLite** at `prisma/prisma/dev.db` (root `.env` holds `DATABASE_URL`).
- One schema at **`prisma/schema.prisma`** with **two generators**: the default
  client (used by the frontend's `@prisma/client`) and a second one output to
  `backend/src/generated/prisma` (used by the backend).

---

## 4. Repository Layout

```
Academiahub/
├── package.json              # npm workspaces root ("frontend", "backend")
├── start.cmd                 # Windows helper: opens two terminals, runs both dev servers
├── README.md                 # One-paragraph mission statement
├── CONTRIBUTING.md           # Workspace rules, commit/PR conventions, Prisma workflow
├── .env                      # Root: DATABASE_URL (shared SQLite file)
├── prisma/
│   ├── schema.prisma         # THE single source of truth for the DB
│   └── prisma/dev.db         # SQLite database file
│
├── backend/
│   ├── .env                  # PORT, FRONTEND_URL, DATABASE_URL, NEXTAUTH_SECRET,
│   │                         # INTERNAL_API_SECRET, NODE_ENV
│   └── src/
│       ├── server.ts         # Express app + HTTP server + Socket.IO bootstrap
│       ├── types/index.ts    # Express Request augmentation + socket payload types
│       ├── lib/prisma.ts     # PrismaClient singleton (global-cached for dev)
│       ├── middleware/
│       │   ├── verifySession.ts       # Bearer JWE verification (NextAuth-compatible)
│       │   ├── requireParticipant.ts  # 403 unless user belongs to conversation
│       │   ├── rateLimit.ts           # Per-user limiters (search, create convo)
│       │   └── errorHandler.ts        # Global JSON error handler
│       ├── routes/
│       │   ├── conversations.ts       # Create/list DM conversations, read receipts
│       │   ├── messages.ts            # Paginated message history
│       │   ├── users.ts               # GET /users/search?q=
│       │   └── internal.ts            # POST /internal/notify (Next.js → socket push)
│       ├── ws/
│       │   ├── handler.ts             # Socket.IO server, auth handshake, event wiring
│       │   ├── connections.ts         # In-memory socket registry + presence helpers
│       │   └── events.ts              # message:send / read:mark / typing handlers
│       └── generated/prisma/          # Generated Prisma client (backend copy)
│
└── frontend/
    ├── .env.local            # NEXT_PUBLIC_BACKEND_URL, BACKEND_URL, NEXTAUTH_URL,
    │                         # NEXTAUTH_SECRET, INTERNAL_API_SECRET (+ Cloudinary,
    │                         # Resend, Google keys used in deployment)
    ├── prisma/connection.ts  # PrismaClient singleton for Next.js
    ├── emails/               # React Email templates (verification, password reset)
    ├── lib/                  # Framework-free helpers (see §7.6)
    ├── components/           # All UI components, grouped by page/feature
    ├── utils/providers/      # NextAuthProvider (SessionContextProvider wrapper)
    └── app/
        ├── layout.tsx        # Root layout: fonts, providers, SEO JSON-LD, analytics
        ├── AppProvider.tsx   # Nests: NextAuth → Query → Socket → Presence providers
        ├── globals.css       # Tailwind v4 styles/theme
        ├── robots.ts, sitemap.ts, metadataExports   # SEO
        ├── _contexts/        # QueryProvider, SocketContext, PresenceContext
        ├── _components/      # App-level server components (LogRocketInit)
        ├── _types/           # Shared TS types (author, documents, messaging)
        ├── data/             # Static content (FAQs, landing copy, sidebar links…)
        ├── api/              # ★ Next.js Route Handlers = the app's main REST API
        ├── (public)/         # Marketing site: landing, explore, about, FAQs, policies
        ├── login|signup|verification|user-registration|reset-*   # Auth pages
        ├── (onboarding)/onboarding/   # Post-login profile-completion wizard
        └── (user)/           # ★ The authenticated app (sidebar shell):
            ├── dashboard/    # Document feed w/ search, filters, sort, pagination
            ├── publication/[id]/  # Detail page + comments/reviews/report modal
            ├── uploads/      # Publish a new PDF
            ├── saved/        # Bookmarked publications
            ├── downloads/    # Download history
            ├── analytics/    # Stats + charts + recent activity
            ├── inbox/        # Real-time DMs
            ├── notifications/# Notification feed
            ├── profile/      # Own profile, edit, other users' profiles
            ├── settings/     # Profile info, password, privacy toggles
            └── support/      # Help center articles + contact links
```

---

## 5. The Database (Prisma Schema)

Schema lives at `prisma/schema.prisma`. Provider: `sqlite`. All IDs are CUID
strings; every relation cascades on delete.

### Enums
- **Category** (document type): `RESEARCH | SEMINAR | PROJECT | ANALYSIS`
- **NotificationType**: `COMMENT | LIKE | MESSAGE`
- **ReportReason**: `PLAGIARISM | MISLEADING | COPYRIGHT | INAPPROPRIATE | SPAM | OTHER`
- **ReportStatus**: `PENDING | REVIEWED | DISMISSED`

### Models (what each one is for)

| Model | Purpose & notable fields |
|---|---|
| **User** | Core account. `email` unique, `password` nullable (**null ⇒ OAuth-only account**), `image` avatar URL. Email-verification fields: `verificationCode`, `codeExpiry`, `lastCodeRequestAt` (rate-limit resend). Password-reset fields: `passwordResetTokenHash` (SHA-256 of emailed token), `passwordResetExpiry`, `lastPasswordResetRequestAt`. Privacy flags: `allowMessages` (default true), `showInSearch` (default true). Holds reverse relations to everything below. |
| **Profile** | Extended bio attached to a User (institution, department, aboutMe, state, country). Used by onboarding to decide "profile complete". A user may technically have several Profile rows (`User.Profile` is a list); all reads use `take: 1`. |
| **ProfileVisit** | Row per visit to someone's profile (`profileOwnerId`, optional `visitorId`). Indexed `[profileOwnerId, createdAt]`; deduplicated to 1 per visitor per 30 min in code. Feeds the analytics "profile visits" stat. |
| **Document** | An uploaded publication: title, description, category (enum), institution, year, `fileUrl`/`fileKey`/`fileName`/`fileSize` (Cloudinary), denormalized counters `downloads` and `likes`, plus relation arrays for likes/comments/saves/downloads/reviews/reports. |
| **Like** | Join row user↔document, `@@unique([userId, documentId])` prevents double-likes. |
| **Comment** | Text comment on a document (max 2000 chars enforced in API). Editable by author within 72 h. |
| **Save** | Bookmark join row, also unique per user+document. |
| **Review** | Star rating 1–5 per user per document (unique per pair); cannot review your own document. Aggregated in code (average + distribution). |
| **Report** | Policy violation report: array of reasons stored in `reason`, optional description, status defaults `PENDING`, unique per reporter+document. |
| **DownloadRecord** | One row per download event (who downloaded what, when). Powers the analytics chart and the "Downloads" history page; also increments `Document.downloads`. |
| **Conversation** | A 1-on-1 DM thread: exactly two participants via two relations (`participantA`, `participantB`). `@@unique([participantAId, participantBId])` plus **ID-order normalization** in code guarantees only one thread per pair regardless of who started it. |
| **Message** | Chat message inside a conversation (`senderId`, `content`, timestamp). Indexed `[conversationId, createdAt]` for fast history paging. |
| **ReadReceipt** | Per-conversation pointer of how far a user has read: `lastReadMessageId`, unique per `(conversationId, userId)`. Drives unread badges and "seen" state. |

**Teaching tip:** notice the pattern — *counters are denormalized* on Document
(`likes`, `downloads`) for cheap sorting/display, while *join tables* (Like,
Save, DownloadRecord…) hold the truth and keep the counters in sync inside
transactions.

---

## 6. The Backend (Express + Socket.IO)

Entry point: `backend/src/server.ts` → `npm run dev` runs `tsx src/server.ts`
on port **4000** (configurable via `PORT`).

### 6.1 Bootstrap (`server.ts`)
1. Loads dotenv.
2. Creates the Express app with:
   - `helmet()` — secure HTTP headers.
   - `cors` — allows only origins listed in `FRONTEND_URL` (comma-separated),
     with credentials.
   - `express.json({ limit: "10kb" })` — tiny body cap; this API only receives
     small JSON payloads.
3. Mounts routes:
   - `/api/conversations` → conversation routes **and** message routes (both
     routers share the prefix; messages define `/:id/messages`).
   - `/api/users` → user search.
   - `/internal` → the notification push bridge.
   - `GET /api/health` → `{ status: "ok" }`.
4. Global `errorHandler`.
5. Wraps Express in `http.createServer`, then calls `createSocketServer(server)`
   so REST and WebSockets share port 4000.

### 6.2 Authentication middleware (`middleware/verifySession.ts`)
This is the cleverest part of the backend — **it trusts NextAuth sessions
without running NextAuth**:

- NextAuth v4 stores the session as an **encrypted JWT (JWE)** cookie. The key
  is derived from `NEXTAUTH_SECRET` via **HKDF-SHA256** with the info string
  `"NextAuth.js Generated Encryption Key"` — exactly matching NextAuth's
  internal derivation.
- `verifySession` (Express middleware): reads `Authorization: Bearer <token>`,
  decrypts with `jose.jwtDecrypt` (15 s clock tolerance), extracts `payload.sub`
  (the user id) onto `req.userId`. Any failure ⇒ `401 Unauthorized`.
- `verifyToken(token)` — same logic as a plain function returning the userId or
  null; used by the Socket.IO handshake.
- TypeScript augmentation (`types/index.ts`) adds `req.userId` and
  `req.conversation` to every Express Request globally.

> Teaching point: because the frontend exposes `GET /api/auth/token` which
> returns the raw session cookie value, any frontend fetch can forward the
> encrypted token to the backend. The secret never leaves the servers.

### 6.3 Authorization middleware (`middleware/requireParticipant.ts`)
For any `/api/conversations/:id/...` route: loads the conversation, returns
404 if missing, **403 if the caller is neither participantA nor participantB**,
otherwise attaches the conversation to `req.conversation` for the handler.

### 6.4 Rate limiting (`middleware/rateLimit.ts`)
`express-rate-limit` keyed **per userId** (not IP):
- `searchLimiter`: 20 user-searches/minute.
- `conversationCreateLimiter`: 10 new conversations/hour.

### 6.5 Error handler (`middleware/errorHandler.ts`)
Logs the error; responds `500 { error: "Something went wrong" }` in production,
or includes message+stack in development.

### 6.6 REST routes

#### `routes/conversations.ts`
- **POST `/api/conversations`** `{ recipientId }` — find-or-create a DM thread.
  Validates recipient exists, blocks self-conversations, then **normalizes
  participant order** (smaller id always becomes participantA) so the DB unique
  constraint catches both directions. Uses Prisma `upsert` and returns the
  conversation with both participants' `{id, name, image}`.
- **GET `/api/conversations`** — list my threads, each transformed to:
  `{ id, otherParticipant, lastMessage, lastReadMessageId, createdAt }`.
  Sorted by last-message time (most recent first).
- **GET `/api/conversations/:id/receipts`** — read receipts for the thread
  (participant-only).

#### `routes/messages.ts`
- **GET `/api/conversations/:id/messages?cursor=&limit=`** — cursor-paginated
  history, newest first. Fetches `limit + 1` rows to compute `hasMore`;
  returns `{ messages, nextCursor }`. Default limit 50, max 100.

#### `routes/users.ts`
- **GET `/api/users/search?q=`** — minimum 3 chars, case-insensitive
  `startsWith` match on name, excludes self, max 10 results
  (`{id, name, email, image}`). Rate-limited (§6.4).

#### `routes/internal.ts`
- **POST `/internal/notify`** — authenticated by
  `Authorization: Bearer ${INTERNAL_API_SECRET}` (a shared secret between the
  two servers, never exposed to browsers). Body `{ userId, notification }` →
  emits `notification:new` to all of that user's sockets. This is how
  like/comment notifications created inside Next.js reach online users
  instantly.

### 6.7 WebSocket layer (`ws/`)

#### `connections.ts` — in-memory connection registry
- `userSockets: Map<userId, Set<Socket>>` — supports multiple tabs/devices,
  capped at **5 sockets per user** (`MAX_CONNECTIONS_PER_USER`).
- `socketUserMap: Map<socket.id, userId>` — O(1) lookup on disconnect.
- Helpers: `addSocket` (false when over the cap), `removeSocket`,
  `sendToUser` (emit to *all* of a user's sockets), `isUserOnline`,
  `getOtherParticipantId`.
- **Presence:** `broadcastPresence(userId, "online"|"offline")` looks up all my
  conversation partners and emits `presence` to each;
  `getOnlinePartners(userId)` answers `presence:request` with which partners
  are currently online.

#### `handler.ts` — Socket.IO setup
- CORS same allow-list as REST; served at path `/ws`.
- **Handshake auth middleware:** requires `socket.handshake.auth.token`,
  verifies it with `verifyToken`, stores `socket.data.userId`; rejects the
  connection otherwise.
- On connection: register socket (disconnect if over cap), broadcast
  `online`, then wire events:
  - `presence:request` → reply `presence:sync { onlineUserIds }`
  - `message:send` → `handleMessageSend`
  - `read:mark` → `handleReadMark`
  - `typing:start` / `typing:stop` → `handleTyping`
- On disconnect: unregister; if that was the user's last socket, broadcast
  `offline`.

#### `events.ts` — the chat engine
Constants: **30 messages/min/user**, **5000-char max**, **5 s read-receipt
debounce**.

- **`message:send`** (`{conversationId, content}`):
  1. Validate payload; strip HTML tags (`stripHtml`) and trim; enforce length.
  2. Sliding-window rate check (`messageRateMap`: userId → recent timestamps).
  3. Verify sender is a participant of the conversation.
  4. Persist Message (senderId always taken from the authenticated socket —
     clients can't spoof senders).
  5. ACK to sender: `message:ack { msgId }`.
  6. Emit `message:new` to **both** participants (so multi-tab stays in sync).
  7. Fire-and-forget: create a `MESSAGE` notification for the recipient
     ("X sent you a message", link `/inbox?c=<conversationId>`) and push it via
     `notification:new`.
- **`read:mark`** (`{conversationId, lastMsgId}`):
  Server-side debounce map (`conversationId:userId` → last upsert time) so we
  write receipts at most once per 5 s. Verifies membership AND that the message
  actually belongs to that conversation, upserts ReadReceipt, then tells the
  partner via `read:update` (drives their "seen" UI).
- **`typing`** (`typing:start`/`stop`): validates membership, relays
  `{conversationId, userId, isTyping}` to the partner. No persistence — pure
  ephemeral signaling.

---

## 7. The Frontend (Next.js App Router)

Runs on port **3000** by default locally (`next dev`; the `start.cmd` helper
prints 3001 but no `PORT` is set, so Next.js uses its default). Everything
under `app/` uses the App Router conventions: layouts, route groups `( )`,
dynamic segments `[ ]`, intercepting routes `(.)`, parallel routes `@modal`.

### 7.1 Providers (`app/AppProvider.tsx` + `_contexts/`)
Nesting order (outermost first):

1. **NextAuthProvider** (`utils/providers/`) — wraps NextAuth's
   `SessionContextProvider`.
2. **QueryProvider** — TanStack Query client with `staleTime: 30s`,
   `retry: 1`.
3. **SocketProvider** — owns the WebSocket lifecycle:
   - When session status becomes `authenticated` → `connect()`;
     `unauthenticated` → `disconnect()`.
   - State lives in `lib/messaging/socketManager.ts`, a tiny external store
     consumed via `useSyncExternalStore` (SSR-safe: fixed snapshot on server).
   - **Idle timeout:** after **5 minutes** without `mousemove/keydown/
     touchstart/scroll` the socket disconnects; any activity reconnects. This
     keeps presence honest and saves resources.
4. **PresenceProvider** — listens for `presence:sync` (initial list) and
   `presence` (single updates), maintains a `Set<string>` of online user ids,
   requests a sync on connect. Consumed via `usePresence()`.

Root layout additionally injects: Google fonts, three **JSON-LD** blocks
(organization, website, persons — SEO), react-hot-toast `<Toaster>`,
**LogRocketInit** (loads LogRocket lazily in production only, identifies logged
in users), Vercel `<Analytics>`, and Google Analytics gtag when
`NEXT_PUBLIC_GA_ID` is set.

### 7.2 Route groups & guards

- **`(public)`** — marketing site reachable while logged out: landing page
  (`page.tsx` here is the site root `/`), `/explore`, `/features`,
  `/how-it-works`, `/about-us`, `/faqs`, plus policy pages (privacy, cookies,
  terms, use-policy).
- **Auth pages** (top level, no group): `/login`, `/signup`, `/verification`,
  `/user-registration` (legacy), `/reset-your-password`, `/reset-password`,
  `/password-reset-confirmation`, `/password-reset-success`.
- **`(onboarding)/onboarding`** — layout requires a session (else redirect to
  `/login`) and redirects to `/dashboard` if the profile is already complete.
- **`(user)`** — the authenticated shell. Its layout:
  1. `getServerSession` → redirect `/` if not logged in.
  2. Loads the user's Profile from Prisma and checks completeness
     (name + institution + department + country + state non-empty);
     incomplete ⇒ redirect `/onboarding`.
  3. Renders the app chrome: collapsible **Sidebar** (with
     `SidebarContext` + mobile swipe zone), sticky **UserHeader**, and the page
     content.
- **`error.tsx`** in `(user)` provides a route-group error boundary.

### 7.3 The Next.js API routes (`app/api/**`) — the app's main REST API

These Route Handlers run server-side, use `getServerSession(authOptions)` for
auth, and talk to Prisma directly. They are the workhorse of the product.

#### Auth
| Endpoint | What it does |
|---|---|
| `auth/[...nextauth]` | NextAuth handler. **Credentials provider:** looks up user by email, verifies argon2 hash, rejects unverified emails with error `EMAIL_NOT_VERIFIED`, rejects passwordless (OAuth) accounts. **Google provider:** auto-creates the User row on first sign-in. **Callbacks:** `jwt` re-syncs `token.sub` to the DB user id (and supports `update()` for avatar changes); `session` injects the DB `user.id` into the session object. |
| `auth/token` | Returns the raw NextAuth session-token cookie value (`__Secure-next-auth.session-token` or dev variant). This is the bridge that lets the browser call the Express backend. |
| `auth/verify-email` | POST `{email, code}` — checks code matches, isn't expired, sets `emailVerified`, clears code fields. |
| `auth/resend-code` | POST `{email}` — regenerates the 6-digit code, enforces a 60-second cooldown via `lastCodeRequestAt`, emails it. |
| `auth/request-password-reset` | POST `{email}` — always returns the same generic message (no account enumeration). Generates a 32-byte url-safe token, stores only its **SHA-256 hash** + 30-min expiry, 60-s request cooldown, emails the reset link. |
| `auth/reset-password` | POST `{token, newPassword}` — hashes the incoming token, finds user by hash, checks expiry, validates password strength regex (8+ chars, upper+lower+special), saves argon2 hash, clears reset fields. |

Email sending lives in `lib/email.ts` using **Resend** + React Email templates
(`emails/verification-email.tsx`, `emails/password-reset-email.tsx`).
Helpers: `generateVerificationCode()` (random 6 digits), 5-minute code expiry,
30-minute reset expiry.

#### Users
| Endpoint | What it does |
|---|---|
| `users` POST | Signup: hashes password with argon2, rejects duplicate email (409), generates verification code, creates user, sends verification email. |
| `users` GET | Lists all users except the caller (basic fields) — used for starting chats. |
| `users` PUT / DELETE | Generic update/delete by id (admin-ish utilities). |

#### Documents (the knowledge marketplace)
| Endpoint | What it does |
|---|---|
| `documents` GET | Feed with `authorId`, `category`, `q` (search title/description/institution/author name), `sort` (`recent`/`oldest`/`popular` by likes), `page`+`limit` pagination. For logged-in callers it batch-fetches Like/Save rows and decorates each doc with `isLiked`/`isSaved`. Returns `{documents, pagination}`. |
| `documents` POST | Publish: requires session; validates required fields, maps category string→enum, **validates `fileUrl` really points at this Cloudinary cloud under `academiahub/documents/`**, enforces ≤10 MB, creates the Document. |
| `documents/[id]` GET | Single doc + author + caller's `isLiked`/`isSaved`. |
| `documents/[id]` DELETE | Author-only. Destroys the Cloudinary asset best-effort (infers resource type from URL), then deletes the row (cascades clean up children), revalidates `/dashboard`. |
| `documents/[id]/like` POST/DELETE | Like/unlike inside a `$transaction` that also increments/decrements the counter. On like, `after()` (post-response background work) creates a LIKE notification for the author (unless self-like) and pushes it via the internal socket bridge. |
| `documents/[id]/save` POST/DELETE | Bookmark/unbookmark (no counter). |
| `documents/[id]/download` POST | Records a DownloadRecord + increments counter in a transaction. The actual file comes straight from Cloudinary; this endpoint is the analytics/bookkeeping step. |
| `documents/[id]/comments` GET/POST | Paginated comments (newest first); POST validates ≤2000 chars, notifies the author via `after()`. |
| `documents/[id]/comments/[commentId]` PUT/DELETE | Author-only edit/delete; edits blocked after **72 hours**. |
| `documents/[id]/reviews` GET/POST/DELETE | GET returns aggregate (average, total, 1–5 distribution) + caller's rating. POST upserts a 1–5 integer rating; authors can't review their own docs. DELETE removes the review. |
| `documents/[id]/report` POST | Reports a doc: ≥1 valid reason enum, description mandatory when reason includes OTHER, one report per user per document (unique), author can't report self. |

`lib/reviews/aggregate.ts` computes the aggregate with a Prisma `groupBy` and
is wrapped in React `cache()` so multiple components in one render share it.

#### Notifications
| Endpoint | What it does |
|---|---|
| `notifications` GET | Cursor-paginated list (newest first, default 20/max 50). |
| `notifications/unread-count` GET | Count of unread. |
| `notifications/[id]/read` PATCH | Mark one read. |
| `notifications/read-all` PATCH | Mark all read. |

#### Profiles & settings
| Endpoint | What it does |
|---|---|
| `profile/me` GET | Own profile + computed stats (uploads, total downloads, total likes, saves received). |
| `profile/me` PUT | Updates name/avatar/bio. Avatar URLs are validated to be this cloud's `academiahub/avatars/<userId>` path. Upserts the Profile row in a transaction with the User update. |
| `profile/[userId]` GET | Someone else's profile + same computed stats. |
| `user/change-password` PUT | Zod-validated; blocks OAuth accounts; verifies current password (argon2) before saving the new hash. |
| `user/privacy` GET/PATCH | Reads/toggles `allowMessages` and `showInSearch` (whitelisted field names only). |

#### Uploads
| Endpoint | What it does |
|---|---|
| `sign-cloudinary-params` POST | Body `{kind: "avatar"|"document"}`. Returns a **signature** for a direct browser→Cloudinary upload, with strict per-kind policies: avatars → folder `academiahub/avatars`, public_id = userId (overwrite+invalidate), eager transform `c_fill,g_auto,w_400,h_400,f_auto,q_auto`, jpg/png/webp, 4 MB cap; documents → folder `academiahub/documents`, pdf only, 10 MB cap. The API secret never leaves the server. |

Client helper `lib/cloudinary/upload.ts` posts the signed FormData via XHR so
it can report **upload progress %**.

### 7.4 Client data layer

- **Messaging** (`lib/messaging/`):
  - `api.ts` — `authFetch` first gets a token from `/api/auth/token`, then calls
    the Express backend with `Authorization: Bearer`. Functions:
    `fetchConversations`, `createConversation`, `fetchMessages(cursor)`,
    `fetchReceipts`, `searchUsers`.
  - `hooks.ts` — React Query hooks gluing REST + sockets together:
    - `useConversations` — query auto-invalidated whenever `message:new`
      arrives.
    - `useMessages(id)` — infinite query over cursor pages.
    - `useUserSearch(q)` — enabled only at ≥3 chars.
    - `useCreateConversation` — mutation invalidating the list.
    - `useSendMessage` — emits `message:send` with a 300 ms debounce.
    - `useTyping` / `useRemoteTyping` — emit start/stop (auto-stop after 3 s)
      and expose the partner's typing flag (auto-clears after 4 s).
    - `useNewMessages(id)` — collects realtime messages for the open thread,
      deduped, cleared when switching threads.
    - `useReadMark` — emits `read:mark` **only when the tab has focus**
      (`document.hasFocus()`).
  - `utils.ts` — initials, time formatting, truncation, and `isUnread`
    (last message not mine && receipt ≠ last message id).
  - `urlSanitizer.ts` — splits message text into text/link segments
    (https-only regex) for safe rendering.
- **Notifications** (`lib/notifications/hooks.ts`):
  - `useNotifications` — infinite query; prepends socket-arrived notifications
    straight into the React Query cache.
  - `useUnreadCount` — polls every 60 s while the tab is visible, refetches on
    focus, and optimistically +1 on `notification:new`.
  - `useMarkNotificationRead` / `useMarkAllRead` — optimistic cache updates,
    then fire-and-forget PATCH calls.
- **Types** (`app/_types/messaging.ts`) — full typed event maps
  (`ClientToServerEvents`, `ServerToClientEvents`) giving end-to-end typed
  sockets (`TypedSocket`).

### 7.5 Pages & UI components (feature by feature)

**Landing `(public)/page.tsx`** — hero, ExploreSection (3 latest docs),
"why choose us", how-it-works, about, FAQ accordion, join-us CTA. Static copy
lives in `app/data/`.

**Dashboard `(user)/dashboard`** — server component reads `searchParams`
(search/category/sort) and pre-renders the first page of documents **directly
via Prisma** (same filtering/sorting rules as the API), passing them into
`FilterDocuments` (client) which handles further pages, filter chips, research
cards (`ResearchCard` shows category art, author, likes/comments counts,
like/save buttons), a share dialog, and skeleton loading states.

**Publication detail `(user)/publication/[id]`** — server component loads the
document, first 20 comments, review aggregate, viewer's like/save/review state,
and the author's profile card. Children:
- `PublicationDetails` — metadata, download button (records the download then
  opens the Cloudinary URL), like/save toggles, owner-only delete
  (`DeletePublication`), kebab menu.
- `Comments` / `CommentOrReview` — comment list + composer; reviews widget with
  star distribution bars (`StarRatings`).
- `MessageAuthorButton` — creates (or finds) a DM conversation then navigates
  to `/inbox?c=<id>`.
- **Report flow uses an intercepting route:** navigating to
  `/publication/[id]/report-issue` renders `@modal/(.)report-issue` as a modal
  dialog (focus trap, Escape/backdrop close via `router.back()`) on top of the
  page; visiting that URL directly renders the full-page version instead.

**Uploads `(user)/uploads`** — `UploadForm`: react-hook-form + zod (PDF MIME +
10 MB checks client-side too), fetches signed params, uploads with progress
bar, then POSTs metadata to `/api/documents` and redirects.

**Saved / Downloads** — server components listing bookmarked docs and
deduplicated download history respectively, decorated with liked/saved ids for
instant UI state.

**Analytics `(user)/analytics`** — `lib/analytics.ts` `getAnalytics(userId,
range)` computes, in one big `Promise.all`: totals + this-month vs last-month
counts for uploads/downloads/saves/profile-visits (percentage change), a
download time-series bucketed by range (`daily`=24 h buckets, `weekly`=7 days,
`monthly`=days of month, `yearly`=12 months), and 4 recent uploads by others.
Rendered with `Statistics` cards, a recharts `MyChart`, and `RecentActivities`.
`recordProfileVisit` (deduped per 30 min) is called from profile views.

**Inbox `(user)/inbox`** — `InboxView` reads `?c=<conversationId>`:
two-pane desktop layout (ConversationList + ChatThread), single-pane swap on
mobile. `ChatThread` merges paginated history (reversed to oldest-first) with
live `message:new` items, auto-scrolls when pinned to bottom, shows a
"scroll to bottom (n)" pill with unread count when scrolled up, marks read at
bottom, and renders `TypingIndicator` + `MessageInput`. Conversation rows show
unread dots via `isUnread`. `ChatHeader` offers search of users to start new
chats.

**Notifications `(user)/notifications`** — infinite scroll via
IntersectionObserver sentinel, per-item mark-read on click (navigates to the
notification's `link`), "mark all as read", colored icons per type
(`NotificationIcon`).

**Profiles** — own profile (`profile/page.tsx` + `ProfileSection`, stats,
tabs of publications/likes), edit page (`EditProfileForm` with avatar upload),
and other users at `profile/[otherUserId]` (records a profile visit, shows
their publications, a "Message" button, tags).

**Settings `(user)/settings`** — `AllForms` hosts `ProfileInfoForm`
(name/institution/department/aboutMe/country/state via country-state-city),
`ChangePasswordForm`, `PrivacySettings` (the two toggles), and
`NotificationsSettings`. Zod schemas in `lib/schemas/settingsSchema.ts`.

**Support `(user)/support`** — help-center hub with sub-pages (account,
publications, notifications, settings topics) built from static content, plus
contact options.

**Onboarding wizard** — `OnboardingStepper`: 3 marketing/info slides then
`OnboardingProfileForm` (name, institution, department, country→state chained
selects) which PUTs `/api/profile/me` and enters the dashboard.

### 7.6 Other libraries worth mentioning
- `lib/serverFetch.ts` — server-side fetch wrapper forwarding the incoming
  cookie header (for calling own API routes from RSCs when needed).
- `lib/analytics.ts` — described above; also `formatTimeAgo`.
- `lib/categoryImage.ts` — maps categories to card artwork.
- `lib/jsonld/{website,organisation,person}.ts` — structured-data objects for
  SEO; `siteUrl` reused by `sitemap.ts` and `robots.ts`.
- `components/ClickSpark.tsx`, `BrandedLoader`, `NameSkeleton`,
  `ExploreSkeleton`, various `*Skeleton` files — polish/loading UX.
- shadcn-style UI kit in `components/ui` (button, input, select, dialog,
  sheet, accordion, chart, …) on Radix primitives + `class-variance-authority`
  + `tailwind-merge` (`lib/utils.ts` `cn()`).

---

## 8. Feature Walkthroughs (end-to-end narratives)

Use these as lesson scripts.

### 8.1 Sign-up → verified → onboarded
1. `/signup` validates fields client-side, POSTs `/api/users`.
2. Server hashes the password (argon2), stores a random 6-digit code
   (5-min expiry), emails it via Resend/React Email.
3. Client redirects to `/verification?email=…` — six OTP boxes with
   auto-advance, backspace-retreat, paste support, and a 60-s resend cooldown.
4. POST `/api/auth/verify-email` flips `emailVerified`; redirect to
   `/login?verified=true` (toast confirms).
5. Login: Credentials provider verifies argon2 + verified status; or Google
   OAuth (auto-provisions the user). Session callback embeds the DB user id.
6. First visit to `(user)` layout detects an incomplete Profile → redirect to
   `/onboarding` wizard → PUT `/api/profile/me` → dashboard.

### 8.2 Password reset
"Forgot password" → `/reset-your-password` collects email →
`/api/auth/request-password-reset` (generic response, hashed token, 30-min
expiry, 60-s cooldown) → email link `/reset-password?token=…` →
`/api/auth/reset-password` validates + updates → confirmation/success pages.

### 8.3 Publishing a document
`/uploads` → zod-validated form → `POST /api/sign-cloudinary-params {kind:
"document"}` → XHR upload to Cloudinary with progress → `POST /api/documents`
with metadata (server re-validates URL domain/folder, size, category) →
document appears in feeds.

### 8.4 Discovering & interacting
Dashboard/explore feed (search, category chips, sort, load-more) → publication
page → like (transaction + notification push), save, download (recorded),
comment (72-h edit window), star review (aggregate recomputed), report (modal,
enum reasons, one per user), share dialog, message-the-author.

### 8.5 Real-time DM conversation
Search a user (≥3 chars, rate-limited) → `POST /api/conversations` (idempotent
pair normalization) → open `/inbox?c=…` → history via cursor pages → typing
indicator both ways → send over socket (HTML-stripped, ≤5000 chars, ≤30/min)
→ both parties get `message:new` → recipient's receipt updates via
`read:update` when they focus + view → MESSAGE notification created + pushed.

### 8.6 Notifications lifecycle
Created by: like/comment routes (Next.js, via `after()`), message events
(backend). Stored in DB → pushed through `/internal/notify` → socket
`notification:new` → cache prepend + badge increment → bell icon unread count
(polling fallback every 60 s) → notifications page with infinite scroll →
mark-read endpoints with optimistic UI.

---

## 9. The Real-Time Pipeline (diagram to draw on a whiteboard)

```
Author clicks ❤️ on Next.js page
        │ fetch POST /api/documents/:id/like
        ▼
Next.js Route Handler
  ├─ $transaction: create Like + bump counter
  ├─ respond 201 immediately
  └─ after(): create Notification row
              │ fetch POST {BACKEND_URL}/internal/notify
              │        Authorization: Bearer INTERNAL_API_SECRET
              ▼
      Express /internal/notify
              │ sendToUser(userId, "notification:new", n)
              ▼
      Socket.IO (path /ws) ──► every open tab of the recipient
                                     │
                                     ▼
                React Query cache updated instantly (badge +1,
                item prepended in notifications list)
```

Chat messages skip Next.js entirely: browser ⇄ Socket.IO ⇄ Prisma.

---

## 10. Security Model Summary

- **Passwords:** argon2 hashing; strength regex on reset; current-password
  check on change; OAuth accounts have no password.
- **Sessions:** NextAuth JWE cookies; backend verifies the same token with a
  derived key — no session store needed.
- **Authorization:** every conversation route double-checks participation;
  document mutation restricted to authors; comments editable only by their
  author within 72 h; self-like/self-review/self-report blocked.
- **Secrets:** Cloudinary signing happens server-side; `INTERNAL_API_SECRET`
  gates the notify bridge; generic responses prevent account enumeration on
  password reset.
- **Abuse controls:** helmet, tight CORS, 10 kb JSON cap, per-user REST rate
  limits, socket-level message rate limiting + connection caps, read-receipt
  debounce, client send debounce, HTML stripping on messages, URL validation
  for Cloudinary assets, email-code/resend cooldowns.
- **Realtime hygiene:** idle disconnect after 5 min, presence only broadcast to
  actual conversation partners, max 5 sockets/user.

---

## 11. Environment Variables

**Root `.env`**
- `DATABASE_URL` — file:./prisma/dev.db (shared by both apps)

**`backend/.env`**
- `PORT` (4000), `FRONTEND_URL` (comma-separated allowed origins),
  `DATABASE_URL`, `NEXTAUTH_SECRET` (must match frontend!), 
  `INTERNAL_API_SECRET`, `NODE_ENV`

**`frontend/.env.local`**
- `NEXT_PUBLIC_BACKEND_URL` (browser → Express, e.g. http://localhost:4000)
- `BACKEND_URL` (server → Express, for /internal/notify)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Plus (in deployment): `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`,
  `EMAIL_FROM`, `CLOUDINARY_URL`, `NEXT_PUBLIC_GA_ID`

---

## 12. Running & Developing the Project

```cmd
start.cmd        :: opens two windows: backend :4000 + frontend :3000
```

Or manually (npm workspaces — **always install from the root**):

```bash
npm install                          # root only, never inside frontend/backend
npm install pkg --workspace frontend # add deps per workspace
npm run dev --workspace backend
npm run dev --workspace frontend
```

Prisma workflow (schema is shared at `prisma/schema.prisma`, dual generators):

```bash
npx prisma generate   # regenerate both clients after schema edits
npx prisma db push    # apply schema to SQLite without migrations
npx prisma studio     # browse data visually
```

Conventions (CONTRIBUTING.md): commits/PR titles follow
`<type>(<scope>): <description>` with scope `frontend|backend|root` and
descriptions ≤50 chars.

Backend build: `npm run build` (generates Prisma client, tsc, copies generated
folder into dist) then `npm start`.

---

## 13. Known Quirks & Observations

Good discussion points when teaching (and things to fix before extending):

1. **`Profile.bio` schema drift — RESOLVED (Aug 2026).** The application code
   used to read/write a single JSON-shaped `bio` object on `Profile`, which no
   longer exists in the schema and crashed every profile-bearing route with
   `PrismaClientValidationError`. All call sites now select the flat columns
   (`institution`, `department`, `aboutMe`, `state`, `country`) directly, and
   `/api/profile/*` still *responds* with a nested `bio` object built from
   those columns so client components (`EditProfileForm`, `ProfileCard`,
   `ProfileInfoForm`, …) keep their shape. That nested-`bio` response is now a
   deliberate compatibility layer, not the DB shape.
2. **Known typecheck debt (pre-existing).** Several document-search queries use
   Prisma string filters with `mode: "insensitive"`
   (`app/api/documents/route.ts`, `components/user/dashboard/MainContent.tsx`),
   which SQLite does not support — these fail `tsc --noEmit` and should be
   reworked or made case-insensitive at the query level another way.
3. **Legacy/duplicate auth pages.** `/user-registration` (ProfileSetup logs to
   console only) and `/reset-your-password` vs `/reset-password` overlap; the
   active flows are signup→verification and reset-password.
4. **Mixed data-access styles.** Some pages query Prisma directly in server
   components (dashboard, saved, downloads, publication) while equivalent REST
   handlers also exist (`/api/documents`) — intentional BFF duplication, but
   worth knowing where the source of truth for a given screen lives.
5. **In-memory state on the backend.** Socket registries, presence, message
   rate windows, and read-debounce maps are per-process memory; horizontal
   scaling would need a Redis adapter/store.
6. **SQLite in dev.** Fine for teaching/local runs; production would swap the
   datasource provider.
7. **`@upstash/ratelimit`** is installed but the active limiter is
   express-rate-limit (backend) and DB-timestamp cooldowns (frontend routes).
