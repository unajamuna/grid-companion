// A soft, solarpunk-ish backdrop: an original painted landscape (bright sky, warm
// clouds, layered green and teal hills), blurred heavily so it reads as colour,
// not a picture. Fixed behind the page; purely decorative.
export function Landscape() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#7cc6e8]">
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full scale-115 blur-[26px] saturate-[1.1]"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f93dd" />
            <stop offset="0.45" stopColor="#62c2ea" />
            <stop offset="0.62" stopColor="#b6e6e4" />
          </linearGradient>
          <radialGradient id="sun" cx="0.72" cy="0.3" r="0.35">
            <stop offset="0" stopColor="#fff3c9" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff3c9" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1600" height="1000" fill="url(#sky)" />
        <rect width="1600" height="1000" fill="url(#sun)" />

        {/* Clouds: warm tops, lavender undersides */}
        <g>
          <ellipse cx="260" cy="270" rx="200" ry="70" fill="#8d95c8" />
          <ellipse cx="260" cy="245" rx="175" ry="60" fill="#fbe7b6" />
          <ellipse cx="880" cy="190" rx="230" ry="65" fill="#8d95c8" />
          <ellipse cx="880" cy="170" rx="195" ry="55" fill="#fff0c8" />
          <ellipse cx="1330" cy="290" rx="290" ry="100" fill="#97a0cf" />
          <ellipse cx="1330" cy="255" rx="250" ry="85" fill="#fbe7b6" />
          <ellipse cx="620" cy="400" rx="170" ry="45" fill="#f6ead0" opacity="0.7" />
        </g>

        {/* Far hills: blue-teal */}
        <path d="M0 560 C 250 500, 450 540, 700 520 S 1150 480, 1600 530 L1600 1000 L0 1000 Z" fill="#3c7f9f" />
        {/* Mid hills: teal-green */}
        <path d="M0 640 C 300 580, 520 650, 820 610 S 1300 560, 1600 620 L1600 1000 L0 1000 Z" fill="#3a9a7c" />
        {/* Tree band */}
        <path d="M0 700 C 260 670, 600 720, 900 690 S 1350 660, 1600 700 L1600 760 L0 760 Z" fill="#245f52" opacity="0.8" />
        {/* Near hills: bright green */}
        <path d="M0 760 C 350 700, 700 800, 1050 740 S 1450 710, 1600 750 L1600 1000 L0 1000 Z" fill="#5dbb68" />
        {/* Sunlit foreground */}
        <path d="M0 880 C 300 820, 650 900, 1000 860 S 1400 840, 1600 880 L1600 1000 L0 1000 Z" fill="#8fd16b" />
        <ellipse cx="300" cy="960" rx="420" ry="90" fill="#c8e27a" opacity="0.7" />
      </svg>
    </div>
  )
}
