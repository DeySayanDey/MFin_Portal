export type MFinMetric = {
  label: string;
  value: string;
  hint?: string;
  tone?: "green" | "blue" | "amber" | "violet" | "rose" | "slate";
};

export type MFinTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export type MFinTableRow = Record<string, string>;

export type MFinFormField = {
  label: string;
  value: string;
  type?: "text" | "select" | "textarea" | "toggle";
  span?: 1 | 2;
};

export type MFinSidebarLink = {
  label: string;
  href: string;
  active?: boolean;
};

export type MFinPageContent = {
  slug: string;
  route: string;
  module: string;
  title: string;
  subtitle: string;
  sidebar?: MFinSidebarLink[];
  metrics?: MFinMetric[];
  table?: {
    title?: string;
    columns: MFinTableColumn[];
    rows: MFinTableRow[];
  };
  form?: {
    title?: string;
    fields: MFinFormField[];
  };
  cards?: Array<{ title: string; body: string; badge?: string }>;
  notes?: string[];
};
