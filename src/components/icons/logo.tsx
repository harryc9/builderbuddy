/**
 * Grout voice wave logo mark.
 * 3 rounded bars — two vertical, last one tilted inward for character.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 28"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="1" y="5" width="4" height="16" rx="2" />
      <rect x="10" y="1" width="4" height="26" rx="2" />
      <rect
        x="19"
        y="5"
        width="4"
        height="16"
        rx="2"
        transform="rotate(8 21 13)"
      />
    </svg>
  )
}
