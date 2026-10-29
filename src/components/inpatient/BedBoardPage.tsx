import { useMemo, useState } from "react"
import type { UserRole } from "../../App"
import {
  bedCounts,
  DEPARTMENTS,
  findRecord,
  ROOMS,
  type Bed,
  type Department,
  type InpatientRecord,
  type InpatientState,
} from "../../lib/inpatient"
import NamedIcon from "../ui/NamedIcon"
import BedCard from "./BedCard"
import WaitingList from "./WaitingList"

function SummaryChip({
  label,
  count,
  tone,
}: {
  label: string
  count: number
  tone: "green" | "blue" | "gray"
}) {
  const styles = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    gray: "border-slate-200 bg-slate-100 text-slate-600",
  }
  return (
    <div
      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${styles[tone]}`}
    >
      {label}: <span className="text-sm">{count}</span>
    </div>
  )
}

const SELECT =
  "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-600"

export default function BedBoardPage({
  state,
  role,
  onAllocate,
  onPickEmptyBed,
  onTransfer,
  onViewRecord,
  onMarkReady,
}: {
  state: InpatientState
  role: UserRole
  onAllocate: (record: InpatientRecord) => void
  onPickEmptyBed: (bed: Bed) => void
  onTransfer: (record: InpatientRecord) => void
  onViewRecord: (record: InpatientRecord) => void
  onMarkReady: (bed: Bed) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState<Department | "">("")
  const [room, setRoom] = useState("")

  const waiting = state.records.filter((record) => record.status === "waiting")
  const counts = bedCounts(state.beds)
  const roomOptions = ROOMS.filter(
    (item) => !department || item.department === department,
  )

  const visibleRooms = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi")
    return ROOMS.filter(
      (item) =>
        (!department || item.department === department) &&
        (!room || item.name === room),
    ).map((item) => ({
      ...item,
      beds: state.beds.filter((candidate) => {
        if (candidate.room !== item.name) return false
        if (!term) return true
        const record = findRecord(state, candidate.recordId ?? "")
        return (
          candidate.code.toLocaleLowerCase("vi").includes(term) ||
          !!record?.patientName.toLocaleLowerCase("vi").includes(term) ||
          !!record?.patientCode.toLocaleLowerCase("vi").includes(term)
        )
      }),
    }))
  }, [state, search, department, room])

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Quản lý giường bệnh
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi công suất và tình trạng giường nội trú
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SummaryChip label="Trống" count={counts.empty} tone="green" />
            <SummaryChip label="Đang sử dụng" count={counts.occupied} tone="blue" />
            <SummaryChip label="Bảo trì" count={counts.maintenance} tone="gray" />
            <div className="ml-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Cập nhật trực tiếp
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row">
          <select
            aria-label="Lọc theo khoa"
            value={department}
            onChange={(event) => {
              setDepartment(event.target.value as Department | "")
              setRoom("")
            }}
            className={SELECT}
          >
            <option value="">Tất cả khoa</option>
            {DEPARTMENTS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Lọc theo phòng"
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            className={SELECT}
          >
            <option value="">Tất cả phòng / khu</option>
            {roomOptions.map((item) => (
              <option key={item.name}>{item.name}</option>
            ))}
          </select>
          <div className="relative flex-1 md:max-w-md">
            <NamedIcon
              name="search"
              className="absolute left-3 top-2.5 size-5 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên bệnh nhân hoặc mã giường"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-3 focus:ring-cyan-100"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        <WaitingList
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          records={waiting}
          role={role}
          onAllocate={onAllocate}
        />
        <div className="min-w-0 flex-1 space-y-6">
          {visibleRooms.map((item) => (
            <section
              key={item.name}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    <NamedIcon name="bed" className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900">{item.name}</h2>
                    <p className="text-xs text-slate-500">{item.area}</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {item.beds.length} giường hiển thị
                </div>
              </div>
              {item.beds.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  {item.beds.map((bed) => {
                    const record = findRecord(state, bed.recordId ?? "")
                    return (
                      <BedCard
                        key={bed.code}
                        bed={bed}
                        record={record}
                        role={role}
                        onPickEmpty={() => onPickEmptyBed(bed)}
                        onViewRecord={() => record && onViewRecord(record)}
                        onTransfer={() => record && onTransfer(record)}
                        onMarkReady={() => onMarkReady(bed)}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 py-10 text-center text-sm text-slate-500">
                  Không tìm thấy giường phù hợp trong phòng này.
                </div>
              )}
            </section>
          ))}
          {visibleRooms.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">
              Không có phòng nào khớp bộ lọc.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
