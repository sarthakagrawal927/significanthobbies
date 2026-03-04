import { db } from "~/server/db";
import { ExploreClient } from "./explore-client";
import type { Phase, TimelineData, TimelineVisibility } from "~/lib/types";

export const metadata = { title: "Explore — SignificantHobbies" };

export default async function ExplorePage() {
  const rawTimelines = await db.timeline.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const timelines: TimelineData[] = rawTimelines.map((raw) => {
    let phases: Phase[] = [];
    try {
      phases = JSON.parse(raw.phases as string) as Phase[];
    } catch { /* ignore */ }
    return {
      id: raw.id,
      title: raw.title,
      visibility: raw.visibility as TimelineVisibility,
      slug: raw.slug,
      phases,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      user: raw.user
        ? {
            id: raw.user.id,
            name: raw.user.name,
            username: raw.user.username,
            image: raw.user.image,
          }
        : null,
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Explore timelines</h1>
        <p className="mt-2 text-stone-500">
          Discover how people spend their time — across life phases, hobbies, and chapters.
        </p>
      </div>

      <ExploreClient timelines={timelines} />
    </div>
  );
}
