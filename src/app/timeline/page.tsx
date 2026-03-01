import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { TimelineCard } from "~/components/timeline-card";
import { Plus, LayoutList } from "lucide-react";
import type { Phase, TimelineData, TimelineVisibility } from "~/lib/types";

export const metadata = { title: "My Timelines — SignificantHobbies" };

export default async function MyTimelinesPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawTimelines = await db.timeline.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
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
    };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Timelines</h1>
          <p className="mt-1 text-sm text-slate-500">
            {timelines.length > 0
              ? `${timelines.length} timeline${timelines.length === 1 ? "" : "s"}`
              : "Track your hobbies across life phases"}
          </p>
        </div>
        <Link href="/timeline/new">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="mr-1.5 h-4 w-4" />
            New Timeline
          </Button>
        </Link>
      </div>

      {timelines.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-20 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
            <LayoutList className="h-6 w-6 text-slate-500" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            No timelines yet
          </h2>
          <p className="mb-7 max-w-xs text-sm text-slate-500">
            Create your first timeline to start mapping the hobbies that defined
            each chapter of your life.
          </p>
          <Link href="/timeline/new">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="mr-1.5 h-4 w-4" />
              Build your first timeline
            </Button>
          </Link>
        </div>
      ) : (
        /* Timeline grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {timelines.map((timeline) => (
            <TimelineCard
              key={timeline.id}
              timeline={timeline}
              showVisibility={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
