import { TimelineBuilder } from "~/components/timeline-builder/builder";

export const metadata = { title: "New Timeline — SignificantHobbies" };

export default function NewTimelinePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">
          Build your hobby timeline
        </h1>
        <p className="mt-1 text-slate-500">
          Add life phases and the hobbies that defined each one.
        </p>
      </div>
      <TimelineBuilder />
    </div>
  );
}
