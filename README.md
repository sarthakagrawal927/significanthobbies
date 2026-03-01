# SignificantHobbies

Map your hobby history across life phases. Visualize insights. Share your journey. Discover what to explore next.

## Quick Start

```bash
pnpm install
cp .env.example .env          # fill in your values
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` for local, `libsql://...` for Turso |
| `TURSO_AUTH_TOKEN` | Turso only | Token from `turso db tokens create <db>` |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` in dev |
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | From Google Cloud Console |

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID + Secret into `.env`

## Turso (Production Database)

```bash
# Install CLI
brew install tursodatabase/tap/turso
turso auth login

# Create database
turso db create significanthobbies

# Get URL and token
turso db show significanthobbies --url
turso db tokens create significanthobbies

# Update .env
DATABASE_URL="libsql://significanthobbies-<org>.turso.io"
TURSO_AUTH_TOKEN="<token>"
```

## Running Tests

```bash
pnpm test
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Google sign in |
| `/setup` | Set your username (first login) |
| `/timeline/new` | Build a new timeline |
| `/timeline/[id]` | View your timeline with insights |
| `/timeline/[id]/edit` | Edit your timeline |
| `/t/[slug]` | Shared timeline (public/unlisted) |
| `/u/[username]` | User profile + hobby portfolio |
| `/hobbies` | Browse hobby categories |
| `/hobbies/[hobby]` | Hobby detail + who does it |
| `/explore` | Aggregate trends (coming soon) |

## Stack

- **Framework**: Next.js 14 App Router + TypeScript
- **Database**: Prisma + Turso (libSQL / SQLite)
- **Auth**: NextAuth v4 (Google OAuth)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Export**: html-to-image (client-side PNG)
- **Testing**: Vitest

## Features

- **Timeline builder** — drag/drop phases, add hobbies, auto-save for guests
- **Insights** — rekindled hobbies, persistence tracking, phase-by-phase changes
- **Export** — beautiful PNG card + JSON export
- **Profile** — `/@username` portfolio of your public timelines
- **Discovery** — personalized hobby suggestions + directory
- **Guest mode** — build and export without an account
