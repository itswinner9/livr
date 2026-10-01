import { noIndexFollow } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manager",
  ...noIndexFollow(),
};

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
