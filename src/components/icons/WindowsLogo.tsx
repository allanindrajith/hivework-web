export interface WindowsLogoProps {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export function WindowsLogo({
  size = 14,
  className,
  'aria-hidden': ariaHidden = true,
}: WindowsLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden={ariaHidden}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M3 5.557L10.364 4.5v6.864H3V5.557zm0 12.886l7.364 1.057v-6.864H3v5.807zm8.455 1.213L21 21V11.364h-9.545v8.292zm0-15.312v8.292H21V3l-9.545 1.344z" />
    </svg>
  );
}
