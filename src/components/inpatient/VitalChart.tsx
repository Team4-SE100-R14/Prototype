const LEGENDS = [
  ["Mạch", "bg-cyan-600"],
  ["Huyết áp", "bg-violet-500"],
  ["Nhiệt độ", "bg-amber-500"],
  ["SpO2", "bg-emerald-500"],
]

const DAYS = ["28/09", "29/09", "30/09", "01/10", "02/10", "03/10", "04/10"]

const SERIES = [
  ["55,100 155,88 255,96 355,70 455,80 555,62 680,75", "text-cyan-600"],
  ["55,70 155,76 255,68 355,80 455,60 555,72 680,64", "text-violet-500"],
  ["55,130 155,124 255,132 355,116 455,120 555,112 680,118", "text-amber-500"],
  ["55,48 155,52 255,44 355,55 455,42 555,50 680,46", "text-emerald-500"],
]

export default function VitalChart() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-extrabold text-slate-900">
            Xu hướng sinh hiệu 7 ngày
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Tổng hợp các chỉ số gần nhất theo ngày (dữ liệu minh họa)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {LEGENDS.map(([label, color]) => (
            <div
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
              key={label}
            >
              <span className={`size-2 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox="0 0 720 180"
          className="h-44 min-w-[620px] w-full"
          role="img"
          aria-label="Biểu đồ xu hướng mạch, huyết áp, nhiệt độ và SpO2 trong 7 ngày"
        >
          {[30, 70, 110, 150].map((y) => (
            <line
              key={y}
              x1="45"
              x2="700"
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-slate-100"
            />
          ))}
          {SERIES.map(([points, color]) => (
            <polyline
              key={color}
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={color}
            />
          ))}
          {DAYS.map((day, index) => (
            <text
              key={day}
              x={55 + index * 104}
              y="174"
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-semibold"
            >
              {day}
            </text>
          ))}
        </svg>
      </div>
    </section>
  )
}
