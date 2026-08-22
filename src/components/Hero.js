export default function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#080b13" />
            <stop offset="42%" stopColor="#161f38" />
            <stop offset="72%" stopColor="#4a3345" />
            <stop offset="100%" stopColor="#e2953f" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="100%" r="65%">
            <stop offset="0%" stopColor="#f2a71b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f2a71b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a4363" />
            <stop offset="100%" stopColor="#2a3350" />
          </linearGradient>
          <linearGradient id="mtnMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#232c47" />
            <stop offset="100%" stopColor="#161d34" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />
        <circle cx="820" cy="640" r="230" fill="url(#glow)" />

        {/* far ridge */}
        <path
          d="M0,560 L140,500 L260,545 L400,470 L560,530 L720,460 L900,520 L1060,455 L1240,525 L1400,470 L1600,540 L1600,900 L0,900 Z"
          fill="url(#mtnFar)"
          opacity="0.55"
        />

        {/* mid ridge */}
        <path
          d="M0,660 L180,590 L340,640 L500,560 L680,630 L860,570 L1040,650 L1220,580 L1400,645 L1600,600 L1600,900 L0,900 Z"
          fill="url(#mtnMid)"
          opacity="0.8"
        />

        {/* foreground silhouette */}
        <path
          d="M0,760 L120,700 L260,745 L420,690 L600,750 L780,700 L960,760 L1140,705 L1320,755 L1600,715 L1600,900 L0,900 Z"
          fill="#0a0e18"
        />

        {/* birds */}
        <g className="bird-1" opacity="0">
          <path d="M-12,0 Q-6,-10 0,0 Q6,-10 12,0" fill="none" stroke="#f5f1e8" strokeWidth="3" strokeLinecap="round" transform="translate(220,300)" />
        </g>
        <g className="bird-2" opacity="0">
          <path d="M-9,0 Q-4.5,-7 0,0 Q4.5,-7 9,0" fill="none" stroke="#f5f1e8" strokeWidth="2.5" strokeLinecap="round" transform="translate(180,380)" />
        </g>
        <g className="bird-3" opacity="0">
          <path d="M-10,0 Q-5,-8 0,0 Q5,-8 10,0" fill="none" stroke="#f5f1e8" strokeWidth="2.5" strokeLinecap="round" transform="translate(260,340)" />
        </g>
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-16 sm:px-10 sm:pb-20">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-[#f5f1e8] sm:text-6xl">
            Somewhere, right now, a robin finds your next opportunity.
          </h1>
          <p className="mt-5 max-w-md text-base text-[#c9cedb] sm:text-lg">
            A hiring-change intelligence feed that watches job boards, catches
            what&apos;s new, and never sleeps.
          </p>
          <a
            href="#app"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#ee5a2c] px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#ff6b3d]"
          >
            See what it found
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
