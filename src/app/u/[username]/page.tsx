import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "~/server/auth/config";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { TimelineCard } from "~/components/timeline-card";
import { SuggestionsPanel } from "~/components/suggestions-panel";
import { Plus } from "lucide-react";
import type { Phase, TimelineVisibility } from "~/lib/types";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `@${username} — SignificantHobbies` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      createdAt: true,
      timelines: {
        orderBy: { updatedAt: "desc" },
        where: { OR: [{ visibility: "PUBLIC" }, { visibility: "UNLISTED" }] },
      },
    },
  });

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;

  // Get owned timelines (including private) for owner
  let ownTimelines = user.timelines;
  if (isOwner) {
    const allTimelines = await db.timeline.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    ownTimelines = allTimelines;
  }

  const timelines = ownTimelines.map((t) => {
    let phases: Phase[] = [];
    try {
      phases = JSON.parse(t.phases as string) as Phase[];
    } catch { /* ignore */ }
    return {
      id: t.id,
      title: t.title,
      visibility: t.visibility as TimelineVisibility,
      slug: t.slug,
      phases,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      user: { id: user.id, name: user.name, username: user.username, image: user.image },
    };
  });

  const allHobbies = [
    ...new Set(timelines.flatMap((t) => t.phases.flatMap((p) => p.hobbies.map((h) => h.name)))),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Profile header */}
      <div className="mb-10 flex items-start gap-5 flex-wrap">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "Avatar"}
            width={72}
            height={72}
            className="rounded-full border-2 border-slate-700"
          />
        ) : (
          <div className="h-[72px] w-[72px] rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400">
            {(user.name ?? username).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-100">
            {user.name ?? username}
          </h1>
          <p className="text-slate-500">@{user.username}</p>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
            <span>{timelines.length} timelines</span>
            <span>·</span>
            <span>{allHobbies.length} hobbies</span>
          </div>
        </div>
        {isOwner && (
          <Link href="/timeline/new">
            <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
              <Plus className="mr-1.5 h-4 w-4" />
              New timeline
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-8">
        {/* Timelines */}
        {timelines.length > 0 ? (
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
              Timelines
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {timelines.map((t) => (
                <TimelineCard
                  key={t.id}
                  timeline={t}
                  showVisibility={isOwner}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
            <p className="text-slate-500">No public timelines yet.</p>
            {isOwner && (
              <Link href="/timeline/new">
                <Button className="mt-4 bg-emerald-600 text-white hover:bg-emerald-500">
                  Build your first timeline
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Suggestions */}
        {isOwner && allHobbies.length > 0 && (
          <SuggestionsPanel existingHobbies={allHobbies} />
        )}
      </div>
    </div>
  );
}
