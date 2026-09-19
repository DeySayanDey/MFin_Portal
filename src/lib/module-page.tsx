import { createMFinPage } from "@/lib/mfin-route";

type ModuleParent =
  | "master"
  | "accounting"
  | "lms"
  | "deposits"
  | "mis"
  | "hr"
  | "security"
  | "branch-vault";

export function createModuleSubPage(parent: ModuleParent) {
  return createMFinPage(`/${parent}`);
}
