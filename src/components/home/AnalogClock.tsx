'use client';

function timeInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    hour: value('hour') % 12,
    minute: value('minute'),
    second: value('second'),
  };
}

export function AnalogClock({
  timezone,
  label,
  size = 44,
  offsetHours,
  offsetColor,
  now,
}: {
  timezone: string;
  label: string;
  size?: number;
  offsetHours?: number;
  offsetColor?: string;
  now: Date;
}) {
  const { hour, minute, second } = timeInZone(now, timezone);
  const hourDeg = (hour + minute / 60) * 30;
  const minuteDeg = (minute + second / 60) * 6;
  const secondDeg = second * 6;
  const offsetDeg = offsetHours != null ? hourDeg + offsetHours * 30 : null;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden>
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="transparent"
          className="stroke-neutral-200 dark:stroke-neutral-700"
          strokeWidth="1.5"
        />
        {offsetDeg != null && (
          <line
            x1="22"
            y1="22"
            x2="22"
            y2="12"
            stroke={offsetColor ?? '#ef4444'}
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${offsetDeg} 22 22)`}
            opacity="0.85"
          />
        )}
        <line
          x1="22"
          y1="22"
          x2="22"
          y2="13"
          className="stroke-foreground"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${hourDeg} 22 22)`}
        />
        <line
          x1="22"
          y1="22"
          x2="22"
          y2="9"
          className="stroke-foreground"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${minuteDeg} 22 22)`}
        />
        <line
          x1="22"
          y1="22"
          x2="22"
          y2="8"
          className="stroke-neutral-400"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondDeg} 22 22)`}
        />
        <circle cx="22" cy="22" r="1.5" className="fill-foreground" />
      </svg>
      <span className="text-[10px] leading-none text-neutral-400 font-medium">{label}</span>
    </div>
  );
}
