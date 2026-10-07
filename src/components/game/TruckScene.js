// Decorative cinematic night-road scene (pure SVG, no image assets).
export default function TruckScene({ className = "" }) {
  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ts-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#061426" />
          <stop offset="1" stopColor="#0b2342" />
        </linearGradient>
        <linearGradient id="ts-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#25d9ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#25d9ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill="url(#ts-sky)" />
      {/* skyline */}
      <g fill="#0a1d38">
        <rect x="20" y="210" width="50" height="110" />
        <rect x="80" y="170" width="40" height="150" />
        <rect x="130" y="230" width="60" height="90" />
        <rect x="560" y="190" width="45" height="130" />
        <rect x="615" y="150" width="55" height="170" />
        <rect x="680" y="220" width="70" height="100" />
      </g>
      <g fill="#ffc928" opacity="0.5">
        <rect x="90" y="190" width="4" height="4" />
        <rect x="102" y="214" width="4" height="4" />
        <rect x="628" y="172" width="4" height="4" />
        <rect x="644" y="200" width="4" height="4" />
        <rect x="570" y="215" width="4" height="4" />
      </g>
      {/* road */}
      <rect y="320" width="800" height="80" fill="#07101f" />
      <g stroke="#ffb000" strokeWidth="3" strokeDasharray="36 28" opacity="0.7">
        <line x1="0" y1="362" x2="800" y2="362" />
      </g>
      {/* headlight beam */}
      <polygon points="470,318 800,280 800,345" fill="url(#ts-beam)" />
      {/* truck */}
      <g transform="translate(150 238)">
        <rect x="0" y="0" width="250" height="84" rx="4" fill="#132842" stroke="#268cff" strokeWidth="2" />
        <rect x="258" y="22" width="78" height="62" rx="6" fill="#101f35" stroke="#20c7e8" strokeWidth="2" />
        <polygon points="268,28 318,28 330,52 268,52" fill="#20c7e8" opacity="0.35" />
        <rect x="0" y="84" width="336" height="10" fill="#081b33" />
        <g fill="#061426" stroke="#91a7c3" strokeWidth="3">
          <circle cx="44" cy="96" r="16" />
          <circle cx="86" cy="96" r="16" />
          <circle cx="288" cy="96" r="16" />
        </g>
        <rect x="14" y="14" width="140" height="8" rx="2" fill="#25d9ff" opacity="0.5" />
        <rect x="14" y="30" width="90" height="6" rx="2" fill="#ffb000" opacity="0.6" />
        <rect x="330" y="68" width="10" height="8" fill="#ffc928" />
      </g>
    </svg>
  );
}
