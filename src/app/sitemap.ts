import { type MetadataRoute } from "next";
import { db } from "~/server/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://significanthobbies.com";

  const publicTimelines = await db.timeline.findMany({
    where: { visibility: "PUBLIC" },
    select: { id: true, updatedAt: true },
  });

  const users = await db.user.findMany({
    where: { username: { not: null } },
    select: { username: true },
  });

  const hobbyPaths = [
    "guitar",
    "piano",
    "painting",
    "drawing",
    "reading",
    "writing",
    "hiking",
    "cycling",
    "swimming",
    "running",
    "chess",
    "photography",
    "cooking",
    "gardening",
    "yoga",
    "meditation",
    "gaming",
    "coding",
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/hobbies`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...hobbyPaths.map((slug) => ({
      url: `${baseUrl}/hobbies/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...publicTimelines.map((t) => ({
      url: `${baseUrl}/timeline/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...users
      .filter((u) => u.username !== null)
      .map((u) => ({
        url: `${baseUrl}/u/${u.username!}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
  ];
}
