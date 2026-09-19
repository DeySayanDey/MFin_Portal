import generated from "@/lib/mfin/registry.generated.json";

export type RegistryEntry = {
  slug: string;
  pdf: string;
  route: string;
  module: string;
  title: string;
  pages: number;
  preview: string;
};

const entries = generated as RegistryEntry[];

export const mfinRegistry = entries;

export const mfinRouteMap = new Map(entries.map((e) => [e.route, e]));

export function findByRoute(route: string): RegistryEntry | undefined {
  const normalized =
    route.endsWith("/") && route.length > 1 ? route.slice(0, -1) : route;
  return mfinRouteMap.get(normalized);
}
