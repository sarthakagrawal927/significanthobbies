import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth/config";
import { db } from "~/server/db";
import { TimelineBuilder } from "~/components/timeline-builder/builder";
import type { Phase, TimelineData, TimelineVisibility } from "~/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Timeline — SignificantHobbies" };

export default async function EditTimelinePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const raw = await db.timeline.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, username: true, image: true } } },
  });

  if (!raw || raw.userId !== session.user.id) notFound();

  let phases: Phase[] = [];
  try {
    phases = JSON.parse(raw.phases as string) as Phase[];
  } catch { /* ignore */ }

  const timeline: TimelineData = {
    id: raw.id,
    title: raw.title,
    visibility: raw.visibility as TimelineVisibility,
    slug: raw.slug,
    phases,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    user: raw.user,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Edit timeline</h1>
        <p className="mt-1 text-stone-500">
          Update phases and hobbies, then save.
        </p>
      </div>
      <TimelineBuilder existing={timeline} />
    </div>
  );
}
