export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
    >
      <path d="m5 8 12-4 5 12-9 7-9-5Z" fill="currentColor" opacity=".18" />
      <path d="m24 5 11 7-2 12-10-3-3-8Z" fill="currentColor" opacity=".35" />
      <path d="m14 25 9-3 11 5-6 9-14-2-6-8Z" fill="currentColor" opacity=".7" />
      <path
        d="m8 13 9 1 8 16m-8-16 12 2"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="13" r="2.6" fill="currentColor" />
      <circle cx="17" cy="14" r="2.6" fill="currentColor" />
      <circle cx="29" cy="16" r="2.6" fill="currentColor" />
      <circle cx="25" cy="30" r="2.6" fill="currentColor" />
    </svg>
  );
}
