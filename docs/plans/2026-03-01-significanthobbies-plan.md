# SignificantHobbies Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build SignificantHobbies — a web app for tracking hobby history across life phases, visualizing insights, sharing a profile, and discovering new hobbies.

**Architecture:** Next.js 14 App Router with server actions for mutations, server components for reads, and dedicated API routes only for auth callbacks. Prisma + Turso (libSQL) for data persistence. Guest timelines autosaved to localStorage, imported on login.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Prisma + Turso (@libsql/client + @prisma/adapter-libsql), NextAuth v5 beta (Google OAuth), Zod, @dnd-kit/sortable, html-to-image, nanoid, Vitest

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`, `.gitignore`

**Step 1: Scaffold project**
```bash
cd /Users/sarthakagrawal/Desktop/significanthobbies
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-turbopack
```

**Step 2: Install all dependencies**
```bash
pnpm add @prisma/client @prisma/adapter-libsql @libsql/client
pnpm add next-auth@beta @auth/prisma-adapter
pnpm add zod nanoid
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add html-to-image
pnpm add recharts
pnpm add -D prisma vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Initialize Prisma**
```bash
pnpm prisma init --datasource-provider sqlite
```

**Step 4: Create `.env.local`**
```bash
cat > .env.local << 'EOF'
DATABASE_URL="file:./dev.db"
TURSO_AUTH_TOKEN=""
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-prod"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ADMIN_EMAILS=""
EOF
```

**Step 5: Create `.env.example`**
```
DATABASE_URL="libsql://[db-name]-[org].turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="from-google-cloud-console"
GOOGLE_CLIENT_SECRET="from-google-cloud-console"
ADMIN_EMAILS="you@example.com"
```

**Step 6: Commit**
```bash
git init
git add .
git commit -m "chore: initialize Next.js project with dependencies"
```

---

## Task 2: Configure shadcn/ui

**Files:**
- Modify: `components.json`, `app/globals.css`, `tailwind.config.ts`

**Step 1: Initialize shadcn**
```bash
pnpm dlx shadcn@latest init -d
```
Choose: New York style, zinc base color, yes CSS variables.

**Step 2: Add required components**
```bash
pnpm dlx shadcn@latest add button card input label textarea select dialog tabs badge separator scroll-area sheet avatar dropdown-menu tooltip toast sonner
```

**Step 3: Update `tailwind.config.ts` to add custom colors**
```ts
// Add to theme.extend.colors:
colors: {
  brand: {
    50: '#ecfdf5',
    500: '#10b981',
    600: '#059669',
    900: '#064e3b',
  }
}
```

**Step 4: Update `app/globals.css` — set dark background**
```css
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* keep shadcn dark theme variables */
}
body {
  @apply bg-slate-950 text-slate-100;
}
```

**Step 5: Commit**
```bash
git add .
git commit -m "chore: configure shadcn/ui with dark theme"
```

---

## Task 3: Prisma Schema + Turso Client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `lib/types.ts`

**Step 1: Write `prisma/schema.prisma`**
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  username      String?   @unique
  accounts      Account[]
  sessions      Session[]
  timelines     Timeline[]
  createdAt     DateTime  @default(now())
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Timeline {
  id         String   @id @default(cuid())
  userId     String?
  title      String?
  visibility String   @default("PRIVATE")
  slug       String?  @unique
  phases     String   @default("[]")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

**Note:** `phases` is stored as a JSON string (SQLite doesn't have native JSON type but Prisma handles it). We cast to/from the Phase[] type in lib/types.ts.

**Step 2: Write `lib/prisma.ts`**
```ts
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

function createPrismaClient() {
  const url = process.env.DATABASE_URL!

  // Local file-based SQLite for dev
  if (url.startsWith('file:')) {
    return new PrismaClient()
  }

  // Turso for production
  const libsql = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 3: Write `lib/types.ts`**
```ts
export type HobbyEntry = {
  name: string
  intensity?: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export type Phase = {
  id: string
  label: string
  ageStart?: number
  ageEnd?: number
  yearStart?: number
  yearEnd?: number
  hobbies: HobbyEntry[]
  order: number
}

export type TimelineVisibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC'

export type TimelineData = {
  id: string
  title: string | null
  visibility: TimelineVisibility
  slug: string | null
  phases: Phase[]
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  } | null
}
```

**Step 4: Run migration**
```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add Prisma schema and Turso client"
```

---

## Task 4: NextAuth v5 Setup (Google OAuth)

**Files:**
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

**Step 1: Write `auth.ts`**
```ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.username = (user as any).username ?? null
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
```

**Step 2: Write `app/api/auth/[...nextauth]/route.ts`**
```ts
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

**Step 3: Write `middleware.ts`**
```ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Protect edit routes
  if (pathname.startsWith('/timeline/') && pathname.endsWith('/edit')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

**Step 4: Extend NextAuth types — create `types/next-auth.d.ts`**
```ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string | null
    } & DefaultSession['user']
  }
}
```

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add NextAuth v5 with Google OAuth"
```

---

## Task 5: Insights Library (TDD)

**Files:**
- Create: `lib/insights.ts`
- Create: `lib/insights.test.ts`

**Step 1: Write failing tests first — `lib/insights.test.ts`**
```ts
import { describe, it, expect } from 'vitest'
import {
  getAddedPerPhase,
  getDroppedPerPhase,
  getRekindledHobbies,
  getMostPersistent,
  getCoOccurrencePairs,
  computeInsights,
} from './insights'
import type { Phase } from './types'

const phases: Phase[] = [
  {
    id: '1', label: 'Childhood', order: 0,
    hobbies: [
      { name: 'drawing' },
      { name: 'cycling' },
      { name: 'reading' },
    ],
  },
  {
    id: '2', label: 'Teen years', order: 1,
    hobbies: [
      { name: 'cycling' },
      { name: 'gaming' },
      { name: 'reading' },
    ],
  },
  {
    id: '3', label: 'College', order: 2,
    hobbies: [
      { name: 'drawing' },
      { name: 'hiking' },
      { name: 'reading' },
    ],
  },
]

describe('getAddedPerPhase', () => {
  it('returns empty for first phase', () => {
    expect(getAddedPerPhase(phases)[0]).toEqual([])
  })
  it('returns new hobbies added in phase 2', () => {
    expect(getAddedPerPhase(phases)[1]).toContain('gaming')
    expect(getAddedPerPhase(phases)[1]).not.toContain('cycling')
  })
})

describe('getDroppedPerPhase', () => {
  it('returns empty for first phase', () => {
    expect(getDroppedPerPhase(phases)[0]).toEqual([])
  })
  it('returns hobbies dropped from phase 1 to 2', () => {
    expect(getDroppedPerPhase(phases)[1]).toContain('drawing')
    expect(getDroppedPerPhase(phases)[1]).not.toContain('cycling')
  })
})

describe('getRekindledHobbies', () => {
  it('detects drawing as rekindled (present, absent, present)', () => {
    expect(getRekindledHobbies(phases)).toContain('drawing')
  })
  it('does not mark reading as rekindled (never absent)', () => {
    expect(getRekindledHobbies(phases)).not.toContain('reading')
  })
})

describe('getMostPersistent', () => {
  it('reading appears in all 3 phases', () => {
    const result = getMostPersistent(phases)
    expect(result[0].hobby).toBe('reading')
    expect(result[0].count).toBe(3)
  })
})

describe('getCoOccurrencePairs', () => {
  it('returns pairs within same phase', () => {
    const pairs = getCoOccurrencePairs(phases)
    const pairNames = pairs.map(p => p.pair.sort().join(','))
    expect(pairNames).toContain('cycling,reading')
  })
})

describe('computeInsights', () => {
  it('returns combined insights object', () => {
    const result = computeInsights(phases)
    expect(result).toHaveProperty('rekindled')
    expect(result).toHaveProperty('mostPersistent')
    expect(result).toHaveProperty('addedPerPhase')
    expect(result).toHaveProperty('droppedPerPhase')
    expect(result).toHaveProperty('coOccurrencePairs')
  })
})
```

**Step 2: Add vitest config — `vitest.config.ts`**
```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
```

**Step 3: Add test script to `package.json`**
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 4: Run tests to verify they fail**
```bash
pnpm test
```
Expected: FAIL — "Cannot find module './insights'"

**Step 5: Write `lib/insights.ts`**
```ts
import type { Phase } from './types'

export function getAddedPerPhase(phases: Phase[]): string[][] {
  return phases.map((phase, i) => {
    if (i === 0) return []
    const prev = new Set(phases[i - 1].hobbies.map(h => h.name.toLowerCase()))
    return phase.hobbies
      .map(h => h.name.toLowerCase())
      .filter(name => !prev.has(name))
  })
}

export function getDroppedPerPhase(phases: Phase[]): string[][] {
  return phases.map((phase, i) => {
    if (i === 0) return []
    const curr = new Set(phase.hobbies.map(h => h.name.toLowerCase()))
    return phases[i - 1].hobbies
      .map(h => h.name.toLowerCase())
      .filter(name => !curr.has(name))
  })
}

export function getRekindledHobbies(phases: Phase[]): string[] {
  const allHobbies = new Set(
    phases.flatMap(p => p.hobbies.map(h => h.name.toLowerCase()))
  )
  const rekindled: string[] = []

  for (const hobby of allHobbies) {
    let state: 'never' | 'present' | 'absent' = 'never'
    let wasAbsent = false
    for (const phase of phases) {
      const present = phase.hobbies.some(h => h.name.toLowerCase() === hobby)
      if (present && state === 'never') state = 'present'
      else if (!present && state === 'present') { state = 'absent'; wasAbsent = true }
      else if (present && wasAbsent && state === 'absent') {
        rekindled.push(hobby)
        break
      }
    }
  }
  return rekindled
}

export function getMostPersistent(phases: Phase[]): { hobby: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const phase of phases) {
    for (const h of phase.hobbies) {
      const name = h.name.toLowerCase()
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([hobby, count]) => ({ hobby, count }))
    .sort((a, b) => b.count - a.count)
}

export function getCoOccurrencePairs(phases: Phase[]): { pair: string[]; count: number }[] {
  const pairCounts = new Map<string, number>()
  for (const phase of phases) {
    const names = phase.hobbies.map(h => h.name.toLowerCase()).sort()
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = `${names[i]}|||${names[j]}`
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }
  return Array.from(pairCounts.entries())
    .map(([key, count]) => ({ pair: key.split('|||'), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

export type Insights = {
  addedPerPhase: string[][]
  droppedPerPhase: string[][]
  rekindled: string[]
  mostPersistent: { hobby: string; count: number }[]
  coOccurrencePairs: { pair: string[]; count: number }[]
}

export function computeInsights(phases: Phase[]): Insights {
  return {
    addedPerPhase: getAddedPerPhase(phases),
    droppedPerPhase: getDroppedPerPhase(phases),
    rekindled: getRekindledHobbies(phases),
    mostPersistent: getMostPersistent(phases),
    coOccurrencePairs: getCoOccurrencePairs(phases),
  }
}
```

**Step 6: Run tests to verify they pass**
```bash
pnpm test
```
Expected: All PASS

**Step 7: Commit**
```bash
git add .
git commit -m "feat: add insights library with full test coverage"
```

---

## Task 6: Hobby Categories (Static Data)

**Files:**
- Create: `lib/hobbies.ts`

**Step 1: Write `lib/hobbies.ts`**
```ts
export type HobbyCategory = {
  name: string
  emoji: string
  hobbies: string[]
}

export const HOBBY_CATEGORIES: HobbyCategory[] = [
  {
    name: 'Creative',
    emoji: '🎨',
    hobbies: ['Drawing', 'Painting', 'Photography', 'Writing', 'Sculpting', 'Ceramics', 'Knitting', 'Sewing', 'Origami', 'Calligraphy', 'Graphic design', 'Music production', 'Songwriting', 'Poetry', 'Filmmaking'],
  },
  {
    name: 'Music',
    emoji: '🎵',
    hobbies: ['Guitar', 'Piano', 'Drums', 'Violin', 'Bass', 'Singing', 'DJing', 'Ukulele', 'Saxophone', 'Flute', 'Music theory'],
  },
  {
    name: 'Physical',
    emoji: '💪',
    hobbies: ['Running', 'Cycling', 'Swimming', 'Hiking', 'Climbing', 'Yoga', 'Gym', 'Martial arts', 'Dance', 'Basketball', 'Football', 'Tennis', 'Skiing', 'Skateboarding', 'Surfing', 'Rowing'],
  },
  {
    name: 'Intellectual',
    emoji: '📚',
    hobbies: ['Reading', 'Chess', 'Coding', 'Language learning', 'Puzzles', 'Philosophy', 'History', 'Astronomy', 'Mathematics', 'Science', 'Writing essays'],
  },
  {
    name: 'Gaming',
    emoji: '🎮',
    hobbies: ['Video games', 'Board games', 'Tabletop RPGs', 'Speedrunning', 'Esports', 'Card games', 'Dungeon Master'],
  },
  {
    name: 'Outdoor',
    emoji: '🌿',
    hobbies: ['Gardening', 'Bird watching', 'Camping', 'Fishing', 'Foraging', 'Stargazing', 'Rock collecting', 'Beekeeping'],
  },
  {
    name: 'Culinary',
    emoji: '🍳',
    hobbies: ['Cooking', 'Baking', 'Coffee brewing', 'Wine tasting', 'Cocktail making', 'Fermentation', 'BBQ', 'Food photography'],
  },
  {
    name: 'Collecting',
    emoji: '🗂',
    hobbies: ['Vinyl records', 'Books', 'Stamps', 'Coins', 'Art', 'Sneakers', 'Vintage clothing', 'Watches'],
  },
  {
    name: 'Making',
    emoji: '🔧',
    hobbies: ['Woodworking', '3D printing', 'Electronics', 'Leatherworking', 'Blacksmithing', 'Candle making', 'Soap making', 'Jewelry making'],
  },
  {
    name: 'Social',
    emoji: '🤝',
    hobbies: ['Volunteering', 'Hosting dinners', 'Book club', 'Improv comedy', 'Theater', 'Debate club', 'Travel'],
  },
]

export const ALL_HOBBIES = HOBBY_CATEGORIES.flatMap(c => c.hobbies)

export function getCategoryForHobby(hobby: string): HobbyCategory | undefined {
  const lower = hobby.toLowerCase()
  return HOBBY_CATEGORIES.find(c =>
    c.hobbies.some(h => h.toLowerCase() === lower)
  )
}

export function getSuggestedHobbies(existingHobbies: string[], limit = 6): string[] {
  const existing = new Set(existingHobbies.map(h => h.toLowerCase()))
  const categories = existingHobbies
    .map(h => getCategoryForHobby(h))
    .filter(Boolean) as HobbyCategory[]
  const categoryNames = new Set(categories.map(c => c.name))

  // Prefer hobbies from same categories not yet tried
  const suggestions: string[] = []
  for (const cat of HOBBY_CATEGORIES) {
    const weight = categoryNames.has(cat.name) ? 2 : 1
    const candidates = cat.hobbies.filter(h => !existing.has(h.toLowerCase()))
    const picks = candidates.slice(0, weight)
    suggestions.push(...picks)
  }

  // Deduplicate and limit
  return [...new Set(suggestions)].slice(0, limit)
}
```

**Step 2: Commit**
```bash
git add lib/hobbies.ts
git commit -m "feat: add hobby categories and suggestion logic"
```

---

## Task 7: Server Actions

**Files:**
- Create: `lib/actions/timeline.ts`
- Create: `lib/actions/user.ts`

**Step 1: Write `lib/actions/timeline.ts`**
```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import type { Phase, TimelineVisibility } from '@/lib/types'

const PhaseSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  ageStart: z.number().optional(),
  ageEnd: z.number().optional(),
  yearStart: z.number().optional(),
  yearEnd: z.number().optional(),
  hobbies: z.array(z.object({
    name: z.string().min(1).max(100),
    intensity: z.number().min(1).max(5).optional(),
    notes: z.string().max(500).optional(),
  })),
  order: z.number(),
})

const SaveTimelineSchema = z.object({
  title: z.string().max(200).optional(),
  phases: z.array(PhaseSchema),
})

export async function saveTimeline(data: { title?: string; phases: Phase[] }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const parsed = SaveTimelineSchema.parse(data)
  const timeline = await prisma.timeline.create({
    data: {
      userId: session.user.id,
      title: parsed.title ?? null,
      phases: JSON.stringify(parsed.phases),
    },
  })
  revalidatePath('/timeline')
  return timeline
}

export async function updateTimeline(id: string, data: { title?: string; phases: Phase[] }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const timeline = await prisma.timeline.findUnique({ where: { id } })
  if (!timeline || timeline.userId !== session.user.id) throw new Error('Not found')

  const parsed = SaveTimelineSchema.parse(data)
  const updated = await prisma.timeline.update({
    where: { id },
    data: {
      title: parsed.title ?? null,
      phases: JSON.stringify(parsed.phases),
    },
  })
  revalidatePath(`/timeline/${id}`)
  return updated
}

export async function setTimelineVisibility(
  id: string,
  visibility: TimelineVisibility
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const timeline = await prisma.timeline.findUnique({ where: { id } })
  if (!timeline || timeline.userId !== session.user.id) throw new Error('Not found')

  let slug = timeline.slug
  if ((visibility === 'PUBLIC' || visibility === 'UNLISTED') && !slug) {
    slug = nanoid(10)
  }

  const updated = await prisma.timeline.update({
    where: { id },
    data: { visibility, slug },
  })
  revalidatePath(`/timeline/${id}`)
  return updated
}

export async function deleteTimeline(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const timeline = await prisma.timeline.findUnique({ where: { id } })
  if (!timeline || timeline.userId !== session.user.id) throw new Error('Not found')

  await prisma.timeline.delete({ where: { id } })
  revalidatePath('/timeline')
}
```

**Step 2: Write `lib/actions/user.ts`**
```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const UsernameSchema = z.string()
  .min(3).max(30)
  .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only')

export async function setUsername(username: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')

  const parsed = UsernameSchema.parse(username.toLowerCase())

  const existing = await prisma.user.findUnique({ where: { username: parsed } })
  if (existing && existing.id !== session.user.id) {
    throw new Error('Username already taken')
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { username: parsed },
  })
  revalidatePath(`/u/${parsed}`)
  return user
}
```

**Step 3: Commit**
```bash
git add .
git commit -m "feat: add server actions for timeline and user"
```

---

## Task 8: App Layout + Navigation

**Files:**
- Create: `app/layout.tsx`
- Create: `components/nav.tsx`
- Create: `components/providers.tsx`

**Step 1: Write `components/providers.tsx`**
```tsx
'use client'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
```

**Step 2: Write `components/nav.tsx`**
```tsx
import Link from 'next/link'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/auth'

export async function Nav() {
  const session = await auth()

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-emerald-400 text-lg tracking-tight">
          SignificantHobbies
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/explore">
            <Button variant="ghost" size="sm" className="text-slate-400">Explore</Button>
          </Link>
          <Link href="/hobbies">
            <Button variant="ghost" size="sm" className="text-slate-400">Discover</Button>
          </Link>
          {session?.user ? (
            <>
              <Link href="/timeline/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">New Timeline</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? ''} />
                    <AvatarFallback>{session.user.name?.[0] ?? 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                  {session.user.username && (
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${session.user.username}`}>My Profile</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
                      <button type="submit" className="w-full text-left">Sign out</button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="border-slate-700">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
```

**Step 3: Update `app/layout.tsx`**
```tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Nav } from '@/components/nav'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SignificantHobbies — Your Hobby Journey',
  description: 'Map your hobby history across life phases, discover insights, and find your next passion.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-slate-950 text-slate-100 min-h-screen`}>
        <Providers>
          <Nav />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
```

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add app layout, nav, and providers"
```

---

## Task 9: Login Page

**Files:**
- Create: `app/login/page.tsx`

**Step 1: Write `app/login/page.tsx`**
```tsx
import { signIn } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect('/')

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-400">Welcome back</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to save your hobby timeline and share your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/' })
            }}
          >
            <Button type="submit" className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </form>
          <p className="text-xs text-center text-slate-500">
            Or{' '}
            <a href="/timeline/new" className="text-emerald-400 hover:underline">
              continue as guest
            </a>{' '}
            — export without saving
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add app/login
git commit -m "feat: add login page with Google OAuth"
```

---

## Task 10: Username Setup

**Files:**
- Create: `app/setup/page.tsx`
- Modify: `auth.ts` (add redirect logic)

**Step 1: Write `app/setup/page.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setUsername } from '@/lib/actions/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SetupPage() {
  const [username, setUsernameVal] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await setUsername(username)
      toast.success('Username set!')
      router.push(`/u/${username}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-emerald-400">Choose your username</CardTitle>
          <CardDescription className="text-slate-400">
            Your profile will be at <span className="text-slate-300">significanthobbies.com/u/<span className="text-emerald-400">{username || 'username'}</span></span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                value={username}
                onChange={e => setUsernameVal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-username"
                className="bg-slate-800 border-slate-700"
                minLength={3}
                maxLength={30}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, hyphens</p>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500"
              disabled={loading || username.length < 3}
            >
              {loading ? 'Saving...' : 'Set username'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Update `auth.ts` callbacks to redirect new users to setup**
```ts
// In callbacks, add:
async signIn({ user, account }) {
  // Check if user needs username setup — handled in Nav/middleware
  return true
},
```

**Step 3: Update Nav to prompt username setup if missing**

In `components/nav.tsx` add after DropdownMenu items:
```tsx
{!session.user.username && (
  <Link href="/setup">
    <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-400">
      Set username
    </Button>
  </Link>
)}
```

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add username setup flow"
```

---

## Task 11: Timeline Builder — Core UI

**Files:**
- Create: `app/timeline/new/page.tsx`
- Create: `components/timeline-builder/builder.tsx`
- Create: `components/timeline-builder/phase-card.tsx`
- Create: `components/timeline-builder/hobby-input.tsx`

**Step 1: Write `components/timeline-builder/hobby-input.tsx`**
```tsx
'use client'

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { HobbyEntry } from '@/lib/types'

interface Props {
  hobbies: HobbyEntry[]
  onChange: (hobbies: HobbyEntry[]) => void
}

export function HobbyInput({ hobbies, onChange }: Props) {
  const [input, setInput] = useState('')

  function addHobbies(raw: string) {
    const names = raw.split(',').map(s => s.trim()).filter(Boolean)
    const existing = new Set(hobbies.map(h => h.name.toLowerCase()))
    const newHobbies = names
      .filter(name => !existing.has(name.toLowerCase()))
      .map(name => ({ name }))
    if (newHobbies.length) onChange([...hobbies, ...newHobbies])
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addHobbies(input)
    }
  }

  function removeHobby(name: string) {
    onChange(hobbies.filter(h => h.name !== name))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add hobbies (comma-separated, Enter to add)"
          className="bg-slate-800 border-slate-700 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addHobbies(input)}
          className="border-slate-700 shrink-0"
        >
          Add
        </Button>
      </div>
      {hobbies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hobbies.map(hobby => (
            <Badge
              key={hobby.name}
              variant="secondary"
              className="bg-emerald-900/40 text-emerald-300 border border-emerald-800 pr-1 flex items-center gap-1"
            >
              {hobby.name}
              <button onClick={() => removeHobby(hobby.name)} className="hover:text-white ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Write `components/timeline-builder/phase-card.tsx`**
```tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { HobbyInput } from './hobby-input'
import type { Phase } from '@/lib/types'

interface Props {
  phase: Phase
  onChange: (phase: Phase) => void
  onDelete: () => void
}

export function PhaseCard({ phase, onChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: phase.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              {...attributes}
              {...listeners}
              className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <Input
              value={phase.label}
              onChange={e => onChange({ ...phase, label: e.target.value })}
              placeholder="Phase name (e.g. Childhood, College)"
              className="bg-slate-800 border-slate-700 font-medium flex-1"
            />
            <button onClick={() => setExpanded(e => !e)} className="text-slate-500 hover:text-slate-300">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button onClick={onDelete} className="text-slate-500 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {expanded && (
            <div className="space-y-3 ml-7">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Age range</label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={phase.ageStart ?? ''}
                      onChange={e => onChange({ ...phase, ageStart: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="From"
                      className="bg-slate-800 border-slate-700 text-sm"
                    />
                    <span className="text-slate-500 text-sm">–</span>
                    <Input
                      type="number"
                      value={phase.ageEnd ?? ''}
                      onChange={e => onChange({ ...phase, ageEnd: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="To"
                      className="bg-slate-800 border-slate-700 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Year range</label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={phase.yearStart ?? ''}
                      onChange={e => onChange({ ...phase, yearStart: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="From"
                      className="bg-slate-800 border-slate-700 text-sm"
                    />
                    <span className="text-slate-500 text-sm">–</span>
                    <Input
                      type="number"
                      value={phase.yearEnd ?? ''}
                      onChange={e => onChange({ ...phase, yearEnd: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="To"
                      className="bg-slate-800 border-slate-700 text-sm"
                    />
                  </div>
                </div>
              </div>
              <HobbyInput
                hobbies={phase.hobbies}
                onChange={hobbies => onChange({ ...phase, hobbies })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Write `components/timeline-builder/builder.tsx`**
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhaseCard } from './phase-card'
import { saveTimeline, updateTimeline } from '@/lib/actions/timeline'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Phase } from '@/lib/types'
import { nanoid } from 'nanoid'

const STORAGE_KEY = 'sh_draft_timeline'

interface Props {
  initialPhases?: Phase[]
  initialTitle?: string
  timelineId?: string
  isLoggedIn: boolean
}

export function TimelineBuilder({ initialPhases, initialTitle, timelineId, isLoggedIn }: Props) {
  const [title, setTitle] = useState(initialTitle ?? '')
  const [phases, setPhases] = useState<Phase[]>(initialPhases ?? [])
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Autosave to localStorage for guests
  useEffect(() => {
    if (!isLoggedIn && !timelineId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, phases }))
    }
  }, [title, phases, isLoggedIn, timelineId])

  // Load draft from localStorage
  useEffect(() => {
    if (!isLoggedIn && !timelineId && phases.length === 0) {
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft) {
        try {
          const { title: t, phases: p } = JSON.parse(draft)
          setTitle(t ?? '')
          setPhases(p ?? [])
        } catch {}
      }
    }
  }, [])

  function addPhase() {
    const newPhase: Phase = {
      id: nanoid(),
      label: '',
      hobbies: [],
      order: phases.length,
    }
    setPhases(prev => [...prev, newPhase])
  }

  function updatePhase(id: string, updated: Phase) {
    setPhases(prev => prev.map(p => p.id === id ? updated : p))
  }

  function deletePhase(id: string) {
    setPhases(prev => prev.filter(p => p.id !== id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPhases(prev => {
        const oldIndex = prev.findIndex(p => p.id === active.id)
        const newIndex = prev.findIndex(p => p.id === over.id)
        return arrayMove(prev, oldIndex, newIndex).map((p, i) => ({ ...p, order: i }))
      })
    }
  }

  async function handleSave() {
    if (!isLoggedIn) {
      toast.info('Sign in to save your timeline to your profile')
      router.push('/login')
      return
    }
    setSaving(true)
    try {
      if (timelineId) {
        await updateTimeline(timelineId, { title, phases })
        toast.success('Timeline updated')
      } else {
        const tl = await saveTimeline({ title, phases })
        localStorage.removeItem(STORAGE_KEY)
        toast.success('Timeline saved!')
        router.push(`/timeline/${tl.id}`)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleExportJSON() {
    const data = JSON.stringify({ title, phases }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'timeline'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Name your timeline (optional)"
          className="bg-slate-900 border-slate-700 text-xl font-semibold h-12"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={phases.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {phases.map(phase => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onChange={updated => updatePhase(phase.id, updated)}
                onDelete={() => deletePhase(phase.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        onClick={addPhase}
        variant="outline"
        className="w-full border-dashed border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-700"
      >
        + Add Phase
      </Button>

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving || phases.length === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500"
        >
          {saving ? 'Saving...' : isLoggedIn ? 'Save Timeline' : 'Sign in to Save'}
        </Button>
        <Button onClick={handleExportJSON} variant="outline" className="border-slate-700">
          Export JSON
        </Button>
      </div>

      {!isLoggedIn && phases.length > 0 && (
        <p className="text-xs text-center text-slate-500">
          Draft auto-saved locally. <a href="/login" className="text-emerald-400 hover:underline">Sign in</a> to save to your profile.
        </p>
      )}
    </div>
  )
}
```

**Step 4: Write `app/timeline/new/page.tsx`**
```tsx
import { auth } from '@/auth'
import { TimelineBuilder } from '@/components/timeline-builder/builder'

export default async function NewTimelinePage() {
  const session = await auth()
  return (
    <>
      <div className="border-b border-slate-800 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-slate-200">Build your timeline</h1>
          <p className="text-sm text-slate-500">Add life phases and the hobbies you had during each one</p>
        </div>
      </div>
      <TimelineBuilder isLoggedIn={!!session?.user} />
    </>
  )
}
```

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add timeline builder with drag/drop and localStorage autosave"
```

---

## Task 12: Timeline Visualization Components

**Files:**
- Create: `components/timeline-view/persistence-grid.tsx`
- Create: `components/timeline-view/insights-panel.tsx`
- Create: `components/timeline-view/phase-swimlane.tsx`

**Step 1: Write `components/timeline-view/phase-swimlane.tsx`**
```tsx
import { Badge } from '@/components/ui/badge'
import type { Phase } from '@/lib/types'

interface Props { phases: Phase[] }

export function PhaseSwimlane({ phases }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 pb-4 min-w-max">
        {phases.map((phase, i) => (
          <div key={phase.id} className="relative">
            {/* Connector line */}
            {i < phases.length - 1 && (
              <div className="absolute top-6 right-0 w-4 h-0.5 bg-slate-700 translate-x-full z-10" />
            )}
            <div className="w-52 rounded-xl bg-slate-900 border border-slate-700 p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-slate-200 text-sm">{phase.label || 'Unnamed phase'}</h3>
                {(phase.ageStart || phase.ageEnd) && (
                  <p className="text-xs text-slate-500">
                    Age {phase.ageStart ?? '?'}–{phase.ageEnd ?? '?'}
                  </p>
                )}
                {(phase.yearStart || phase.yearEnd) && (
                  <p className="text-xs text-slate-500">
                    {phase.yearStart ?? '?'}–{phase.yearEnd ?? '?'}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {phase.hobbies.map(h => (
                  <Badge
                    key={h.name}
                    variant="secondary"
                    className="text-xs bg-emerald-900/30 text-emerald-300 border border-emerald-800/50"
                  >
                    {h.name}
                    {h.intensity && (
                      <span className="ml-1 opacity-60">{'★'.repeat(h.intensity)}</span>
                    )}
                  </Badge>
                ))}
                {phase.hobbies.length === 0 && (
                  <span className="text-xs text-slate-600 italic">No hobbies</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Write `components/timeline-view/persistence-grid.tsx`**
```tsx
import type { Phase } from '@/lib/types'

interface Props { phases: Phase[] }

export function PersistenceGrid({ phases }: Props) {
  const allHobbies = [...new Set(phases.flatMap(p => p.hobbies.map(h => h.name)))]

  if (allHobbies.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 text-slate-500 font-normal min-w-32">Hobby</th>
            {phases.map(p => (
              <th key={p.id} className="px-2 py-2 text-center text-slate-400 font-medium max-w-24 truncate" title={p.label}>
                <span className="block truncate max-w-20">{p.label || '—'}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allHobbies.map(hobby => (
            <tr key={hobby} className="border-t border-slate-800/50">
              <td className="py-1.5 pr-4 text-slate-300 font-medium">{hobby}</td>
              {phases.map(phase => {
                const entry = phase.hobbies.find(h => h.name === hobby)
                const intensity = entry?.intensity ?? (entry ? 3 : 0)
                return (
                  <td key={phase.id} className="px-2 py-1.5 text-center">
                    {entry ? (
                      <div
                        className="w-6 h-6 rounded mx-auto"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${0.2 + intensity * 0.15})`,
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                        title={`Intensity: ${intensity}/5`}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded mx-auto bg-slate-800/30" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 3: Write `components/timeline-view/insights-panel.tsx`**
```tsx
import { computeInsights } from '@/lib/insights'
import { Badge } from '@/components/ui/badge'
import type { Phase } from '@/lib/types'

interface Props { phases: Phase[] }

export function InsightsPanel({ phases }: Props) {
  if (phases.length < 2) {
    return (
      <p className="text-slate-500 text-sm">Add at least 2 phases to see insights.</p>
    )
  }

  const insights = computeInsights(phases)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {insights.rekindled.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-amber-400 mb-2">🔥 Rekindled</h4>
          <div className="flex flex-wrap gap-1.5">
            {insights.rekindled.map(h => (
              <Badge key={h} className="bg-amber-900/30 text-amber-300 border border-amber-800/50">{h}</Badge>
            ))}
          </div>
        </div>
      )}

      {insights.mostPersistent.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-emerald-400 mb-2">💎 Most Persistent</h4>
          <div className="space-y-1.5">
            {insights.mostPersistent.slice(0, 5).map(({ hobby, count }) => (
              <div key={hobby} className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">{hobby}</span>
                <span className="text-xs text-slate-500">{count} phases</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">📈 Per Phase</h4>
        <div className="space-y-2">
          {phases.map((phase, i) => {
            const added = insights.addedPerPhase[i] ?? []
            const dropped = insights.droppedPerPhase[i] ?? []
            if (i === 0 || (added.length === 0 && dropped.length === 0)) return null
            return (
              <div key={phase.id} className="text-xs">
                <span className="text-slate-400 font-medium">{phase.label}</span>
                <div className="flex gap-3 mt-0.5">
                  {added.length > 0 && <span className="text-emerald-400">+{added.length} added</span>}
                  {dropped.length > 0 && <span className="text-red-400">−{dropped.length} dropped</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {insights.coOccurrencePairs.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <h4 className="text-sm font-semibold text-purple-400 mb-2">🔗 Often Together</h4>
          <div className="space-y-1">
            {insights.coOccurrencePairs.slice(0, 5).map(({ pair, count }) => (
              <div key={pair.join(',')} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{pair[0]} + {pair[1]}</span>
                <span className="text-slate-500">{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add timeline visualization components"
```

---

## Task 13: Export Card + PNG Export

**Files:**
- Create: `components/timeline-view/export-card.tsx`
- Create: `components/timeline-view/export-button.tsx`

**Step 1: Write `components/timeline-view/export-card.tsx`**
```tsx
import type { Phase } from '@/lib/types'
import { computeInsights } from '@/lib/insights'

interface Props {
  title: string | null
  phases: Phase[]
  authorName?: string | null
}

export function ExportCard({ title, phases, authorName }: Props) {
  const insights = phases.length >= 2 ? computeInsights(phases) : null
  const totalHobbies = new Set(phases.flatMap(p => p.hobbies.map(h => h.name))).size

  return (
    <div
      id="export-card"
      style={{ width: 1200, height: 630, fontFamily: 'system-ui, sans-serif' }}
      className="relative overflow-hidden flex flex-col"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f172a 100%)',
        }}
      />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 20%, #059669 0%, transparent 40%)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-1">SignificantHobbies</p>
            <h1 className="text-white text-4xl font-bold">{title || 'My Hobby Journey'}</h1>
            {authorName && <p className="text-slate-400 mt-1">by {authorName}</p>}
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-emerald-400">{phases.length}</div>
            <div className="text-slate-400 text-sm">life phases</div>
            <div className="text-2xl font-semibold text-slate-200 mt-2">{totalHobbies}</div>
            <div className="text-slate-400 text-sm">total hobbies</div>
          </div>
        </div>

        {/* Phase timeline */}
        <div className="flex gap-3 flex-1 items-start overflow-hidden">
          {phases.slice(0, 6).map((phase, i) => (
            <div
              key={phase.id}
              className="flex-1 min-w-0 rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-emerald-400 text-xs font-semibold mb-1 truncate">{phase.label}</div>
              {(phase.ageStart || phase.yearStart) && (
                <div className="text-slate-500 text-xs mb-2">
                  {phase.ageStart ? `Age ${phase.ageStart}` : ''}{phase.yearStart ? ` (${phase.yearStart})` : ''}
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {phase.hobbies.slice(0, 4).map(h => (
                  <span
                    key={h.name}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: 11 }}
                  >
                    {h.name}
                  </span>
                ))}
                {phase.hobbies.length > 4 && (
                  <span style={{ color: '#64748b', fontSize: 11 }}>+{phase.hobbies.length - 4}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between mt-6">
          <div className="flex gap-6">
            {insights?.rekindled && insights.rekindled.length > 0 && (
              <div>
                <div className="text-amber-400 text-xs font-semibold mb-1">🔥 Rekindled</div>
                <div className="text-white text-sm">{insights.rekindled.slice(0, 3).join(', ')}</div>
              </div>
            )}
            {insights?.mostPersistent && insights.mostPersistent.length > 0 && (
              <div>
                <div className="text-emerald-400 text-xs font-semibold mb-1">💎 Most persistent</div>
                <div className="text-white text-sm">{insights.mostPersistent[0]?.hobby}</div>
              </div>
            )}
          </div>
          <div className="text-slate-600 text-xs">significanthobbies.com</div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Write `components/timeline-view/export-button.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

export function ExportPNGButton() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    const node = document.getElementById('export-card')
    if (!node) return
    setExporting(true)
    try {
      const dataUrl = await toPng(node, { quality: 0.95, pixelRatio: 1 })
      const a = document.createElement('a')
      a.download = 'hobby-timeline.png'
      a.href = dataUrl
      a.click()
    } catch {
      toast.error('Export failed — try again')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline" className="border-slate-700">
      <Download className="h-4 w-4 mr-2" />
      {exporting ? 'Exporting...' : 'Export PNG'}
    </Button>
  )
}
```

**Step 3: Commit**
```bash
git add .
git commit -m "feat: add export card and PNG export"
```

---

## Task 14: Timeline View Page

**Files:**
- Create: `app/timeline/[id]/page.tsx`
- Create: `app/timeline/[id]/edit/page.tsx`

**Step 1: Write `app/timeline/[id]/page.tsx`**
```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { PhaseSwimlane } from '@/components/timeline-view/phase-swimlane'
import { PersistenceGrid } from '@/components/timeline-view/persistence-grid'
import { InsightsPanel } from '@/components/timeline-view/insights-panel'
import { ExportCard } from '@/components/timeline-view/export-card'
import { ExportPNGButton } from '@/components/timeline-view/export-button'
import { VisibilityToggle } from '@/components/timeline-view/visibility-toggle'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import type { Phase } from '@/lib/types'

export default async function TimelinePage({ params }: { params: { id: string } }) {
  const session = await auth()
  const timeline = await prisma.timeline.findUnique({ where: { id: params.id }, include: { user: true } })

  if (!timeline) notFound()
  if (timeline.userId !== session?.user?.id) redirect(`/t/${timeline.slug ?? params.id}`)

  const phases: Phase[] = JSON.parse(timeline.phases as string)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{timeline.title || 'My Timeline'}</h1>
          <p className="text-slate-500 text-sm mt-1">{phases.length} phases · {new Set(phases.flatMap(p => p.hobbies.map(h => h.name))).size} hobbies</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <VisibilityToggle timelineId={timeline.id} visibility={timeline.visibility as any} slug={timeline.slug} />
          <Link href={`/timeline/${timeline.id}/edit`}>
            <Button variant="outline" size="sm" className="border-slate-700">Edit</Button>
          </Link>
          <ExportPNGButton />
        </div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="bg-slate-900 border border-slate-700">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="export">Export Card</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <PhaseSwimlane phases={phases} />
        </TabsContent>
        <TabsContent value="grid" className="mt-4">
          <PersistenceGrid phases={phases} />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <InsightsPanel phases={phases} />
        </TabsContent>
        <TabsContent value="export" className="mt-4">
          <div className="overflow-x-auto">
            <ExportCard title={timeline.title} phases={phases} authorName={timeline.user?.name} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Step 2: Write `components/timeline-view/visibility-toggle.tsx`**
```tsx
'use client'

import { useState } from 'react'
import { setTimelineVisibility } from '@/lib/actions/timeline'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Lock, Link2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { TimelineVisibility } from '@/lib/types'

interface Props {
  timelineId: string
  visibility: TimelineVisibility
  slug: string | null
}

export function VisibilityToggle({ timelineId, visibility: initial, slug: initialSlug }: Props) {
  const [visibility, setVis] = useState(initial)
  const [slug, setSlug] = useState(initialSlug)
  const [copied, setCopied] = useState(false)

  async function handleChange(v: TimelineVisibility) {
    try {
      const updated = await setTimelineVisibility(timelineId, v)
      setVis(v)
      setSlug(updated.slug)
      toast.success(`Visibility set to ${v.toLowerCase()}`)
    } catch {
      toast.error('Failed to update visibility')
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/t/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copied!')
  }

  const icon = visibility === 'PUBLIC' ? Globe : visibility === 'UNLISTED' ? Link2 : Lock

  return (
    <div className="flex items-center gap-2">
      {(visibility === 'PUBLIC' || visibility === 'UNLISTED') && slug && (
        <Button variant="ghost" size="sm" onClick={copyLink} className="text-slate-400 hover:text-emerald-400">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="border-slate-700 gap-2">
            {<icon.prototype.constructor className="h-4 w-4" />}
            {/* simpler: */}
            <span>{visibility === 'PUBLIC' ? '🌍' : visibility === 'UNLISTED' ? '🔗' : '🔒'}</span>
            {visibility.charAt(0) + visibility.slice(1).toLowerCase()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-slate-900 border-slate-700">
          <DropdownMenuItem onClick={() => handleChange('PRIVATE')}>🔒 Private</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChange('UNLISTED')}>🔗 Unlisted (link only)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleChange('PUBLIC')}>🌍 Public</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

**Step 3: Write `app/timeline/[id]/edit/page.tsx`**
```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TimelineBuilder } from '@/components/timeline-builder/builder'
import type { Phase } from '@/lib/types'

export default async function EditTimelinePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const timeline = await prisma.timeline.findUnique({ where: { id: params.id } })
  if (!timeline || timeline.userId !== session.user.id) notFound()

  const phases: Phase[] = JSON.parse(timeline.phases as string)

  return (
    <>
      <div className="border-b border-slate-800 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-slate-200">Edit timeline</h1>
        </div>
      </div>
      <TimelineBuilder
        initialPhases={phases}
        initialTitle={timeline.title ?? ''}
        timelineId={timeline.id}
        isLoggedIn
      />
    </>
  )
}
```

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add timeline view and edit pages"
```

---

## Task 15: Share Page `/t/[slug]`

**Files:**
- Create: `app/t/[slug]/page.tsx`

**Step 1: Write `app/t/[slug]/page.tsx`**
```tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PhaseSwimlane } from '@/components/timeline-view/phase-swimlane'
import { PersistenceGrid } from '@/components/timeline-view/persistence-grid'
import { InsightsPanel } from '@/components/timeline-view/insights-panel'
import { ExportCard } from '@/components/timeline-view/export-card'
import { ExportPNGButton } from '@/components/timeline-view/export-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import type { Phase } from '@/lib/types'

export default async function SharePage({ params }: { params: { slug: string } }) {
  const timeline = await prisma.timeline.findUnique({
    where: { slug: params.slug },
    include: { user: { select: { name: true, image: true, username: true } } },
  })

  if (!timeline || timeline.visibility === 'PRIVATE') notFound()

  const phases: Phase[] = JSON.parse(timeline.phases as string)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{timeline.title || 'Hobby Timeline'}</h1>
          {timeline.user && (
            <Link href={`/u/${timeline.user.username}`} className="flex items-center gap-2 mt-2 hover:opacity-80">
              <Avatar className="h-6 w-6">
                <AvatarImage src={timeline.user.image ?? ''} />
                <AvatarFallback>{timeline.user.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-slate-400 text-sm">@{timeline.user.username ?? timeline.user.name}</span>
            </Link>
          )}
        </div>
        <ExportPNGButton />
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="bg-slate-900 border border-slate-700">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="export">Export Card</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4"><PhaseSwimlane phases={phases} /></TabsContent>
        <TabsContent value="grid" className="mt-4"><PersistenceGrid phases={phases} /></TabsContent>
        <TabsContent value="insights" className="mt-4"><InsightsPanel phases={phases} /></TabsContent>
        <TabsContent value="export" className="mt-4">
          <div className="overflow-x-auto">
            <ExportCard title={timeline.title} phases={phases} authorName={timeline.user?.name} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add app/t
git commit -m "feat: add public share page /t/[slug]"
```

---

## Task 16: User Profile Page `/u/[username]`

**Files:**
- Create: `app/u/[username]/page.tsx`
- Create: `components/timeline-card.tsx`
- Create: `components/suggestions-panel.tsx`

**Step 1: Write `components/timeline-card.tsx`**
```tsx
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Phase } from '@/lib/types'

interface Props {
  id: string
  title: string | null
  slug: string | null
  phases: Phase[]
  visibility: string
}

export function TimelineCard({ id, title, slug, phases, visibility }: Props) {
  const totalHobbies = new Set(phases.flatMap(p => p.hobbies.map(h => h.name))).size
  const href = slug && visibility !== 'PRIVATE' ? `/t/${slug}` : `/timeline/${id}`

  return (
    <Link href={href}>
      <Card className="bg-slate-900 border-slate-700 hover:border-emerald-700 transition-colors cursor-pointer">
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-200 mb-1">{title || 'Untitled Timeline'}</h3>
          <p className="text-sm text-slate-500 mb-3">
            {phases.length} phases · {totalHobbies} hobbies
          </p>
          <div className="flex flex-wrap gap-1">
            {phases.slice(0, 4).map(p => (
              <Badge key={p.id} variant="outline" className="text-xs border-slate-700 text-slate-400">
                {p.label}
              </Badge>
            ))}
            {phases.length > 4 && (
              <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                +{phases.length - 4} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Step 2: Write `components/suggestions-panel.tsx`**
```tsx
import { getSuggestedHobbies } from '@/lib/hobbies'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Phase } from '@/lib/types'

interface Props { phases: Phase[] }

export function SuggestionsPanel({ phases }: Props) {
  const allHobbies = phases.flatMap(p => p.hobbies.map(h => h.name))
  if (allHobbies.length === 0) return null

  const suggestions = getSuggestedHobbies(allHobbies)
  if (suggestions.length === 0) return null

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">✨ You might enjoy next</h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map(hobby => (
          <Link key={hobby} href={`/hobbies/${encodeURIComponent(hobby.toLowerCase())}`}>
            <Badge
              variant="outline"
              className="border-emerald-800 text-emerald-400 hover:bg-emerald-900/30 cursor-pointer transition-colors"
            >
              {hobby}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Write `app/u/[username]/page.tsx`**
```tsx
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TimelineCard } from '@/components/timeline-card'
import { SuggestionsPanel } from '@/components/suggestions-panel'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Phase } from '@/lib/types'

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      timelines: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  if (!user) notFound()

  const isOwner = session?.user?.id === user.id

  const timelines = user.timelines.filter(t =>
    isOwner || t.visibility === 'PUBLIC'
  )

  const allPhases: Phase[] = timelines.flatMap(t => {
    try { return JSON.parse(t.phases as string) } catch { return [] }
  })

  const totalHobbies = new Set(allPhases.flatMap(p => p.hobbies.map(h => h.name))).size

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image ?? ''} />
          <AvatarFallback className="text-xl">{user.name?.[0] ?? 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">{user.name}</h1>
          <p className="text-slate-400">@{user.username}</p>
          <div className="flex gap-4 mt-2 text-sm text-slate-500">
            <span>{timelines.length} timelines</span>
            <span>{totalHobbies} unique hobbies</span>
          </div>
        </div>
        {isOwner && (
          <Link href="/timeline/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500" size="sm">New Timeline</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            {isOwner ? 'Your timelines' : 'Public timelines'}
          </h2>
          {timelines.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {isOwner ? (
                <>
                  <p className="mb-4">No timelines yet</p>
                  <Link href="/timeline/new">
                    <Button className="bg-emerald-600 hover:bg-emerald-500">Create your first timeline</Button>
                  </Link>
                </>
              ) : (
                <p>No public timelines yet</p>
              )}
            </div>
          ) : (
            timelines.map(t => {
              let phases: Phase[] = []
              try { phases = JSON.parse(t.phases as string) } catch {}
              return (
                <TimelineCard
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  slug={t.slug}
                  phases={phases}
                  visibility={t.visibility}
                />
              )
            })
          )}
        </div>
        <div className="space-y-4">
          {isOwner && allPhases.length > 0 && <SuggestionsPanel phases={allPhases} />}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add profile page with suggestions panel"
```

---

## Task 17: Hobby Directory

**Files:**
- Create: `app/hobbies/page.tsx`
- Create: `app/hobbies/[hobby]/page.tsx`

**Step 1: Write `app/hobbies/page.tsx`**
```tsx
import { HOBBY_CATEGORIES } from '@/lib/hobbies'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HobbiesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Discover Hobbies</h1>
        <p className="text-slate-400">Browse hobbies by category and find people who share your passions</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {HOBBY_CATEGORIES.map(category => (
          <Card key={category.name} className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{category.emoji}</span>
                <span className="text-slate-200">{category.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {category.hobbies.slice(0, 8).map(hobby => (
                  <Link key={hobby} href={`/hobbies/${encodeURIComponent(hobby.toLowerCase())}`}>
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-slate-400 hover:border-emerald-700 hover:text-emerald-400 cursor-pointer transition-colors text-xs"
                    >
                      {hobby}
                    </Badge>
                  </Link>
                ))}
                {category.hobbies.length > 8 && (
                  <span className="text-xs text-slate-600">+{category.hobbies.length - 8} more</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Write `app/hobbies/[hobby]/page.tsx`**
```tsx
import { prisma } from '@/lib/prisma'
import { HOBBY_CATEGORIES, getCategoryForHobby } from '@/lib/hobbies'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Phase } from '@/lib/types'

export default async function HobbyPage({ params }: { params: { hobby: string } }) {
  const hobbyName = decodeURIComponent(params.hobby)
  const category = getCategoryForHobby(hobbyName)

  // Find public timelines containing this hobby
  const timelines = await prisma.timeline.findMany({
    where: { visibility: 'PUBLIC' },
    include: { user: { select: { name: true, username: true, image: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  })

  const matching = timelines.filter(t => {
    try {
      const phases: Phase[] = JSON.parse(t.phases as string)
      return phases.some(p => p.hobbies.some(h => h.name.toLowerCase() === hobbyName.toLowerCase()))
    } catch { return false }
  })

  // Get display name (capitalize)
  const displayName = hobbyName.charAt(0).toUpperCase() + hobbyName.slice(1)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        {category && (
          <Link href="/hobbies" className="text-sm text-slate-500 hover:text-slate-300 mb-2 block">
            ← {category.emoji} {category.name}
          </Link>
        )}
        <h1 className="text-3xl font-bold text-slate-100 mb-2">{displayName}</h1>
        {category && (
          <Badge className="bg-slate-800 text-slate-300 border-slate-700">
            {category.emoji} {category.name}
          </Badge>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          {matching.length} people track this hobby
        </h2>
        {matching.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No public timelines with {displayName} yet.</p>
            <Link href="/timeline/new" className="text-emerald-400 hover:underline mt-2 block">
              Be the first →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matching.map(t => {
              let phases: Phase[] = []
              try { phases = JSON.parse(t.phases as string) } catch {}
              const href = `/t/${t.slug}`

              return (
                <Link key={t.id} href={href}>
                  <Card className="bg-slate-900 border-slate-700 hover:border-emerald-700 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={t.user?.image ?? ''} />
                          <AvatarFallback>{t.user?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-slate-300">@{t.user?.username ?? t.user?.name}</span>
                      </div>
                      <h3 className="font-medium text-slate-200 text-sm mb-1">{t.title || 'Hobby Timeline'}</h3>
                      <p className="text-xs text-slate-500">{phases.length} phases</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Commit**
```bash
git add app/hobbies
git commit -m "feat: add hobby directory and hobby pages"
```

---

## Task 18: Landing Page

**Files:**
- Create: `app/page.tsx`
- Create: `components/demo-timeline-card.tsx`

**Step 1: Write `app/page.tsx`**
```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { TimelineCard } from '@/components/timeline-card'
import type { Phase } from '@/lib/types'

export default async function LandingPage() {
  // Fetch 3 demo (public) timelines for the gallery
  const demos = await prisma.timeline.findMany({
    where: { visibility: 'PUBLIC' },
    include: { user: { select: { name: true, username: true, image: true } } },
    orderBy: { createdAt: 'asc' },
    take: 3,
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-800/50 rounded-full px-4 py-1.5 text-sm text-emerald-400 mb-6">
            ✨ Map your hobby journey
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-100 leading-tight mb-6">
            Your hobbies tell a{' '}
            <span className="text-emerald-400">significant</span>{' '}
            story
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
            Map your hobby history across life phases. Discover what rekindled, what persisted, and what to explore next.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/timeline/new">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8">
                Build your timeline
              </Button>
            </Link>
            <Link href="/hobbies">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 px-8">
                Explore hobbies
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-600 mt-4">No sign-up required to start</p>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 px-4 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: '🗺️', title: 'Map your journey', desc: 'Build life phases from childhood to now. Add every hobby, interest, and passion along the way.' },
              { icon: '💡', title: 'Discover insights', desc: 'See rekindled hobbies, what stuck across decades, and patterns you never noticed.' },
              { icon: '✨', title: 'Find what\'s next', desc: 'Get personalized suggestions based on your hobby history and browse what others explore.' },
            ].map(f => (
              <div key={f.title} className="text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-200 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo gallery */}
      {demos.length > 0 && (
        <section className="py-16 px-4 border-t border-slate-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Community timelines</h2>
            <p className="text-slate-400 mb-8">Real hobby journeys shared by the community</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {demos.map(t => {
                let phases: Phase[] = []
                try { phases = JSON.parse(t.phases as string) } catch {}
                return (
                  <TimelineCard
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    slug={t.slug}
                    phases={phases}
                    visibility={t.visibility}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-4 border-t border-slate-800 text-center">
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to map your story?</h2>
        <p className="text-slate-400 mb-8">Takes 5 minutes. Export a shareable card when you're done.</p>
        <Link href="/timeline/new">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 px-10">
            Start for free
          </Button>
        </Link>
      </section>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add app/page.tsx
git commit -m "feat: add landing page"
```

---

## Task 19: Explore Coming Soon Page

**Files:**
- Create: `app/explore/page.tsx`

**Step 1: Write `app/explore/page.tsx`**
```tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ExplorePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-3xl font-bold text-slate-100 mb-3">Explore Trends</h1>
        <p className="text-slate-400 mb-2">
          Discover what hobbies people pick up in their 20s, what gets dropped, and what comes back.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          We're building this now. Come back soon — it's going to be good.
        </p>
        <div className="inline-flex items-center gap-2 bg-emerald-900/20 border border-emerald-800/40 rounded-full px-4 py-1.5 text-sm text-emerald-500 mb-8">
          Coming soon
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/timeline/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500">Build your timeline</Button>
          </Link>
          <Link href="/hobbies">
            <Button variant="outline" className="border-slate-700">Browse hobbies</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add app/explore
git commit -m "feat: add explore coming soon page"
```

---

## Task 20: Seed Script

**Files:**
- Create: `prisma/seed.ts`

**Step 1: Write `prisma/seed.ts`**
```ts
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

const demoTimelines = [
  {
    title: 'A life through music and movement',
    phases: [
      { id: 'p1', label: 'Childhood', ageStart: 6, ageEnd: 12, order: 0, hobbies: [{ name: 'Piano', intensity: 3 }, { name: 'Swimming', intensity: 4 }, { name: 'Drawing', intensity: 2 }] },
      { id: 'p2', label: 'Teenager', ageStart: 13, ageEnd: 17, order: 1, hobbies: [{ name: 'Guitar', intensity: 5 }, { name: 'Swimming', intensity: 3 }, { name: 'Gaming', intensity: 4 }, { name: 'Skateboarding', intensity: 3 }] },
      { id: 'p3', label: 'College', ageStart: 18, ageEnd: 22, order: 2, hobbies: [{ name: 'Guitar', intensity: 4 }, { name: 'Running', intensity: 3 }, { name: 'Gaming', intensity: 3 }, { name: 'Cooking', intensity: 2 }] },
      { id: 'p4', label: 'Early career', ageStart: 23, ageEnd: 28, order: 3, hobbies: [{ name: 'Running', intensity: 5 }, { name: 'Cooking', intensity: 4 }, { name: 'Reading', intensity: 3 }, { name: 'Piano', intensity: 2 }] },
      { id: 'p5', label: 'Now', ageStart: 29, ageEnd: 32, order: 4, hobbies: [{ name: 'Running', intensity: 4 }, { name: 'Cooking', intensity: 5 }, { name: 'Reading', intensity: 4 }, { name: 'Guitar', intensity: 3 }, { name: 'Yoga', intensity: 3 }] },
    ],
  },
  {
    title: 'The curious mind\'s journey',
    phases: [
      { id: 'q1', label: 'Early years', ageStart: 7, ageEnd: 11, order: 0, hobbies: [{ name: 'Reading', intensity: 5 }, { name: 'Lego', intensity: 4 }, { name: 'Chess', intensity: 3 }] },
      { id: 'q2', label: 'School', ageStart: 12, ageEnd: 17, order: 1, hobbies: [{ name: 'Reading', intensity: 5 }, { name: 'Coding', intensity: 4 }, { name: 'Chess', intensity: 4 }, { name: 'Debate club', intensity: 3 }] },
      { id: 'q3', label: 'University', ageStart: 18, ageEnd: 22, order: 2, hobbies: [{ name: 'Coding', intensity: 5 }, { name: 'Philosophy', intensity: 4 }, { name: 'Hiking', intensity: 3 }] },
      { id: 'q4', label: 'Working', ageStart: 23, ageEnd: 30, order: 3, hobbies: [{ name: 'Coding', intensity: 4 }, { name: 'Reading', intensity: 5 }, { name: 'Woodworking', intensity: 3 }, { name: 'Chess', intensity: 3 }] },
    ],
  },
  {
    title: 'Creative seasons',
    phases: [
      { id: 'r1', label: 'Childhood', ageStart: 5, ageEnd: 12, order: 0, hobbies: [{ name: 'Painting', intensity: 5 }, { name: 'Dance', intensity: 4 }, { name: 'Origami', intensity: 3 }] },
      { id: 'r2', label: 'Teens', ageStart: 13, ageEnd: 18, order: 1, hobbies: [{ name: 'Photography', intensity: 4 }, { name: 'Writing', intensity: 5 }, { name: 'Dance', intensity: 3 }] },
      { id: 'r3', label: '20s', ageStart: 19, ageEnd: 27, order: 2, hobbies: [{ name: 'Writing', intensity: 4 }, { name: 'Film photography', intensity: 5 }, { name: 'Ceramics', intensity: 3 }, { name: 'Yoga', intensity: 4 }] },
      { id: 'r4', label: '30s', ageStart: 28, ageEnd: 35, order: 3, hobbies: [{ name: 'Painting', intensity: 5 }, { name: 'Writing', intensity: 3 }, { name: 'Yoga', intensity: 5 }, { name: 'Ceramics', intensity: 4 }] },
    ],
  },
]

async function main() {
  console.log('Seeding...')

  // Create demo users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo1@significanthobbies.demo' },
      update: {},
      create: {
        email: 'demo1@significanthobbies.demo',
        name: 'Alex Rivera',
        username: 'alexrivera',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      },
    }),
    prisma.user.upsert({
      where: { email: 'demo2@significanthobbies.demo' },
      update: {},
      create: {
        email: 'demo2@significanthobbies.demo',
        name: 'Sam Chen',
        username: 'samchen',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
      },
    }),
    prisma.user.upsert({
      where: { email: 'demo3@significanthobbies.demo' },
      update: {},
      create: {
        email: 'demo3@significanthobbies.demo',
        name: 'Jordan Lee',
        username: 'jordanlee',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
      },
    }),
  ])

  // Create demo timelines
  for (let i = 0; i < demoTimelines.length; i++) {
    const demo = demoTimelines[i]
    const user = users[i]
    await prisma.timeline.upsert({
      where: { slug: `demo-${i + 1}` },
      update: {},
      create: {
        userId: user.id,
        title: demo.title,
        visibility: 'PUBLIC',
        slug: `demo-${i + 1}`,
        phases: JSON.stringify(demo.phases),
      },
    })
  }

  console.log('✅ Seeded 3 demo timelines')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Step 2: Add seed config to `package.json`**
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Step 3: Install tsx**
```bash
pnpm add -D tsx
```

**Step 4: Run seed**
```bash
pnpm prisma db seed
```

**Step 5: Commit**
```bash
git add .
git commit -m "feat: add seed script with 3 demo timelines"
```

---

## Task 21: README

**Files:**
- Create: `README.md`

**Step 1: Write README**
```markdown
# SignificantHobbies

Map your hobby history across life phases. Discover insights. Find what's next.

## Quick Start

\`\`\`bash
pnpm i
cp .env.example .env.local   # fill in values
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
\`\`\`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite file path (`file:./dev.db`) or Turso URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Turso only | Auth token from Turso dashboard |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Random string — `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | From Google Cloud Console |

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs
5. Copy Client ID and Secret to `.env.local`

## Turso (Production Database)

\`\`\`bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Create database
turso db create significanthobbies

# Get URL and token
turso db show significanthobbies --url
turso db tokens create significanthobbies
\`\`\`

## Running Tests

\`\`\`bash
pnpm test
\`\`\`

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Google sign in |
| `/timeline/new` | Build a new timeline |
| `/timeline/[id]` | View your timeline |
| `/timeline/[id]/edit` | Edit your timeline |
| `/t/[slug]` | Shared timeline (public/unlisted) |
| `/u/[username]` | User profile |
| `/hobbies` | Hobby directory |
| `/hobbies/[hobby]` | Hobby detail page |
| `/explore` | Coming soon |
\`\`\`

## Stack

- **Framework**: Next.js 14 App Router
- **Database**: Prisma + Turso (libSQL / SQLite)
- **Auth**: NextAuth v5 (Google OAuth)
- **UI**: Tailwind CSS + shadcn/ui
- **Export**: html-to-image
```

**Step 2: Commit**
```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## Final Verification Checklist

Run these to confirm everything works:

```bash
# 1. All tests pass
pnpm test

# 2. Build succeeds
pnpm build

# 3. Dev server starts
pnpm dev

# 4. Check these flows manually:
# - Visit / (landing page loads with demo timelines)
# - Visit /timeline/new (builder loads, add phases, export JSON)
# - Visit /login (Google button visible)
# - Visit /hobbies (category grid visible)
# - Visit /t/demo-1 (demo timeline visible)
# - Visit /u/alexrivera (demo profile visible)
# - Visit /explore (coming soon page)
```
