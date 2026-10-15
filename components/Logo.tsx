/** Nachbau des CE-Logos als SVG. Original-Datei kann als /public/logo.png abgelegt und hier ersetzt werden. */
export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="5 10 170 100" className={className} role="img" aria-label="CE Logo">
      <g fill="none" strokeWidth="15">
        <path stroke="#fff" d="M80.7 29.4A40 40 0 1 0 68.7 97.6L165 35" />
        <path stroke="#fff" d="M90.2 56.5A40 40 0 0 1 162.8 37" />
        <path stroke="#0b6bb0" d="M110 94.6A40 40 0 0 0 160.6 85.7" />
      </g>
    </svg>
  );
}
