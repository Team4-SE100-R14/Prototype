import { useEffect, useState, type ReactNode } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import Tooltip from "./Tooltip"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
  itemLabel?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = "",
  itemLabel = "bản ghi",
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const safeCurrentPage = Math.min(safeTotalPages, Math.max(1, currentPage))

  const [inputVal, setInputVal] = useState<string>(String(safeCurrentPage))

  useEffect(() => {
    setInputVal(String(safeCurrentPage))
  }, [safeCurrentPage])

  const start = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const end = Math.min(safeCurrentPage * pageSize, totalItems)

  const isFirst = safeCurrentPage <= 1
  const isLast = safeCurrentPage >= safeTotalPages

  const goTo = (p: number) => {
    const target = Math.min(safeTotalPages, Math.max(1, p))
    if (target !== safeCurrentPage) {
      onPageChange(target)
    }
  }

  const handleInputCommit = () => {
    const val = parseInt(inputVal, 10)
    if (!Number.isNaN(val)) {
      goTo(val)
    } else {
      setInputVal(String(safeCurrentPage))
    }
  }

  return (
    <footer
      className={`flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle bg-canvas px-4 py-3 text-xs text-text-muted ${className}`}
      aria-label="Điều hướng phân trang"
    >
      {/* Items Summary Readout */}
      <div className="font-sans text-text-secondary">
        {totalItems === 0 ? (
          <span>Không có {itemLabel} nào</span>
        ) : (
          <span>
            Hiển thị <strong className="font-mono text-text-primary tabular-nums">{start}</strong> –{" "}
            <strong className="font-mono text-text-primary tabular-nums">{end}</strong> trên{" "}
            <strong className="font-mono text-text-primary tabular-nums">{totalItems}</strong> {itemLabel}
          </span>
        )}
      </div>

      {/* Controls: Page size + First, Prev, Direct Page Input, Next, Last */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Page size selector */}
        <label className="flex items-center gap-1.5 text-text-secondary">
          <span className="hidden sm:inline">Số dòng:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value))
              onPageChange(1)
            }}
            aria-label="Số bản ghi trên mỗi trang"
            className="cursor-pointer rounded-lg border border-border-subtle bg-surface px-2.5 py-1 font-mono text-xs text-text-primary shadow-clinical-xs focus:border-brand-primary focus:outline-none"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        </label>

        <div className="h-4 w-px bg-border-subtle hidden sm:block" aria-hidden="true" />

        {/* Navigation Buttons: First <<, Prev < */}
        <div className="flex items-center gap-1">
          <Tooltip content="Về trang đầu">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => goTo(1)}
              aria-label="Trang đầu"
              className="interactive-tactile flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary shadow-clinical-xs transition-colors hover:bg-subsurface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsLeft className="size-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Trang trước">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => goTo(safeCurrentPage - 1)}
              aria-label="Trang trước"
              className="interactive-tactile flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary shadow-clinical-xs transition-colors hover:bg-subsurface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Direct Page Input Selector */}
        <label className="flex items-center gap-1.5 text-text-secondary">
          <span className="text-[11px] font-medium text-text-muted">Trang</span>
          <input
            type="number"
            min={1}
            max={safeTotalPages}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleInputCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleInputCommit()
              }
            }}
            aria-label="Nhập số trang để chuyển đến"
            className="w-12 rounded-lg border border-border-subtle bg-surface px-1.5 py-1 text-center font-mono text-xs font-semibold text-text-primary shadow-clinical-xs focus:border-brand-primary focus:outline-none"
          />
          <span className="font-mono text-text-muted tabular-nums">/ {safeTotalPages}</span>
        </label>

        {/* Navigation Buttons: Next >, Last >> */}
        <div className="flex items-center gap-1">
          <Tooltip content="Trang sau">
            <button
              type="button"
              disabled={isLast}
              onClick={() => goTo(safeCurrentPage + 1)}
              aria-label="Trang sau"
              className="interactive-tactile flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary shadow-clinical-xs transition-colors hover:bg-subsurface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Đến trang cuối">
            <button
              type="button"
              disabled={isLast}
              onClick={() => goTo(safeTotalPages)}
              aria-label="Trang cuối"
              className="interactive-tactile flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary shadow-clinical-xs transition-colors hover:bg-subsurface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </footer>
  )
}

