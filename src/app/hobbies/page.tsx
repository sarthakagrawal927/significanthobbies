import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { HOBBY_CATEGORIES } from "~/lib/hobbies";

export const metadata = { title: "Hobby Directory — SignificantHobbies" };

// Left-border accent colors cycling through hues per category index
const CATEGORY_BORDER_COLORS = [
  "border-l-emerald-600",
  "border-l-blue-600",
  "border-l-purple-600",
  "border-l-orange-600",
  "border-l-pink-600",
  "border-l-teal-600",
  "border-l-amber-600",
  "border-l-violet-600",
  "border-l-sky-600",
  "border-l-rose-600",
];

export default function HobbiesPage() {
  const totalCategories = HOBBY_CATEGORIES.length;
  const totalHobbies = HOBBY_CATEGORIES.reduce((sum, c) => sum + c.hobbies.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-100">Hobby directory</h1>
        <p className="mt-2 text-slate-500">
          Explore hobbies across every category. Click to see community timelines.
        </p>
        {/* Summary counts */}
        <p className="mt-3 text-sm font-medium text-slate-400">
          <span className="text-slate-200">{totalCategories}</span>
          <span className="text-slate-500"> categories</span>
          <span className="mx-2 text-slate-600">·</span>
          <span className="text-slate-200">{totalHobbies}</span>
          <span className="text-slate-500"> hobbies</span>
        </p>
      </div>

      <div className="space-y-10">
        {HOBBY_CATEGORIES.map((category, idx) => {
          const borderColor = CATEGORY_BORDER_COLORS[idx % CATEGORY_BORDER_COLORS.length];
          return (
            <div
              key={category.name}
              className={`border-l-2 pl-5 ${borderColor}`}
            >
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
                    title={`${category.emoji} ${category.name}`}
                  >
                    <span className="inline-block rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm text-slate-300 transition-colors hover:border-emerald-700 hover:text-emerald-300 cursor-pointer">
                      {hobby}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
