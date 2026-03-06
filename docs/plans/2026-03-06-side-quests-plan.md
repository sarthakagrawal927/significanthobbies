# Side Quests, Badges & Timeline Pins — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/side-quests` page with 3 modes (random, personalized, quest board), a badge/achievement system, timeline pins, and a blog post — creating a funnel from viral content to core product.

**Architecture:** Static quest/badge data in TS files. Client-side state in localStorage for anonymous users, synced to User model JSON fields when logged in. Timeline pins stored as a new `pins` JSON field on the Timeline model. Side quests page is a client component with tabs. Badges evaluated client-side on quest completion.

**Tech Stack:** Next.js App Router, Tailwind CSS, Prisma (SQLite/Turso), localStorage, existing component patterns (ScrollReveal, Button, Badge).

---

### Task 1: Quest & Badge Data Files

**Files:**
- Create: `src/lib/side-quests.ts`
- Create: `src/lib/badges.ts`

**Step 1: Create side-quests.ts with types and 50 quests**

```ts
// src/lib/side-quests.ts

export type QuestCategory = "sensory" | "creative" | "culinary" | "social" | "exploration" | "mindful";

export type SideQuest = {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: "easy" | "medium" | "hard";
  timeEstimate: string;
  emoji: string;
  relatedHobbies: string[];
};

export const QUEST_CATEGORIES: { id: QuestCategory; label: string; emoji: string; color: string }[] = [
  { id: "sensory", label: "Sensory", emoji: "👁️", color: "emerald" },
  { id: "creative", label: "Creative", emoji: "🎨", color: "purple" },
  { id: "culinary", label: "Culinary", emoji: "🍳", color: "amber" },
  { id: "social", label: "Social", emoji: "🤝", color: "blue" },
  { id: "exploration", label: "Exploration", emoji: "🧭", color: "teal" },
  { id: "mindful", label: "Mindful", emoji: "🧘", color: "violet" },
];

export const SIDE_QUESTS: SideQuest[] = [
  // ── Sensory (8) ──
  { id: "sq-01", title: "Sunrise walk without headphones", description: "Wake up before sunrise and walk for 20 minutes. No music, no podcasts — just the sounds around you.", category: "sensory", difficulty: "easy", timeEstimate: "30 min", emoji: "🌅", relatedHobbies: ["Hiking"] },
  { id: "sq-02", title: "Photograph textures around you", description: "Take 10 photos of interesting textures — bark, walls, fabric, cracks. Notice what you normally walk past.", category: "sensory", difficulty: "easy", timeEstimate: "30 min", emoji: "📸", relatedHobbies: ["Photography"] },
  { id: "sq-03", title: "Learn 10 constellations", description: "Download a star chart and go outside on a clear night. Find and name 10 constellations.", category: "sensory", difficulty: "medium", timeEstimate: "1 hour", emoji: "⭐", relatedHobbies: ["Stargazing", "Astronomy"] },
  { id: "sq-04", title: "Take your usual route at a different time", description: "Walk your regular commute or neighborhood route at a completely different hour. Notice how it changes.", category: "sensory", difficulty: "easy", timeEstimate: "30 min", emoji: "🚶", relatedHobbies: ["Hiking"] },
  { id: "sq-05", title: "Sit in silence for 10 minutes", description: "No phone, no music, no distractions. Just sit and observe your thoughts for 10 full minutes.", category: "sensory", difficulty: "easy", timeEstimate: "15 min", emoji: "🤫", relatedHobbies: ["Yoga"] },
  { id: "sq-06", title: "Press leaves or flowers", description: "Collect leaves or flowers from a walk and press them between book pages. Check on them in a week.", category: "sensory", difficulty: "easy", timeEstimate: "30 min", emoji: "🌸", relatedHobbies: ["Gardening", "Foraging"] },
  { id: "sq-07", title: "Map your favorite neighborhood spots", description: "Draw a hand-drawn map of your neighborhood marking your favorite places — the best coffee, the quiet bench, the good tree.", category: "sensory", difficulty: "medium", timeEstimate: "1 hour", emoji: "🗺️", relatedHobbies: ["Drawing"] },
  { id: "sq-08", title: "Listen to an album start to finish", description: "Pick an album you've never heard. Listen to the whole thing without skipping, doing nothing else.", category: "sensory", difficulty: "easy", timeEstimate: "1 hour", emoji: "🎧", relatedHobbies: ["Music theory"] },

  // ── Creative (9) ──
  { id: "sq-09", title: "Draw everyday objects for 20 minutes", description: "Grab a pen and paper. Draw whatever is on your desk or table — keys, mug, phone. No erasing.", category: "creative", difficulty: "easy", timeEstimate: "30 min", emoji: "✏️", relatedHobbies: ["Drawing"] },
  { id: "sq-10", title: "Write a letter you'll never send", description: "Write a letter to someone — past self, future self, someone you've lost touch with. Be honest. Don't send it.", category: "creative", difficulty: "easy", timeEstimate: "30 min", emoji: "✉️", relatedHobbies: ["Writing", "Poetry"] },
  { id: "sq-11", title: "Practice calligraphy for a week", description: "Get a brush pen or marker. Practice writing the alphabet beautifully for 15 minutes a day, 7 days.", category: "creative", difficulty: "medium", timeEstimate: "half day", emoji: "🖋️", relatedHobbies: ["Calligraphy"] },
  { id: "sq-12", title: "Create a playlist for this chapter of your life", description: "Build a playlist that captures exactly where you are right now. 15-20 songs. Give it a title.", category: "creative", difficulty: "easy", timeEstimate: "30 min", emoji: "🎵", relatedHobbies: ["Music production", "DJing"] },
  { id: "sq-13", title: "Memorize a short poem", description: "Find a poem under 20 lines that moves you. Memorize it so you can recite it from heart.", category: "creative", difficulty: "medium", timeEstimate: "1 hour", emoji: "📝", relatedHobbies: ["Poetry", "Reading"] },
  { id: "sq-14", title: "Build something with your hands", description: "Use whatever materials you have — cardboard, wood scraps, tape. Build something. It doesn't need to be useful.", category: "creative", difficulty: "medium", timeEstimate: "1 hour", emoji: "🔨", relatedHobbies: ["Woodworking", "3D printing"] },
  { id: "sq-15", title: "Take a self-portrait without a camera", description: "Draw, paint, or collage a self-portrait. Not a selfie — a real attempt to capture how you see yourself.", category: "creative", difficulty: "medium", timeEstimate: "1 hour", emoji: "🎨", relatedHobbies: ["Drawing", "Painting"] },
  { id: "sq-16", title: "Learn a song on any instrument", description: "Pick up whatever instrument you have access to. Learn one complete song, even if it's simple.", category: "creative", difficulty: "hard", timeEstimate: "half day", emoji: "🎸", relatedHobbies: ["Guitar", "Piano", "Ukulele"] },
  { id: "sq-17", title: "Fill one page of a sketchbook", description: "Get a sketchbook (or any blank paper). Fill one full page with anything — doodles, patterns, faces, words.", category: "creative", difficulty: "easy", timeEstimate: "30 min", emoji: "📓", relatedHobbies: ["Drawing", "Painting"] },

  // ── Culinary (8) ──
  { id: "sq-18", title: "Cook a dish from a country you've never visited", description: "Pick a country you've never been to. Find an authentic recipe online and cook it from scratch.", category: "culinary", difficulty: "medium", timeEstimate: "1 hour", emoji: "🌍", relatedHobbies: ["Cooking"] },
  { id: "sq-19", title: "Make bread from scratch", description: "Flour, water, yeast, salt. Make a loaf of bread by hand. No bread machine. Feel the dough.", category: "culinary", difficulty: "medium", timeEstimate: "half day", emoji: "🍞", relatedHobbies: ["Baking"] },
  { id: "sq-20", title: "Make pasta from scratch", description: "Eggs and flour. Make fresh pasta by hand — roll it, cut it, cook it. The simplest luxury.", category: "culinary", difficulty: "medium", timeEstimate: "1 hour", emoji: "🍝", relatedHobbies: ["Cooking"] },
  { id: "sq-21", title: "Learn to make a perfect sauce", description: "Pick one sauce — bolognese, bechamel, pesto, curry. Learn to make it perfectly. Practice until it's yours.", category: "culinary", difficulty: "medium", timeEstimate: "1 hour", emoji: "🫕", relatedHobbies: ["Cooking"] },
  { id: "sq-22", title: "Start a small herb garden", description: "Get 3 herb plants — basil, mint, rosemary. Put them on a windowsill. Keep them alive for a month.", category: "culinary", difficulty: "easy", timeEstimate: "30 min", emoji: "🌿", relatedHobbies: ["Gardening"] },
  { id: "sq-23", title: "Brew coffee a new way", description: "If you use a machine, try pour-over. If you do pour-over, try French press. Change one variable.", category: "culinary", difficulty: "easy", timeEstimate: "30 min", emoji: "☕", relatedHobbies: ["Coffee brewing"] },
  { id: "sq-24", title: "Have a solo picnic", description: "Pack food you made yourself. Go to a park. Eat slowly. No phone.", category: "culinary", difficulty: "easy", timeEstimate: "1 hour", emoji: "🧺", relatedHobbies: ["Cooking"] },
  { id: "sq-25", title: "Ferment something", description: "Make kimchi, sauerkraut, kombucha, or yogurt. Start a fermentation project and wait.", category: "culinary", difficulty: "hard", timeEstimate: "half day", emoji: "🫙", relatedHobbies: ["Fermentation"] },

  // ── Social (8) ──
  { id: "sq-26", title: "Give a sincere compliment to a stranger", description: "Not creepy, not forced. Just notice something genuine and say it. Their shoes, their dog, their energy.", category: "social", difficulty: "easy", timeEstimate: "15 min", emoji: "💬", relatedHobbies: [] },
  { id: "sq-27", title: "Attend a public talk or open mic", description: "Find a local talk, open mic, or meetup. Go alone. Just listen and absorb.", category: "social", difficulty: "medium", timeEstimate: "1 hour", emoji: "🎤", relatedHobbies: ["Improv comedy", "Theater"] },
  { id: "sq-28", title: "Volunteer once without posting about it", description: "Find a local cause — food bank, cleanup, shelter. Volunteer for a shift. Tell nobody.", category: "social", difficulty: "medium", timeEstimate: "half day", emoji: "🤲", relatedHobbies: ["Volunteering"] },
  { id: "sq-29", title: "Take yourself out for coffee alone", description: "Go to a cafe. Order something nice. Sit and watch the world. No phone for 30 minutes.", category: "social", difficulty: "easy", timeEstimate: "30 min", emoji: "☕", relatedHobbies: [] },
  { id: "sq-30", title: "Host a dinner for friends", description: "Cook a full meal. Invite 2-4 people. No takeout. Set the table properly.", category: "social", difficulty: "hard", timeEstimate: "half day", emoji: "🍽️", relatedHobbies: ["Hosting dinners", "Cooking"] },
  { id: "sq-31", title: "Learn a basic self-defense move", description: "Watch a tutorial and practice one self-defense technique until it feels natural. Or attend one class.", category: "social", difficulty: "medium", timeEstimate: "1 hour", emoji: "🥋", relatedHobbies: ["Martial arts"] },
  { id: "sq-32", title: "Write a real thank-you note", description: "Buy a card or use nice paper. Write a genuine thank-you to someone who helped you. Mail it.", category: "social", difficulty: "easy", timeEstimate: "15 min", emoji: "💌", relatedHobbies: ["Writing"] },
  { id: "sq-33", title: "Teach someone something you know", description: "Find a friend or family member. Teach them one skill you're good at — a recipe, a chord, a technique.", category: "social", difficulty: "medium", timeEstimate: "1 hour", emoji: "🎓", relatedHobbies: [] },

  // ── Exploration (9) ──
  { id: "sq-34", title: "Visit a museum by yourself", description: "Go alone. No rushing. Read the plaques. Sit with one piece that catches you for 5 full minutes.", category: "exploration", difficulty: "medium", timeEstimate: "half day", emoji: "🏛️", relatedHobbies: ["History"] },
  { id: "sq-35", title: "Read a physical book outdoors", description: "Not a Kindle. A real book. Find a bench, a park, a café patio. Read for at least an hour.", category: "exploration", difficulty: "easy", timeEstimate: "1 hour", emoji: "📖", relatedHobbies: ["Reading"] },
  { id: "sq-36", title: "Watch a classic movie start to finish", description: "Pick a film from before you were born that you've always meant to watch. No phone. Full attention.", category: "exploration", difficulty: "easy", timeEstimate: "1 hour", emoji: "🎬", relatedHobbies: [] },
  { id: "sq-37", title: "Explore a part of your city you've never been to", description: "Pick a neighborhood you've never visited. Walk around for an hour with no destination.", category: "exploration", difficulty: "easy", timeEstimate: "1 hour", emoji: "🏙️", relatedHobbies: ["Travel"] },
  { id: "sq-38", title: "Visit a bookshop and buy something unexpected", description: "Go to a physical bookshop. Browse for 30 minutes. Buy the book that surprises you most.", category: "exploration", difficulty: "easy", timeEstimate: "1 hour", emoji: "📚", relatedHobbies: ["Reading"] },
  { id: "sq-39", title: "Learn about a historical event in depth", description: "Pick one event you know little about. Spend an hour reading primary sources or a long-form article.", category: "exploration", difficulty: "medium", timeEstimate: "1 hour", emoji: "📜", relatedHobbies: ["History"] },
  { id: "sq-40", title: "Try a sport you've never played", description: "Badminton, table tennis, rock climbing, fencing — whatever you've never tried. Book one session.", category: "exploration", difficulty: "hard", timeEstimate: "half day", emoji: "🏸", relatedHobbies: ["Tennis", "Climbing", "Basketball"] },
  { id: "sq-41", title: "Attend a religious or cultural service not your own", description: "With respect and openness, attend a service, ceremony, or cultural event outside your own tradition.", category: "exploration", difficulty: "medium", timeEstimate: "1 hour", emoji: "🕊️", relatedHobbies: ["Philosophy"] },
  { id: "sq-42", title: "Fix something in your home", description: "That squeaky door, loose handle, dripping tap. Fix one thing you've been ignoring.", category: "exploration", difficulty: "medium", timeEstimate: "1 hour", emoji: "🔧", relatedHobbies: ["Woodworking", "Electronics"] },

  // ── Mindful (8) ──
  { id: "sq-43", title: "Journal in a cafe and people-watch", description: "Bring a notebook to a busy cafe. Write about what you see, think, and feel. No structure needed.", category: "mindful", difficulty: "easy", timeEstimate: "30 min", emoji: "📔", relatedHobbies: ["Writing", "Journaling"] },
  { id: "sq-44", title: "Do a 24-hour social media detox", description: "Delete the apps for one full day. Notice what you reach for, what you miss, what you don't.", category: "mindful", difficulty: "medium", timeEstimate: "half day", emoji: "📵", relatedHobbies: [] },
  { id: "sq-45", title: "Stretch your body in a new way", description: "Try 20 minutes of yoga, tai chi, or just freestyle stretching. Move in ways you don't normally move.", category: "mindful", difficulty: "easy", timeEstimate: "30 min", emoji: "🧘", relatedHobbies: ["Yoga", "Dance"] },
  { id: "sq-46", title: "Write down 50 things you're grateful for", description: "Not 3, not 10 — fifty. It gets hard around 20, and that's when it gets interesting.", category: "mindful", difficulty: "easy", timeEstimate: "30 min", emoji: "🙏", relatedHobbies: ["Writing"] },
  { id: "sq-47", title: "Take a walk in the rain on purpose", description: "Next time it rains, go outside. Walk for 15 minutes. Feel it. Come home and have something warm.", category: "mindful", difficulty: "easy", timeEstimate: "30 min", emoji: "🌧️", relatedHobbies: ["Hiking"] },
  { id: "sq-48", title: "Organize one drawer or shelf completely", description: "Pick one small space. Empty it. Clean it. Put back only what matters. Let go of the rest.", category: "mindful", difficulty: "easy", timeEstimate: "30 min", emoji: "🗄️", relatedHobbies: [] },
  { id: "sq-49", title: "Watch the sunset with full attention", description: "Find a spot with a good view. Watch the whole sunset — first light change to last. No phone.", category: "mindful", difficulty: "easy", timeEstimate: "30 min", emoji: "🌇", relatedHobbies: ["Photography"] },
  { id: "sq-50", title: "Write your own side quest", description: "Create a quest for yourself that isn't on this list. Something only you would think of. Then do it.", category: "mindful", difficulty: "medium", timeEstimate: "1 hour", emoji: "✨", relatedHobbies: [] },
];

export function getQuestById(id: string): SideQuest | undefined {
  return SIDE_QUESTS.find((q) => q.id === id);
}

export function getQuestsByCategory(category: QuestCategory): SideQuest[] {
  return SIDE_QUESTS.filter((q) => q.category === category);
}

// Personalized filter for Mode B
export type QuestFilters = {
  vibe?: "solo" | "social" | "either";
  energy?: "chill" | "active" | "creative";
  time?: "15 min" | "30 min" | "1 hour" | "half day";
};

const SOLO_CATEGORIES: QuestCategory[] = ["sensory", "creative", "mindful", "exploration"];
const SOCIAL_CATEGORIES: QuestCategory[] = ["social"];
const ENERGY_MAP: Record<string, QuestCategory[]> = {
  chill: ["sensory", "mindful"],
  active: ["exploration", "social"],
  creative: ["creative", "culinary"],
};

export function filterQuests(filters: QuestFilters): SideQuest[] {
  let quests = [...SIDE_QUESTS];

  if (filters.vibe === "solo") {
    quests = quests.filter((q) => SOLO_CATEGORIES.includes(q.category));
  } else if (filters.vibe === "social") {
    quests = quests.filter((q) => SOCIAL_CATEGORIES.includes(q.category));
  }

  if (filters.energy && filters.energy !== "creative") {
    const cats = ENERGY_MAP[filters.energy];
    if (cats) quests = quests.filter((q) => cats.includes(q.category));
  } else if (filters.energy === "creative") {
    const cats = ENERGY_MAP.creative;
    if (cats) quests = quests.filter((q) => cats.includes(q.category));
  }

  if (filters.time) {
    quests = quests.filter((q) => q.timeEstimate === filters.time);
  }

  return quests;
}
```

**Step 2: Create badges.ts with types and badge definitions**

```ts
// src/lib/badges.ts

export type BadgeCategory = "quest" | "category" | "hobby" | "timeline" | "secret";

export type Badge = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  hidden: boolean;
};

export const BADGES: Badge[] = [
  // ── Quest progression ──
  { id: "first-steps", name: "First Steps", description: "Complete your first side quest", emoji: "🥾", category: "quest", hidden: false },
  { id: "curious-cat", name: "Curious Cat", description: "Complete 5 side quests", emoji: "🐱", category: "quest", hidden: false },
  { id: "adventurer", name: "Adventurer", description: "Complete 10 side quests", emoji: "🗺️", category: "quest", hidden: false },
  { id: "renaissance-soul", name: "Renaissance Soul", description: "Complete quests in all 6 categories", emoji: "🎭", category: "quest", hidden: false },
  { id: "quest-master", name: "Side Quest Master", description: "Complete all 50 side quests", emoji: "👑", category: "quest", hidden: false },

  // ── Category mastery (one per quest category) ──
  { id: "sensor", name: "Sensor", description: "Complete 3 sensory quests", emoji: "👁️", category: "category", hidden: false },
  { id: "maker", name: "Maker", description: "Complete 3 creative quests", emoji: "🎨", category: "category", hidden: false },
  { id: "chefs-kiss", name: "Chef's Kiss", description: "Complete 3 culinary quests", emoji: "👨‍🍳", category: "category", hidden: false },
  { id: "people-person", name: "People Person", description: "Complete 3 social quests", emoji: "🤝", category: "category", hidden: false },
  { id: "wanderer", name: "Wanderer", description: "Complete 3 exploration quests", emoji: "🧭", category: "category", hidden: false },
  { id: "zen-master", name: "Zen Master", description: "Complete 3 mindful quests", emoji: "🧘", category: "category", hidden: false },

  // ── Hobby/timeline badges ──
  { id: "rekindler", name: "Rekindler", description: "Add a hobby you had in an earlier phase", emoji: "🔥", category: "hobby", hidden: true },
  { id: "storyteller", name: "Storyteller", description: "Create a timeline with 5+ phases", emoji: "📖", category: "timeline", hidden: false },
  { id: "polymath", name: "Polymath", description: "Have hobbies in 5+ categories", emoji: "🧠", category: "hobby", hidden: false },
  { id: "deep-diver", name: "Deep Diver", description: "Rate any hobby at intensity 5", emoji: "🤿", category: "hobby", hidden: true },

  // ── Secret badges ──
  { id: "night-owl", name: "Night Owl", description: "Complete the stargazing quest", emoji: "🦉", category: "secret", hidden: true },
  { id: "unplugged", name: "Unplugged", description: "Survive 24 hours without social media", emoji: "📵", category: "secret", hidden: true },
  { id: "full-circle", name: "Full Circle", description: "Complete a quest, pin it, then add the hobby to your timeline", emoji: "⭕", category: "secret", hidden: true },
];

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

// Evaluate which badges a user has earned based on completed quest IDs
export function evaluateBadges(completedQuestIds: string[]): string[] {
  const earned: string[] = [];
  const count = completedQuestIds.length;

  // Import quest data inline to avoid circular deps
  const { SIDE_QUESTS } = require("./side-quests") as { SIDE_QUESTS: Array<{ id: string; category: string }> };

  const completedQuests = SIDE_QUESTS.filter((q) => completedQuestIds.includes(q.id));
  const categoryCounts: Record<string, number> = {};
  for (const q of completedQuests) {
    categoryCounts[q.category] = (categoryCounts[q.category] ?? 0) + 1;
  }
  const categoriesCompleted = Object.keys(categoryCounts);

  // Quest progression
  if (count >= 1) earned.push("first-steps");
  if (count >= 5) earned.push("curious-cat");
  if (count >= 10) earned.push("adventurer");
  if (count >= 50) earned.push("quest-master");
  if (categoriesCompleted.length >= 6) earned.push("renaissance-soul");

  // Category mastery
  if ((categoryCounts.sensory ?? 0) >= 3) earned.push("sensor");
  if ((categoryCounts.creative ?? 0) >= 3) earned.push("maker");
  if ((categoryCounts.culinary ?? 0) >= 3) earned.push("chefs-kiss");
  if ((categoryCounts.social ?? 0) >= 3) earned.push("people-person");
  if ((categoryCounts.exploration ?? 0) >= 3) earned.push("wanderer");
  if ((categoryCounts.mindful ?? 0) >= 3) earned.push("zen-master");

  // Secret/specific quest badges
  if (completedQuestIds.includes("sq-03")) earned.push("night-owl");
  if (completedQuestIds.includes("sq-44")) earned.push("unplugged");

  return earned;
}
```

**Step 3: Commit**

```bash
git add src/lib/side-quests.ts src/lib/badges.ts
git commit -m "feat: add side quest and badge data files"
```

---

### Task 2: Prisma Schema — Add pins, completedQuests, earnedBadges

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add fields to Timeline and User models**

Add to `Timeline` model after `phases`:
```prisma
pins      String    @default("[]")
```

Add to `User` model after `website`:
```prisma
completedQuests String @default("[]")
earnedBadges    String @default("[]")
```

**Step 2: Run migration**

```bash
pnpm prisma db push
```

**Step 3: Regenerate client**

```bash
pnpm prisma generate
```

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add pins, completedQuests, earnedBadges to schema"
```

---

### Task 3: Timeline Pin Types & Server Actions

**Files:**
- Modify: `src/lib/types.ts` — add `TimelinePin` type
- Modify: `src/lib/actions/timeline.ts` — add pin actions
- Modify: `src/lib/actions/user.ts` — add quest/badge sync actions

**Step 1: Add TimelinePin type to types.ts**

Add after `Phase` type:
```ts
export type TimelinePin = {
  id: string;
  label: string;
  emoji: string;
  date: string;        // "2026-03" month-level
  questId?: string;
  relatedHobby?: string;
};
```

Add `pins` to `TimelineData`:
```ts
export type TimelineData = {
  // ... existing fields
  pins: TimelinePin[];
};
```

**Step 2: Add pin actions to timeline.ts**

Add `addPin` and `removePin` server actions:
```ts
const PinSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(200),
  emoji: z.string().max(10),
  date: z.string().regex(/^\d{4}-\d{2}$/),
  questId: z.string().optional(),
  relatedHobby: z.string().max(100).optional(),
});

export async function addPin(timelineId: string, pin: TimelinePin) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const timeline = await db.timeline.findUnique({ where: { id: timelineId } });
  if (!timeline || timeline.userId !== session.user.id) throw new Error("Not found");

  const parsed = PinSchema.parse(pin);
  let pins: TimelinePin[] = [];
  try { pins = JSON.parse(timeline.pins as string); } catch {}
  pins.push(parsed);

  await db.timeline.update({
    where: { id: timelineId },
    data: { pins: JSON.stringify(pins) },
  });
  revalidatePath(`/timeline/${timelineId}`);
}

export async function removePin(timelineId: string, pinId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const timeline = await db.timeline.findUnique({ where: { id: timelineId } });
  if (!timeline || timeline.userId !== session.user.id) throw new Error("Not found");

  let pins: TimelinePin[] = [];
  try { pins = JSON.parse(timeline.pins as string); } catch {}
  pins = pins.filter((p) => p.id !== pinId);

  await db.timeline.update({
    where: { id: timelineId },
    data: { pins: JSON.stringify(pins) },
  });
  revalidatePath(`/timeline/${timelineId}`);
}
```

**Step 3: Add quest/badge sync actions to user.ts**

```ts
export async function syncQuestProgress(completedQuests: string[], earnedBadges: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db.user.update({
    where: { id: session.user.id },
    data: {
      completedQuests: JSON.stringify(completedQuests),
      earnedBadges: JSON.stringify(earnedBadges),
    },
  });
}

export async function getQuestProgress(): Promise<{ completedQuests: string[]; earnedBadges: string[] }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { completedQuests: [], earnedBadges: [] };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { completedQuests: true, earnedBadges: true },
  });

  if (!user) return { completedQuests: [], earnedBadges: [] };

  return {
    completedQuests: JSON.parse(user.completedQuests as string) as string[],
    earnedBadges: JSON.parse(user.earnedBadges as string) as string[],
  };
}
```

**Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/actions/timeline.ts src/lib/actions/user.ts
git commit -m "feat: add timeline pin types and quest/badge server actions"
```

---

### Task 4: localStorage Hook for Quest Progress

**Files:**
- Create: `src/hooks/use-quest-progress.ts`

**Step 1: Create the hook**

```ts
// src/hooks/use-quest-progress.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { evaluateBadges } from "~/lib/badges";

const STORAGE_KEY = "sh-side-quests";

type QuestProgress = {
  completed: string[];
  earnedBadges: string[];
  startedAt: string;
};

function readStorage(): QuestProgress {
  if (typeof window === "undefined") return { completed: [], earnedBadges: [], startedAt: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [], earnedBadges: [], startedAt: "" };
    return JSON.parse(raw) as QuestProgress;
  } catch {
    return { completed: [], earnedBadges: [], startedAt: "" };
  }
}

function writeStorage(progress: QuestProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useQuestProgress() {
  const [progress, setProgress] = useState<QuestProgress>({ completed: [], earnedBadges: [], startedAt: "" });
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    setProgress(readStorage());
  }, []);

  const completeQuest = useCallback((questId: string) => {
    setProgress((prev) => {
      if (prev.completed.includes(questId)) return prev;

      const completed = [...prev.completed, questId];
      const allEarned = evaluateBadges(completed);
      const previousBadges = prev.earnedBadges;
      const justEarned = allEarned.filter((b) => !previousBadges.includes(b));

      if (justEarned.length > 0) {
        setNewBadges(justEarned);
      }

      const next: QuestProgress = {
        completed,
        earnedBadges: allEarned,
        startedAt: prev.startedAt || new Date().toISOString(),
      };
      writeStorage(next);
      return next;
    });
  }, []);

  const uncompleteQuest = useCallback((questId: string) => {
    setProgress((prev) => {
      const completed = prev.completed.filter((id) => id !== questId);
      const allEarned = evaluateBadges(completed);
      const next: QuestProgress = { ...prev, completed, earnedBadges: allEarned };
      writeStorage(next);
      return next;
    });
  }, []);

  const dismissNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  const isCompleted = useCallback((questId: string) => progress.completed.includes(questId), [progress.completed]);

  return {
    completed: progress.completed,
    earnedBadges: progress.earnedBadges,
    newBadges,
    completeQuest,
    uncompleteQuest,
    isCompleted,
    dismissNewBadges,
    completedCount: progress.completed.length,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-quest-progress.ts
git commit -m "feat: add useQuestProgress localStorage hook with badge evaluation"
```

---

### Task 5: Side Quests Page — Mode A (Random) & Mode B (Personalized)

**Files:**
- Create: `src/app/side-quests/page.tsx` (server wrapper with metadata)
- Create: `src/app/side-quests/side-quests-client.tsx` (main client component)

**Step 1: Create the server page**

```tsx
// src/app/side-quests/page.tsx
import type { Metadata } from "next";
import { SideQuestsClient } from "./side-quests-client";

export const metadata: Metadata = {
  title: "Side Quests",
  description: "50 side quests to make life more interesting. Generate a random quest, get personalized picks, or complete the full quest board.",
};

export default function SideQuestsPage() {
  return <SideQuestsClient />;
}
```

**Step 2: Create the client component with Mode A and Mode B**

Build `side-quests-client.tsx` with:
- Three tabs: "Random", "Help me pick", "Quest Board"
- Mode A: large quest card with roll animation, share button
- Mode B: 3 pill selectors (Vibe, Energy, Time) → filtered random quest
- Use `useQuestProgress` hook for completion state
- Quest card shows: emoji, title, description, category pill, difficulty, time, "Mark complete" button, "Add to timeline" link
- Share copies URL with `?q=<id>` query param
- Read `?q=` on mount to show specific quest (for shared links)

This is a large component. Key patterns to follow:
- Use existing `Button` from `~/components/ui/button`
- Use existing `Badge` from `~/components/ui/badge`
- Match the warm amber-50/emerald color scheme from the rest of the site
- Use `scroll-reveal` CSS classes on sections
- Category colors: sensory=emerald, creative=purple, culinary=amber, social=blue, exploration=teal, mindful=violet

**Step 3: Commit**

```bash
git add src/app/side-quests/
git commit -m "feat: add /side-quests page with random and personalized modes"
```

---

### Task 6: Side Quests Page — Mode C (Quest Board)

**Files:**
- Modify: `src/app/side-quests/side-quests-client.tsx`

**Step 1: Add Quest Board tab content**

- Grid of all 50 quests grouped by category
- Each category has a header with emoji + label + count completed
- Quest cards: compact version with checkbox, emoji, title, difficulty dots
- Click card to expand: description, time, related hobbies, "Add to timeline" button
- Progress bar at top: `X/50 completed` with emerald fill
- Badge toast: when `newBadges` is non-empty, show animated toast with badge emoji + name + description
- After completing 3 quests AND not logged in: show a subtle banner "Save your progress — sign in to keep quests across devices"

**Step 2: Add badge earned toast component**

Inline in the same file or extract to `src/components/badge-toast.tsx`:
- Slides in from bottom-right
- Shows badge emoji, name, description
- Auto-dismiss after 4 seconds, or click to dismiss
- Stacks if multiple earned at once

**Step 3: Commit**

```bash
git add src/app/side-quests/ src/components/badge-toast.tsx
git commit -m "feat: add quest board mode with progress tracking and badge toasts"
```

---

### Task 7: Timeline Pin Rendering

**Files:**
- Modify: `src/components/timeline-view/phase-swimlane.tsx` — render pins between phases
- Modify: `src/app/timeline/[id]/page.tsx` — pass pins data

**Step 1: Update timeline page to parse and pass pins**

In `src/app/timeline/[id]/page.tsx`, after parsing phases:
```ts
let pins: TimelinePin[] = [];
try { pins = JSON.parse(raw.pins as string) as TimelinePin[]; } catch {}
```

Add `pins` to the `timeline` object and pass to `PhaseSwimlane`:
```tsx
<PhaseSwimlane phases={phases} pins={pins} />
```

**Step 2: Update PhaseSwimlane to render pins**

Add `pins` prop. Render pins as small diamond markers below the phase grid:
```tsx
{pins.length > 0 && (
  <div className="mt-4 flex flex-wrap items-center gap-2">
    <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Pins</span>
    {pins.map((pin) => (
      <div
        key={pin.id}
        className="group relative inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
        title={`${pin.label} — ${pin.date}`}
      >
        <span>{pin.emoji}</span>
        <span className="text-stone-600">{pin.label}</span>
        <span className="text-stone-400">{pin.date}</span>
      </div>
    ))}
  </div>
)}
```

**Step 3: Commit**

```bash
git add src/components/timeline-view/phase-swimlane.tsx src/app/timeline/[id]/page.tsx
git commit -m "feat: render timeline pins below phase swimlane"
```

---

### Task 8: Badge Collection on Profile Page

**Files:**
- Create: `src/components/badge-collection.tsx`
- Modify: `src/app/u/[username]/page.tsx`

**Step 1: Create BadgeCollection component**

```tsx
// src/components/badge-collection.tsx
import { BADGES } from "~/lib/badges";

export function BadgeCollection({ earnedBadgeIds }: { earnedBadgeIds: string[] }) {
  const earned = new Set(earnedBadgeIds);
  const visible = BADGES.filter((b) => !b.hidden || earned.has(b.id));

  if (visible.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-stone-500">
        Badges
      </h2>
      <div className="flex flex-wrap gap-2">
        {visible.map((badge) => {
          const isEarned = earned.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                isEarned
                  ? "border-amber-200 bg-amber-50 text-amber-800 shadow-sm"
                  : "border-stone-200 bg-stone-50 text-stone-400"
              }`}
              title={isEarned ? badge.description : "???"}
            >
              <span className={isEarned ? "" : "grayscale opacity-40"}>
                {isEarned ? badge.emoji : "?"}
              </span>
              <span>{isEarned ? badge.name : "???"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Integrate into profile page**

In `src/app/u/[username]/page.tsx`:
- Query `user.earnedBadges` from the database
- Parse the JSON string
- Render `<BadgeCollection earnedBadgeIds={parsedBadges} />` between hobby cloud and timelines sections

**Step 3: Commit**

```bash
git add src/components/badge-collection.tsx src/app/u/[username]/page.tsx
git commit -m "feat: add badge collection display on profile page"
```

---

### Task 9: Blog Post — "You're Bored Because You're Not Doing Side Quests"

**Files:**
- Modify: `src/lib/blog-posts.ts` — add new blog post + "Inspiration" category
- Modify: `src/app/blog/page.tsx` — add Inspiration category color
- Modify: `src/app/blog/[slug]/page.tsx` — add Inspiration category color

**Step 1: Add Inspiration category colors to both blog pages**

In both files' `CATEGORY_COLORS`:
```ts
Inspiration: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
```

**Step 2: Add blog post to blogPosts array**

Add as the first entry (newest) in `blogPosts`:
```ts
{
  slug: "side-quests",
  title: "You're Bored Because You're Not Doing Side Quests",
  excerpt: "Life is more than working and throwing yourself into bed. Here's why treating hobbies as side quests changes everything — and 50 quests to get you started.",
  category: "Inspiration",
  emoji: "⚔️",
  readTime: 5,
  publishedAt: "March 2026",
  content: [
    // Full blog post content — ~15 content blocks
    // Hook → RPG reframe → why side quests matter → categories → CTA to /side-quests
  ],
}
```

Write full blog post content blocks following the style of existing posts (thoughtful, conversational, no fluff). Reference the viral tweet. Tie to SignificantHobbies' core thesis.

**Step 3: Commit**

```bash
git add src/lib/blog-posts.ts src/app/blog/page.tsx src/app/blog/[slug]/page.tsx
git commit -m "feat: add 'side quests' blog post with Inspiration category"
```

---

### Task 10: Nav Integration & Polish

**Files:**
- Modify: `src/components/nav.tsx` — add Side Quests link
- Modify: `src/app/_components/landing-client.tsx` — mention side quests if desired

**Step 1: Add Side Quests to nav**

After the "Explore" link in `nav.tsx`:
```tsx
<Link href="/side-quests">
  <Button
    variant="ghost"
    size="sm"
    className="text-stone-500 hover:text-stone-700"
  >
    Side Quests
  </Button>
</Link>
```

**Step 2: Build and verify**

```bash
pnpm build
```

Fix any TypeScript errors.

**Step 3: Commit**

```bash
git add src/components/nav.tsx
git commit -m "feat: add side quests to nav"
```

---

### Task 11: Final Integration Test & Deploy

**Step 1: Run dev server and manually verify**

```bash
pnpm dev
```

Check:
- [ ] `/side-quests` loads with Mode A (random quest)
- [ ] Roll again works
- [ ] Share URL with `?q=` param loads correct quest
- [ ] Mode B filters work (pills + filtered results)
- [ ] Mode C shows all 50 quests grouped by category
- [ ] Completing quests updates progress bar
- [ ] Badge toast appears when earned
- [ ] After 3 completions, save-progress prompt shows (when not logged in)
- [ ] `/blog/side-quests` renders the new blog post
- [ ] Blog post CTA links to `/side-quests`
- [ ] Timeline page renders pins
- [ ] Profile page shows badge collection
- [ ] Nav has "Side Quests" link

**Step 2: Build clean**

```bash
pnpm build
```

**Step 3: Deploy**

```bash
vercel --prod
```

**Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: final polish for side quests launch"
```
