"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Save, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PhaseCard } from "./phase-card";
import { saveTimeline, updateTimeline } from "~/lib/actions/timeline";
import type { Phase, TimelineData } from "~/lib/types";
import { useRouter } from "next/navigation";

interface Props {
  existing?: TimelineData;
}

function makePhase(order: number): Phase {
  return {
    id: nanoid(),
    label: "",
    hobbies: [],
    order,
  };
}

export function TimelineBuilder({ existing }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [phases, setPhases] = useState<Phase[]>(
    existing?.phases?.length
      ? existing.phases
      : [makePhase(0)],
  );
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPhases((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((p, i) => ({
        ...p,
        order: i,
      }));
    });
  }

  function addPhase() {
    setPhases((prev) => [...prev, makePhase(prev.length)]);
  }

  function updatePhase(id: string, patch: Phase) {
    setPhases((prev) => prev.map((p) => (p.id === id ? patch : p)));
  }

  function deletePhase(id: string) {
    setPhases((prev) =>
      prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })),
    );
  }

  function handleSave() {
    const emptyPhases = phases.filter((p) => !p.label.trim());
    if (emptyPhases.length > 0) {
      toast.error("All phases need a name");
      return;
    }

    startTransition(async () => {
      try {
        let result;
        if (existing) {
          result = await updateTimeline(existing.id, { title: title || undefined, phases });
        } else {
          result = await saveTimeline({ title: title || undefined, phases });
        }
        toast.success(existing ? "Timeline updated" : "Timeline saved!");
        router.push(`/timeline/${result.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to save";
        if (msg === "Not authenticated") {
          toast.error("Sign in to save your timeline");
          router.push("/login");
        } else {
          toast.error(msg);
        }
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Title */}
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Timeline title (optional)"
          className="h-11 border-slate-700 bg-slate-900 text-lg font-medium placeholder:text-slate-600"
        />
      </div>

      {/* Phases */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={phases.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onChange={(updated) => updatePhase(phase.id, updated)}
                onDelete={() => deletePhase(phase.id)}
                isOnly={phases.length === 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-slate-700 text-slate-400 hover:text-slate-200"
          onClick={addPhase}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add phase
        </Button>

        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-emerald-600 px-6 text-white hover:bg-emerald-500"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {existing ? "Update timeline" : "Save timeline"}
        </Button>
      </div>
    </div>
  );
}
