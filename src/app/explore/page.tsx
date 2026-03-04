import { Button } from "~/components/ui/button";
import Link from "next/link";

export default function ExplorePage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">📊</div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-sm text-emerald-600">
          Coming soon
        </div>
        <h1 className="mb-3 text-3xl font-bold text-stone-900">
          Explore Trends
        </h1>
        <p className="mb-2 text-stone-500">
          Discover what hobbies people pick up in their 20s, what gets dropped,
          and what comes back decades later.
        </p>
        <p className="mb-8 text-sm text-stone-400">
          We&apos;re building aggregate insights right now — come back soon.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/timeline/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Build your timeline
            </Button>
          </Link>
          <Link href="/hobbies">
            <Button variant="outline" className="border-stone-300 text-stone-600">
              Browse hobbies
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
