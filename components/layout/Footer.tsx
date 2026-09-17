export function Footer() {
  return (
    <footer className="app-inset-x shrink-0 border-t border-border bg-surface py-3">
      <div className="flex flex-col gap-2 text-center text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:text-left sm:text-xs">
        <p className="leading-relaxed">
          © {new Date().getFullYear()} eZi-Micro Core Banking · MFIN Portal
        </p>
        <p className="leading-relaxed">
          Design & Developed By{" "}
          <a
            href="https://prioritysolutions.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-ink transition hover:text-brand hover:underline"
          >
            Priority Solutions
          </a>
        </p>
      </div>
    </footer>
  );
}
