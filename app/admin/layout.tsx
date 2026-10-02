import { getSessionUser, isStaff } from "@/lib/auth/session";
import { AdminChrome } from "@/components/admin-chrome";
import { noIndexFollow } from "@/lib/seo";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  ...noIndexFollow(),
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) redirect("/login?next=/admin");
  return <AdminChrome>{children}</AdminChrome>;
}
