import type { Metadata } from "next";
import { SideQuestsClient } from "./side-quests-client";

export const metadata: Metadata = {
  title: "Side Quests",
  description:
    "50 side quests to make life more interesting. Generate a random quest, get personalized picks, or complete the full quest board.",
};

export default function SideQuestsPage() {
  return <SideQuestsClient />;
}
