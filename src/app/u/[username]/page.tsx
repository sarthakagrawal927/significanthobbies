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
import { getCategoryForHobby } from "~/lib/hobbies";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `@${username} — SignificantHobbies` };
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  Creative: "border-purple-700/60 bg-purple-900/30 text-purple-300",
  Music: "border-pink-700/60 bg-pink-900/30 text-pink-300",
  Physical: "border-orange-700/60 bg-orange-900/30 text-orange-300",
  Intellectual: "border-blue-700/60 bg-blue-900/30 text-blue-300",
  Gaming: "border-violet-700/60 bg-violet-900/30 text-violet-300",
  Outdoor: "border-emerald-700/60 bg-emerald-900/30 text-emerald-300",
  Culinary: "border-yellow-700/60 bg-yellow-900/30 text-yellow-300",
  Collecting: "border-slate-600/60 bg-slate-800/60 text-slate-300",
  Making: "border-amber-700/60 bg-amber-900/30 text-amber-300",
  Social: "border-teal-700/60 bg-teal-900/30 text-teal-300",
};

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

  const totalPhases = timelines.reduce((sum, t) => sum + t.phases.length, 0);

  // Build hobby cloud: top 10 most-used hobbies by occurrence count
  const hobbyCount: Record<string, number> = {};
  for (const t of timelines) {
    for (const p of t.phases) {
      for (const h of p.hobbies) {
        hobbyCount[h.name] = (hobbyCount[h.name] ?? 0) + 1;
      }
    }
  }
  const top10Hobbies = Object.entries(hobbyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Profile header */}
      <div className="mb-8 flex items-start gap-5 flex-wrap">
        {/* Avatar with optional owner glow */}
        <div className={isOwner ? "rounded-full p-0.5 bg-gradient-to-br from-emerald-400/40 via-emerald-600/20 to-transparent ring-2 ring-emerald-500/30 shadow-[0_0_18px_2px_rgba(16,185,129,0.18)]" : ""}>
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
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-100">
            {user.name ?? username}
          </h1>
          <p className="text-slate-500">@{user.username}</p>

          {/* Stats bar */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
              <span className="text-emerald-400 font-semibold">{timelines.length}</span>
              <span className="text-slate-500">timeline{timelines.length !== 1 ? "s" : ""}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
              <span className="text-emerald-400 font-semibold">{allHobbies.length}</span>
              <span className="text-slate-500">unique hobbie{allHobbies.length !== 1 ? "s" : ""}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
              <span className="text-emerald-400 font-semibold">{totalPhases}</span>
              <span className="text-slate-500">phase{totalPhases !== 1 ? "s" : ""}</span>
            </span>
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
        {/* Hobby cloud */}
        {allHobbies.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
              Hobby cloud
            </h2>
            <div className="flex flex-wrap gap-2">
              {top10Hobbies.map((hobbyName) => {
                const cat = getCategoryForHobby(hobbyName);
                const colorClass = cat
                  ? (CATEGORY_BADGE_COLORS[cat.name] ?? "border-slate-700/60 bg-slate-800/60 text-slate-300")
                  : "border-slate-700/60 bg-slate-800/60 text-slate-300";
                return (
                  <span
                    key={hobbyName}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${colorClass}`}
                  >
                    {cat && <span>{cat.emoji}</span>}
                    {hobbyName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

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
