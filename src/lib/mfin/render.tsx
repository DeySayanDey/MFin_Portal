import { notFound } from "next/navigation";
import { MFinPageView } from "@/features/mfin/components/MFinPageView";
import { resolvePageContent } from "@/lib/mfin/page-content";

export function renderMFinRoute(route: string) {
  const content = resolvePageContent(route);
  if (!content) notFound();
  return <MFinPageView content={content} />;
}
