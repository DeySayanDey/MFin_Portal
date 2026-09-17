import { createMFinPage } from "@/lib/mfin-route";

const PARENTS = [
  "master",
  "accounting",
  "lms",
  "deposits",
  "mis",
  "hr",
  "security",
  "branch-vault",
] as const;

export function createModuleSubPage(parent: (typeof PARENTS)[number]) {
  return createMFinPage(`/${parent}`);
}
