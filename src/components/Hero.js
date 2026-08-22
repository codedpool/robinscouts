import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-screen min-h-160 w-full overflow-hidden">
      <Image
        src="/herorobin2.png"
        alt="A hiker rests on a mountainside with a laptop, a robin perched nearby on the trail overlooking a river valley"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(10,8,5,0.85) 0%, rgba(10,8,5,0.6) 32%, rgba(10,8,5,0.15) 58%, rgba(10,8,5,0) 72%)",
        }}
      />

      {/* Soft light wash so the logo's own painted scene reads on the photo
          without a hard container edge — no box, just brighter sky. */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 640px 360px at 100% 0%, rgba(255,250,236,0.55), rgba(255,250,236,0) 70%)",
        }}
      />

      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-8">
        <Image
          src="/robinlogo.png"
          alt="RobinScouts"
          width={2048}
          height={768}
          priority
          className="h-14 w-auto drop-shadow-[0_2px_14px_rgba(20,15,5,0.35)] sm:h-16"
        />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 py-8 sm:px-10 sm:py-12">
        <div className="max-w-xl">
          <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight text-[#f8f4e8] sm:text-6xl">
            You stepped away.
            <br />
            <span className="font-display italic text-[#ff8552]">
              The robin didn&apos;t.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[#e7e1d2] sm:text-lg">
            RobinScouts logs every new posting, every change, every closed
            role — so you don&apos;t have to keep checking.
          </p>

          <a
            href="#app"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#ee5a2c] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)] transition-colors hover:bg-[#ff6b3d]"
          >
            Open the field log
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
