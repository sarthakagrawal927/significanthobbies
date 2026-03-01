"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { ExportCard } from "./export-card";
import type { TimelineData } from "~/lib/types";

interface Props {
  timeline: TimelineData;
}

export function ExportButton({ timeline }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#020617",
      });
      const link = document.createElement("a");
      link.download = `${timeline.title ?? "hobby-timeline"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Downloaded!");
    } catch {
      toast.error("Export failed — try again");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <Button
        onClick={handleExport}
        disabled={isExporting}
        variant="outline"
        className="border-slate-700 text-slate-300 hover:text-white"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Export PNG
      </Button>

      {/* Hidden export card — rendered off-screen */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
        <ExportCard timeline={timeline} exportRef={cardRef} />
      </div>
    </>
  );
}
