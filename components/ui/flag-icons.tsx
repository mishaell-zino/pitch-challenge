// SVG Flag Icons for language selector

export function USFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 18"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="18" fill="#B22234" />
      <path
        d="M0,0 h24 M0,2.77 h24 M0,5.54 h24 M0,8.31 h24 M0,11.08 h24 M0,13.85 h24 M0,16.62 h24"
        stroke="#fff"
        strokeWidth="1.38"
      />
      <rect width="9.6" height="9.69" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="1.2" cy="1.2" r="0.4" />
        <circle cx="3.6" cy="1.2" r="0.4" />
        <circle cx="6" cy="1.2" r="0.4" />
        <circle cx="8.4" cy="1.2" r="0.4" />
        <circle cx="2.4" cy="2.4" r="0.4" />
        <circle cx="4.8" cy="2.4" r="0.4" />
        <circle cx="7.2" cy="2.4" r="0.4" />
        <circle cx="1.2" cy="3.6" r="0.4" />
        <circle cx="3.6" cy="3.6" r="0.4" />
        <circle cx="6" cy="3.6" r="0.4" />
        <circle cx="8.4" cy="3.6" r="0.4" />
        <circle cx="2.4" cy="4.8" r="0.4" />
        <circle cx="4.8" cy="4.8" r="0.4" />
        <circle cx="7.2" cy="4.8" r="0.4" />
        <circle cx="1.2" cy="6" r="0.4" />
        <circle cx="3.6" cy="6" r="0.4" />
        <circle cx="6" cy="6" r="0.4" />
        <circle cx="8.4" cy="6" r="0.4" />
        <circle cx="2.4" cy="7.2" r="0.4" />
        <circle cx="4.8" cy="7.2" r="0.4" />
        <circle cx="7.2" cy="7.2" r="0.4" />
        <circle cx="1.2" cy="8.4" r="0.4" />
        <circle cx="3.6" cy="8.4" r="0.4" />
        <circle cx="6" cy="8.4" r="0.4" />
        <circle cx="8.4" cy="8.4" r="0.4" />
      </g>
    </svg>
  )
}

export function SpainFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 18"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="18" fill="#AA151B" />
      <rect y="4.5" width="24" height="9" fill="#F1BF00" />
    </svg>
  )
}

export function SaudiFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 18"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="18" fill="#165B33" />
      <g fill="#fff">
        {/* Shahada text (simplified representation) */}
        <path
          d="M4,6 L20,6 M4,7 L20,7 M4,8 L18,8 M6,9 L20,9"
          stroke="#fff"
          strokeWidth="0.3"
          fill="none"
        />
        {/* Sword */}
        <g transform="translate(4, 11)">
          <rect x="0" y="0" width="16" height="0.8" fill="#fff" />
          <path d="M15,0.4 L17,0.4 L17,0.8 L16,1.5 L15,0.8 Z" fill="#fff" />
          <rect x="0" y="0.2" width="1" height="1.2" fill="#fff" />
        </g>
      </g>
    </svg>
  )
}

// Made with Bob
