type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const GearIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

export const PauseIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 5v14M15 5v14" strokeWidth="3" />
  </svg>
);

export const BackspaceIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
    <path d="m13 9 5 6M18 9l-5 6" />
  </svg>
);

export const SparkIcon = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6Z" />
  </svg>
);

export const GridIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
  </svg>
);

export const MathIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 8h6M8 5v6M14 8h6M5 17h6M14 15l6 4M20 15l-6 4" />
  </svg>
);

export const PiIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h16M8 7v12M16 7v9a3 3 0 0 0 3 3" />
  </svg>
);

export const CheckIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} strokeWidth={3} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const XIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} strokeWidth={3} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const EyeIcon = ({ size = 24, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ChevronIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const BackIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);
