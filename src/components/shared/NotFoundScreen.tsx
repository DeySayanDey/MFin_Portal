import { Compass } from "lucide-react";

type NotFoundScreenProps = {
  title: string;
  message: string;
  homeLabel: string;
};

export function NotFoundScreen({
  title,
  message,
  homeLabel,
}: NotFoundScreenProps) {
  return (
    <div className="not-found grid min-h-dvh place-items-center px-4 py-10">
      <div className="not-found-card relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 text-center shadow-[var(--shadow-card)] sm:px-10">
        <span className="not-found-blob not-found-blob--one" aria-hidden="true" />
        <span className="not-found-blob not-found-blob--two" aria-hidden="true" />

        <div className="not-found-art relative z-10" aria-hidden="true">
          <span className="not-found-digit not-found-digit--left">4</span>
          <span className="not-found-orb">
            <span className="not-found-orbit" />
            <span className="not-found-orb-core">
              <Compass className="h-8 w-8" strokeWidth={1.75} />
            </span>
          </span>
          <span className="not-found-digit not-found-digit--right">4</span>
        </div>

        <div className="not-found-copy relative z-10 mt-6 space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted">{message}</p>
        </div>

        <div className="not-found-action relative z-10 mt-6 flex justify-center">
          <a href="/dashboard" className="btn btn-primary">
            {homeLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
