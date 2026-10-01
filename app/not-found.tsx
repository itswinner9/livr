import { PageHeading, PageShell } from "@/components/page-shell";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageShell width="sm" className="py-20">
      <PageHeading title="We couldn't find this page." lede="It may have been merged, or the link is incorrect." />
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-accent hover:text-accent-hover">
        Back to buildings
      </Link>
    </PageShell>
  );
}
