import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth/config";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { PhaseSwimlane } from "~/components/timeline-view/phase-swimlane";
import { InsightsPanel } from "~/components/timeline-view/insights-panel";
import { ExportButton } from "~/components/timeline-view/export-button";
import { VisibilityToggle } from "~/components/timeline-view/visibility-toggle";
import { Pencil, User } from "lucide-react";
import type { Phase, TimelineData, TimelineVisibility } from "~/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const timeline = await db.timeline.findUnique({ where: { id } });
  return { title: timeline?.title ? `${timeline.title} — SignificantHobbies` : "Timeline — SignificantHobbies" };
}

export default async function TimelinePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const raw = await db.timeline.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, username: true, image: true } } },
  });

  if (!raw) notFound();

  const isOwner = session?.user?.id === raw.userId;
  const isVisible =
    raw.visibility !== "PRIVATE" || isOwner;

  if (!isVisible) notFound();

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {timeline.title ?? "Hobby Timeline"}
          </h1>
          {raw.user && (
            <Link
              href={raw.user.username ? `/u/${raw.user.username}` : "#"}
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
            >
              <User className="h-3.5 w-3.5" />
              {raw.user.username ? `@${raw.user.username}` : raw.user.name}
            </Link>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-700 text-xs text-slate-500"
            >
              {phases.length} phases
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700 text-xs text-slate-500"
            >
              {new Set(phases.flatMap((p) => p.hobbies.map((h) => h.name))).size} hobbies
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isOwner && (
            <VisibilityToggle
              timelineId={timeline.id}
              current={timeline.visibility}
            />
          )}
          <ExportButton timeline={timeline} />
          {isOwner && (
            <Link href={`/timeline/${timeline.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:text-white"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {phases.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
          <p className="text-slate-500">No phases yet.</p>
          {isOwner && (
            <Link href={`/timeline/${timeline.id}/edit`}>
              <Button className="mt-4 bg-emerald-600 text-white hover:bg-emerald-500">
                Add phases
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <PhaseSwimlane phases={phases} />
          <InsightsPanel phases={phases} />
        </div>
      )}
    </div>
  );
}
