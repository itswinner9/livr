import type { Metadata } from "next";
import { CompareDossier } from "@/components/compare-dossier";
import { parseCompareIds } from "@/lib/compare/ids";
import { track } from "@/lib/analytics";
import { loadListingMarketplace } from "@/lib/listings/page-data";
import { getComparePageData } from "@/lib/properties/queries";
import { noIndexFollow, pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}): Promise<Metadata> {
  const { ids = "" } = await searchParams;
  const list = parseCompareIds(ids);
  if (list.length >= 2) {
    return {
      ...pageMetadata(
        "Compare buildings",
        "Side-by-side renter-reported ratings and rent for buildings you selected.",
        "/compare",
      ),
      ...noIndexFollow(),
    };
  }
  return pageMetadata(
    "Compare buildings",
    "Compare renter-reported ratings and rent across Canadian buildings on file.",
    "/compare",
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids = "" } = await searchParams;
  const list = parseCompareIds(ids);
  const columns = (await Promise.all(list.map((id) => getComparePageData(id)))).filter(
    (page): page is NonNullable<typeof page> => Boolean(page),
  );
  if (columns.length >= 2) {
    track("property_compared", { count: columns.length });
  }
  const suggestions =
    columns.length === 0 ? (await loadListingMarketplace({}, { limit: 6 })).listings : [];
  return <CompareDossier columns={columns} suggestions={suggestions} />;
}
