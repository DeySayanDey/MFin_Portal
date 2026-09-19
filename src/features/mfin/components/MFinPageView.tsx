"use client";

import type { MFinPageContent } from "@/lib/mfin/types";
import {
  ActionBar,
  DataTable,
  FormGrid,
  InfoCards,
  MetricGrid,
  NotesPanel,
} from "@/features/mfin/components/primitives";

type MFinPageViewProps = {
  content: MFinPageContent;
  actions?: string[];
};

export function MFinPageView({ content, actions }: MFinPageViewProps) {
  const defaultActions =
    actions ??
    (content.module === "accounting"
      ? ["Print", "Save Draft", "Post Voucher"]
      : content.module === "lending"
        ? ["Export", "Refresh", "Filter Records"]
        : ["Refresh", "Save Configuration"]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex min-w-0 flex-col gap-4">
        {content.metrics && content.metrics.length > 0 ? (
          <MetricGrid metrics={content.metrics} />
        ) : null}

        {content.cards && content.cards.length > 0 ? (
          <InfoCards cards={content.cards} />
        ) : null}

        {content.form ? (
          <FormGrid title={content.form.title} fields={content.form.fields} />
        ) : null}

        {content.table ? (
          <DataTable
            title={content.table.title}
            columns={content.table.columns}
            rows={content.table.rows}
          />
        ) : null}

        {content.notes && content.notes.length > 0 ? (
          <NotesPanel notes={content.notes} />
        ) : null}

        <ActionBar actions={defaultActions} />
      </div>
    </div>
  );
}
