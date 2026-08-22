import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--background)" }}>
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Image
              src="/robinlogo.png"
              alt="RobinScouts"
              width={2048}
              height={768}
              className="h-9 w-auto"
            />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--ink-soft)]">
              Field notes for the ones still looking. RobinScouts keeps watch
              so you don&apos;t have to.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex gap-5 font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
              <a
                href="https://github.com/codedpool/robinscouts"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[var(--ember)]"
              >
                View source
              </a>
              <a
                href="https://brightdata.com"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[var(--ember)]"
              >
                Powered by Bright Data
              </a>
            </div>
            <p className="text-xs text-[var(--ink-soft)] sm:text-right">
              Built for Into the Scrape-Verse — WeMakeDevs × Bright Data.
            </p>
          </div>
        </div>

        <div
          className="mt-10 border-t pt-6 font-mono text-xs text-[var(--ink-soft)]"
          style={{ borderColor: "var(--paper-line)" }}
        >
          © {new Date().getFullYear()} RobinScouts
        </div>
      </div>
    </footer>
  );
}
