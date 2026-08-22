import Image from "next/image";

export default function Closing() {
  return (
    <section style={{ backgroundColor: "var(--background)" }}>
      <div className="relative">
        <Image
          src="/last.png"
          alt="A hiker on a mountainside watches job listings arrive from a robin's search, connected by dotted lines, with a city visible in the valley below"
          width={1774}
          height={887}
          className="block h-auto w-full"
          sizes="100vw"
        />

        {/* Continues the scouting-report section's paper color in from the
            top, and resolves the image back to it at the bottom, so the
            footer below reads as a continuation of this picture rather
            than a separate block. Purely decorative — no text sits inside
            either fade, so it stays safe regardless of rendered height. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 sm:h-24"
          style={{
            background:
              "linear-gradient(to bottom, rgba(246,239,224,1) 0%, rgba(246,239,224,0) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%]"
          style={{
            background:
              "linear-gradient(to top, rgba(246,239,224,1) 0%, rgba(246,239,224,0) 100%)",
          }}
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 pb-8 pt-1 text-center sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-10 sm:text-left">
        <div className="flex items-center gap-3">
          <Image
            src="/robinlogo.png"
            alt="RobinScouts"
            width={2048}
            height={768}
            className="h-7 w-auto"
          />
          <p className="text-xs text-[var(--ink-soft)] sm:text-sm">
            Field notes for the ones still looking.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)] sm:justify-end">
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
          <span>© {new Date().getFullYear()} RobinScouts</span>
        </div>
      </div>
    </section>
  );
}
