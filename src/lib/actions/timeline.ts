"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth/config";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Phase, TimelineVisibility } from "~/lib/types";

const HobbySchema = z.object({
  name: z.string().min(1).max(100),
  intensity: z.number().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
});

const PhaseSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  ageStart: z.number().optional(),
  ageEnd: z.number().optional(),
  yearStart: z.number().optional(),
  yearEnd: z.number().optional(),
  hobbies: z.array(HobbySchema),
  order: z.number(),
});

const SaveTimelineSchema = z.object({
  title: z.string().max(200).optional(),
  phases: z.array(PhaseSchema),
});

export async function saveTimeline(data: {
  title?: string;
  phases: Phase[];
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const parsed = SaveTimelineSchema.parse(data);
  const timeline = await db.timeline.create({
    data: {
      userId: session.user.id,
      title: parsed.title ?? null,
      phases: JSON.stringify(parsed.phases),
    },
  });
  revalidatePath("/timeline");
  return timeline;
}

export async function updateTimeline(
  id: string,
  data: { title?: string; phases: Phase[] },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const timeline = await db.timeline.findUnique({ where: { id } });
  if (!timeline || timeline.userId !== session.user.id)
    throw new Error("Not found");

  const parsed = SaveTimelineSchema.parse(data);
  const updated = await db.timeline.update({
    where: { id },
    data: {
      title: parsed.title ?? null,
      phases: JSON.stringify(parsed.phases),
    },
  });
  revalidatePath(`/timeline/${id}`);
  return updated;
}

export async function setTimelineVisibility(
  id: string,
  visibility: TimelineVisibility,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const timeline = await db.timeline.findUnique({ where: { id } });
  if (!timeline || timeline.userId !== session.user.id)
    throw new Error("Not found");

  let slug = timeline.slug;
  if ((visibility === "PUBLIC" || visibility === "UNLISTED") && !slug) {
    slug = nanoid(10);
  }

  const updated = await db.timeline.update({
    where: { id },
    data: { visibility, slug },
  });
  revalidatePath(`/timeline/${id}`);
  return updated;
}

export async function deleteTimeline(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const timeline = await db.timeline.findUnique({ where: { id } });
  if (!timeline || timeline.userId !== session.user.id)
    throw new Error("Not found");

  await db.timeline.delete({ where: { id } });
  revalidatePath("/timeline");
}
