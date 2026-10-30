const LEGENDS = [
  ["Mạch", "bg-[#0891B2]"],
  ["Huyết áp", "bg-[#4F46E5]"],
  ["Nhiệt độ", "bg-[#D97706]"],
  ["SpO2", "bg-[#059669]"],
] as const

const DAYS = ["28/09", "29/09", "30/09", "01/10", "02/10", "03/10", "04/10"]

const SERIES = [
  ["55,100 155,88 255,96 355,70 455,80 555,62 680,75", "#0891B2"],
  ["55,70 155,76 255,68 355,80 455,60 555,72 680,64", "#4F46E5"],
  ["55,130 155,124 255,132 355,116 455,120 555,112 680,118", "#D97706"],
  ["55,48 155,52 255,44 355,55 455,42 555,50 680,46", "#059669"],
] as const

export default function VitalChart() {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-clinical-xs">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-heading text-base font-semibold text-text-primary">
            Xu hướng sinh hiệu 7 ngày
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Tổng hợp các chỉ số gần nhất theo ngày (dữ liệu minh họa)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {LEGENDS.map(([label, color]) => (
            <div
              className="flex items-center gap-1.5 font-heading text-xs font-semibold text-text-secondary"
              key={label}
            >
              <span className={`size-2.5 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox="0 0 720 180"
          className="h-44 w-full min-w-[620px]"
          role="img"
          aria-label="Biểu đồ xu hướng mạch, huyết áp, nhiệt độ và SpO2 trong 7 ngày"
        >
          {/* Shaded physiological threshold reference bands (MASTER.md Section 7.4) */}
          <rect x="45" y="16" width="655" height="20" fill="rgba(220, 38, 38, 0.06)" />
          <rect x="45" y="36" width="655" height="18" fill="rgba(217, 119, 6, 0.06)" />
          <rect x="45" y="136" width="655" height="18" fill="rgba(217, 119, 6, 0.06)" />

          {[30, 70, 110, 150].map((y) => (
            <line
              key={y}
              x1="45"
              x2="700"
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-border-subtle"
            />
          ))}
          {SERIES.map(([points, stroke]) => {
            const coords = points.split(" ").map((pair) => pair.split(",").map(Number))
            return (
              <g key={stroke}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2"
                />
                {coords.map(([cx, cy], idx) => (
                  <circle
                    key={`${stroke}-${idx}`}
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill="#FFFFFF"
                    stroke={stroke}
                    strokeWidth="2"
                  />
                ))}
              </g>
            )
          })}
          {DAYS.map((day, index) => (
            <text
              key={day}
              x={55 + index * 104}
              y="174"
              textAnchor="middle"
              className="fill-text-muted font-mono text-[11px] font-medium"
            >
              {day}
            </text>
          ))}
        </svg>
      </div>
    </section>
  )
}
