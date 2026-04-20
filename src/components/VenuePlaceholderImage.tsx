/**
 * VenuePlaceholderImage
 *
 * Branded SVG placeholder shown on venue cards and detail pages when
 * no photo has been uploaded. Uses the RubRatings brand palette:
 *   Terracotta #C4513A · Sand #F5EDD6 · Sage #7A9E7E · Ink #1A1A1A
 *
 * Usage:
 *   import VenuePlaceholderImage from "@/components/VenuePlaceholderImage";
 *
 *   // Card (4:3)
 *   <VenuePlaceholderImage venueName="The Thai Room" suburb="Surry Hills" size="card" />
 *
 *   // Detail hero (16:9 wide)
 *   <VenuePlaceholderImage venueName="The Thai Room" suburb="Surry Hills, NSW" size="hero" />
 *
 *   // Custom dimensions
 *   <VenuePlaceholderImage venueName="Zen Spa" suburb="Melbourne CBD" width={600} height={400} />
 */

import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PresetSize = "card" | "hero" | "square";

interface VenuePlaceholderImageProps {
  /** Venue display name — shown centred in the placeholder */
  venueName: string;
  /** Suburb (+ optional state) — shown as a subtitle */
  suburb?: string;
  /** Preset size: card (4:3 400×300), hero (16:9 800×450), square (1:1 400×400) */
  size?: PresetSize;
  /** Override width in px (ignores size preset) */
  width?: number;
  /** Override height in px (ignores size preset) */
  height?: number;
  /** Extra CSS class applied to the wrapping <svg> element */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to show the Rub · Ratings wordmark in the bottom-right */
  showWordmark?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = {
  terracottaDark: "#8B3526",
  terracottaMid:  "#C4513A",
  terracottaLight:"#D96E52",
  sand:           "#F5EDD6",
  sandMuted:      "rgba(245,237,214,0.75)",
  sage:           "#7A9E7E",
  ink:            "#1A1A1A",
} as const;

const PRESETS: Record<PresetSize, { width: number; height: number }> = {
  card:   { width: 400, height: 300 },
  hero:   { width: 800, height: 450 },
  square: { width: 400, height: 400 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shorten very long venue names so they fit cleanly */
function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1).trimEnd() + "…";
}

/** Derive 1–2 initials from venue name for the large background monogram */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

const VenuePlaceholderImage: React.FC<VenuePlaceholderImageProps> = ({
  venueName,
  suburb,
  size = "card",
  width: widthProp,
  height: heightProp,
  className,
  style,
  alt,
  showWordmark = true,
}) => {
  const preset = PRESETS[size];
  const W = widthProp ?? preset.width;
  const H = heightProp ?? preset.height;

  // Responsive font sizes relative to the smaller dimension
  const minDim   = Math.min(W, H);
  const monogramSize   = Math.round(minDim * 0.55);
  const nameSize       = Math.max(14, Math.round(minDim * 0.075));
  const suburbSize     = Math.max(11, Math.round(minDim * 0.045));
  const wordmarkSize   = Math.max(9,  Math.round(minDim * 0.035));
  const dotSize        = Math.round(wordmarkSize * 0.5);
  const dotY           = H - Math.round(minDim * 0.04) - wordmarkSize * 0.15;
  const wordmarkY      = H - Math.round(minDim * 0.04);
  const wordmarkX      = W - Math.round(minDim * 0.04);

  const displayName   = truncate(venueName, size === "hero" ? 40 : 28);
  const displaySuburb = suburb ? truncate(suburb, size === "hero" ? 35 : 24) : undefined;
  const mono          = initials(venueName);

  // Centre of text block
  const textCY = displaySuburb ? H / 2 - suburbSize * 0.6 : H / 2;

  const gradientId  = `rr-grad-${venueName.replace(/\W/g, "").slice(0, 8)}`;
  const shadowId    = `rr-shadow-${venueName.replace(/\W/g, "").slice(0, 8)}`;
  const clipId      = `rr-clip-${venueName.replace(/\W/g, "").slice(0, 8)}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={alt ?? `${venueName}${suburb ? ` · ${suburb}` : ""} — no photo available`}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <defs>
        {/* Main background gradient: dark bottom-left → light top-right */}
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={BRAND.terracottaDark}  />
          <stop offset="50%"  stopColor={BRAND.terracottaMid}   />
          <stop offset="100%" stopColor={BRAND.terracottaLight} />
        </linearGradient>

        {/* Soft drop shadow for text */}
        <filter id={shadowId} x="-5%" y="-5%" width="110%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
        </filter>

        {/* Clip to rectangle bounds */}
        <clipPath id={clipId}>
          <rect width={W} height={H} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* ── Background ─────────────────────────────────────────────────── */}
        <rect width={W} height={H} fill={`url(#${gradientId})`} />

        {/* Subtle noise texture overlay (diagonal lines) */}
        <rect
          width={W} height={H}
          fill="none"
          stroke={BRAND.terracottaDark}
          strokeWidth={W * 0.6}
          strokeOpacity="0.08"
          strokeDasharray={`${W * 0.015} ${W * 0.02}`}
          transform={`rotate(-35 ${W / 2} ${H / 2})`}
        />

        {/* Corner accent arc */}
        <circle
          cx={0}
          cy={H}
          r={Math.round(Math.min(W, H) * 0.45)}
          fill="none"
          stroke={BRAND.sand}
          strokeWidth="1.5"
          strokeOpacity="0.15"
        />
        <circle
          cx={W}
          cy={0}
          r={Math.round(Math.min(W, H) * 0.3)}
          fill="none"
          stroke={BRAND.sand}
          strokeWidth="1"
          strokeOpacity="0.1"
        />

        {/* ── Background monogram ────────────────────────────────────────── */}
        <text
          x={W / 2}
          y={H / 2 + monogramSize * 0.35}
          textAnchor="middle"
          fontSize={monogramSize}
          fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
          fontWeight="900"
          fill={BRAND.sand}
          fillOpacity="0.08"
          aria-hidden="true"
          style={{ userSelect: "none" }}
        >
          {mono}
        </text>

        {/* ── Venue name ─────────────────────────────────────────────────── */}
        <text
          x={W / 2}
          y={textCY}
          textAnchor="middle"
          fontSize={nameSize}
          fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
          fontWeight="900"
          fill={BRAND.sand}
          filter={`url(#${shadowId})`}
          style={{ userSelect: "none" }}
        >
          {displayName}
        </text>

        {/* ── Suburb ─────────────────────────────────────────────────────── */}
        {displaySuburb && (
          <>
            {/* Subtle divider line */}
            <line
              x1={W / 2 - Math.round(minDim * 0.12)}
              y1={textCY + nameSize * 0.55}
              x2={W / 2 + Math.round(minDim * 0.12)}
              y2={textCY + nameSize * 0.55}
              stroke={BRAND.sand}
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <text
              x={W / 2}
              y={textCY + nameSize * 0.55 + suburbSize * 1.4}
              textAnchor="middle"
              fontSize={suburbSize}
              fontFamily="'Inter', system-ui, -apple-system, sans-serif"
              fontWeight="400"
              fill={BRAND.sand}
              fillOpacity="0.85"
              letterSpacing="0.08em"
              style={{ userSelect: "none" }}
            >
              {displaySuburb.toUpperCase()}
            </text>
          </>
        )}

        {/* ── Wordmark ───────────────────────────────────────────────────── */}
        {showWordmark && (
          <g aria-hidden="true">
            <text
              x={wordmarkX}
              y={wordmarkY}
              textAnchor="end"
              fontSize={wordmarkSize}
              fontFamily="'Inter', system-ui, -apple-system, sans-serif"
              fontWeight="600"
              fill={BRAND.sand}
              fillOpacity="0.55"
              letterSpacing="0.04em"
              style={{ userSelect: "none" }}
            >
              RATINGS
            </text>
            {/* Sage dot */}
            <circle
              cx={wordmarkX - wordmarkSize * 4.7}
              cy={dotY}
              r={dotSize}
              fill={BRAND.sage}
              fillOpacity="0.7"
            />
            <text
              x={wordmarkX - wordmarkSize * 5.3}
              y={wordmarkY}
              textAnchor="end"
              fontSize={wordmarkSize}
              fontFamily="'Inter', system-ui, -apple-system, sans-serif"
              fontWeight="600"
              fill={BRAND.sand}
              fillOpacity="0.55"
              letterSpacing="0.04em"
              style={{ userSelect: "none" }}
            >
              RUB
            </text>
          </g>
        )}
      </g>
    </svg>
  );
};

export default VenuePlaceholderImage;

// ─── Usage with Next.js Image (optional wrapper) ──────────────────────────────
//
// If you need this to behave like <Image fill /> in a positioned container,
// wrap it:
//
//   export function VenuePlaceholderFill(props: Omit<VenuePlaceholderImageProps, "size">) {
//     return (
//       <div style={{ position: "relative", width: "100%", paddingBottom: "75%" }}>
//         <VenuePlaceholderImage
//           {...props}
//           style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
//           width={undefined}
//           height={undefined}
//         />
//       </div>
//     );
//   }
