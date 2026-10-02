import { AccountShell } from "@/components/account-shell";
import { noIndexFollow } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
  ...noIndexFollow(),
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
