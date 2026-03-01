export type HobbyEntry = {
  name: string;
  intensity?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
};

export type Phase = {
  id: string;
  label: string;
  ageStart?: number;
  ageEnd?: number;
  yearStart?: number;
  yearEnd?: number;
  hobbies: HobbyEntry[];
  order: number;
};

export type TimelineVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC";

export type TimelineData = {
  id: string;
  title: string | null;
  visibility: TimelineVisibility;
  slug: string | null;
  phases: Phase[];
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
};
