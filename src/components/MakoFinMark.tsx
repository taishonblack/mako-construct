interface MakoFinMarkProps {
  size?: number;
  className?: string;
}

export function MakoFinMark({ size = 20, className = "" }: MakoFinMarkProps) {
  return (
    <svg
      viewBox="0 0 16 20"
      width={size * 0.8}
      height={size}
      fill="currentColor"
      className={className}
      aria-label="MAKO fin mark"
    >
      <polygon points="4,6 16,0 16,20 0,20" />
    </svg>
  );
}
