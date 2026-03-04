import { db } from "~/server/db";
import { LandingClient } from "./_components/landing-client";

async function getDemoTimelines() {
  try {
    return await db.timeline.findMany({
      where: { visibility: "PUBLIC" },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: "asc" },
      take: 3,
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const rawDemos = await getDemoTimelines();

  // Serialize for the client component — convert phases JSON field to string
  const demos = rawDemos.map((t) => ({
    id: t.id,
    title: t.title,
    phases: typeof t.phases === "string" ? t.phases : JSON.stringify(t.phases),
    user: t.user ?? null,
  }));

  return <LandingClient demos={demos} />;
}
