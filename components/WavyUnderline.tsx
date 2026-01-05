import React from "react";

interface WavyUnderlineProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  style?: number;
  thickness?: number;
  outlineColor?: string;
  outlineThickness?: number;
}

const underlineStyles = [
  "M4,4 Q9,0 14,4 T24,4 T34,4 T44,4",
  "M4,3 Q14,6 24,3 T44,3",
  "M4,4 Q12,1 20,4 T36,4 T52,4",
  "M4,3 C14,10 19,-4 44,3",
  "M4,4 Q14,0 24,4 Q34,8 44,4",
  "M4,4 Q14,0 24,8 T44,4",
  "M4,4 Q12,0 20,8 T36,0 T52,8",
  "M4,5 L44,5",
];

export function WavyUnderline({
  children,
  className = "",
  color = "text-purple-500",
  style,
  thickness = 1.5,
  outlineColor = "white",
  outlineThickness = 0.5,
}: WavyUnderlineProps) {
  const selectedStyle =
    style !== undefined && style >= 0 && style < underlineStyles.length
      ? underlineStyles[style]
      : underlineStyles[Math.floor(Math.random() * underlineStyles.length)];

  return (
    <span className={`relative inline-block ${className}`}>
      <span
        className="relative z-10"
        style={{
          textShadow: `
            ${outlineThickness}px ${outlineThickness}px 0 ${outlineColor},
            -${outlineThickness}px ${outlineThickness}px 0 ${outlineColor},
            ${outlineThickness}px -${outlineThickness}px 0 ${outlineColor},
            -${outlineThickness}px -${outlineThickness}px 0 ${outlineColor}
          `,
        }}
      >
        {children}
      </span>
      <svg
        className={`absolute left-0 w-full ${color}`}
        viewBox="0 0 48 16"
        preserveAspectRatio="none"
        style={{
          height: "0.5em",
          bottom: "-0.35em",
          zIndex: 0,
          left: "-0.1em",
          right: "-0.1em",
          width: "calc(100% + 0.2em)",
        }}
      >
        <g transform="translate(0, 4)">
          <path
            d={selectedStyle
              .replace(/M2,/g, "M4,")
              .replace(/T\d+,/g, (match) => `T${parseInt(match.slice(1)) + 2},`)
              .replace(/L\d+,/g, "L44,")}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
    </span>
  );
}
