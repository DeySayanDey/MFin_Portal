import type { ReactNode } from "react";
import { PageTransition } from "@/components/shared/PageTransition";

type AppTemplateProps = {
  children: ReactNode;
};

/**
 * Remounts on every navigation so page-enter animation runs consistently.
 */
export default function AppTemplate({ children }: AppTemplateProps) {
  return <PageTransition>{children}</PageTransition>;
}
