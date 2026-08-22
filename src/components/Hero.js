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
            "radial-gradient(ellipse 900px 720px at 0% 0%, rgba(12,10,6,0.72), rgba(12,10,6,0) 68%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-6 py-8 sm:px-10 sm:py-10">
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-[#f8f4e8]">Robin</span>
          <span className="text-[#ff8552]">Scouts</span>
        </span>

        <div className="mt-10 max-w-xl">
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
