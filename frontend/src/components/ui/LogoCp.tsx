export function LogoCp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 90"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <g stroke="#b31322" strokeWidth="10" strokeLinecap="round">
        {/* c — large CCW arc, opens to the right */}
        <path d="M 49 30 A 22 22 0 1 0 49 58" />
        {/* p bowl */}
        <circle cx="55" cy="44" r="15" />
        {/* p descender */}
        <line x1="40" y1="44" x2="40" y2="79" />
      </g>
    </svg>
  );
}
