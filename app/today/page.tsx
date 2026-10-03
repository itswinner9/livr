import { TodayDossier } from "@/components/today-dossier";
import { getSessionUser } from "@/lib/auth/session";
import { loadTodayData } from "@/lib/daily/queries";
import { noIndexFollow, pageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata("Today", "Your LivRank home, rent log, and city pulse.", "/today"),
  ...noIndexFollow(),
};

export default async function TodayPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/today");
  const data = await loadTodayData({ userId: user.id, displayName: user.display_name });
  return <TodayDossier data={data} />;
}
