import type { HomeNoteTopic, MoveChecklistStep } from "@/lib/daily/checklist";
import type { Property, PropertyType } from "@/types/property";

export type DailyNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type SavedSearch = {
  id: string;
  city: string;
  province: string;
  property_type: PropertyType | null;
  created_at: string;
};

export type LeaseDates = {
  lease_end: string;
  notice_date: string | null;
  property_id: string | null;
};

export type RentLog = {
  id: string;
  year: number;
  month: number;
  amount: number;
  paid_on: string | null;
};

export type HomeNote = {
  id: string;
  topic: HomeNoteTopic;
  body: string;
  created_at: string;
};

export type CityPulseItem = {
  id: string;
  title: string;
  href: string;
  hint: string;
  published_at: string | null;
};

export type SavedSearchMatch = {
  search: SavedSearch;
  buildings: Property[];
};

export type TodayData = {
  configured: boolean;
  heading: string;
  unread: DailyNotification[];
  home: Property | null;
  saved: Property[];
  lease: LeaseDates | null;
  rentThisMonth: RentLog | null;
  notes: HomeNote[];
  searches: SavedSearchMatch[];
  checklistProperty: Property | null;
  completedSteps: MoveChecklistStep[];
  pulse: CityPulseItem[];
  city: string | null;
  province: string | null;
};
