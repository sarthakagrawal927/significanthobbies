import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { HOBBY_CATEGORIES } from "~/lib/hobbies";

export const metadata = { title: "Hobby Directory — SignificantHobbies" };

export default function HobbiesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-100">Hobby directory</h1>
        <p className="mt-2 text-slate-500">
          Explore hobbies across every category. Click to see community timelines.
        </p>
      </div>

      <div className="space-y-10">
        {HOBBY_CATEGORIES.map((category) => (
          <div key={category.name}>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">{category.emoji}</span>
              <h2 className="text-xl font-semibold text-slate-200">
                {category.name}
              </h2>
              <Badge
                variant="outline"
                className="border-slate-700 text-xs text-slate-600"
              >
                {category.hobbies.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.hobbies.map((hobby) => (
                <Link
                  key={hobby}
                  href={`/hobbies/${encodeURIComponent(hobby.toLowerCase().replace(/\s+/g, "-"))}`}
                >
                  <span className="inline-block rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm text-slate-300 transition-colors hover:border-emerald-700 hover:text-emerald-300 cursor-pointer">
                    {hobby}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
