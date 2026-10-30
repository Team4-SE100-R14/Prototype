import { useEffect, useMemo, useState } from "react"
import type { AuthUser } from "../../App"
import {
  acceptClinicalOrder,
  CLINICAL_WORKFLOW_EVENT,
  completeClinicalSubService,
  readClinicalOrders,
  saveClinicalSubServiceDraft,
  type ClinicalOrder,
  type ClinicalOrderStatus,
} from "../../lib/clinicalWorkflow"
import TopNav from "../TopNav"
import Button from "../ui/Button"
import Pagination from "../ui/Pagination"
import { Check, FileText, FlaskConical, Upload } from "lucide-react"
import { TextArea, TextInput } from "../ui/TextInput"

interface Props {
  user: AuthUser
  onLogout: () => void
}

const RESULT_ROWS = [
  {
    key: "rbc",
    label: "Hồng cầu (RBC)",
    value: "4.5",
    unit: "T/L",
    range: "4.0 - 5.8",
  },
  {
    key: "wbc",
    label: "Bạch cầu (WBC)",
    value: "8.2",
    unit: "G/L",
    range: "4.0 - 10.0",
  },
  {
    key: "hgb",
    label: "Huyết sắc tố (HGB)",
    value: "145",
    unit: "g/L",
    range: "130 - 170",
  },
]

export default function ParaclinicalTechDashboard({
  user,
  onLogout,
}: Props) {
  const [page, setPage] = useState<"queue" | "result">("queue")
  const [room, setRoom] = useState("Phòng Xét Nghiệm Máu 01")
  const [status, setStatus] = useState<"all" | ClinicalOrderStatus>("pending")
  const [allOrders, setAllOrders] = useState<ClinicalOrder[]>(
    readClinicalOrders,
  )
  const [selectedOrderId, setSelectedOrderId] = useState("CLS-26-1020")
  const [selectedServiceId, setSelectedServiceId] = useState("DV-1020-02")
  const [results, setResults] = useState<Record<string, string>>(
    Object.fromEntries(RESULT_ROWS.map((row) => [row.key, row.value])),
  )
  const [conclusion, setConclusion] = useState(
    "Các chỉ số huyết học trong giới hạn tham chiếu.",
  )
  const [attachmentName, setAttachmentName] = useState(
    "KetQua_Mau_NguyenVanA.pdf",
  )
  const [notice, setNotice] = useState("")

  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(5)

  const orders = useMemo(
    () => {
      const category = room.includes("Chẩn đoán")
        ? "imaging"
        : "laboratory"
      return allOrders.filter(
        (order) =>
          (status === "all" || order.status === status) &&
          order.services.some((service) => service.category === category),
      )
    },
    [allOrders, room, status],
  )

  useEffect(() => {
    setTablePage(1)
  }, [room, status])

  const totalPages = Math.max(1, Math.ceil(orders.length / tablePageSize))
  const paginatedOrders = useMemo(() => {
    const start = (tablePage - 1) * tablePageSize
    return orders.slice(start, start + tablePageSize)
  }, [orders, tablePage, tablePageSize])
  const selectedOrder =
    allOrders.find((order) => order.id === selectedOrderId) || allOrders[0]
  const selectedService =
    selectedOrder?.services.find(
      (service) => service.id === selectedServiceId,
    ) ||
    selectedOrder?.services.find((service) => service.status !== "completed") ||
    selectedOrder?.services[0]
  const serviceCompleted = selectedService?.status === "completed"
  const pendingCount = allOrders.filter(
    (order) => order.status !== "completed",
  ).length

  useEffect(() => {
    const refresh = () => setAllOrders(readClinicalOrders())
    window.addEventListener(CLINICAL_WORKFLOW_EVENT, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(CLINICAL_WORKFLOW_EVENT, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  const acceptOrder = (order: ClinicalOrder) => {
    acceptClinicalOrder(order.id)
    setSelectedOrderId(order.id)
    setSelectedServiceId(
      order.services.find((service) => service.status !== "completed")?.id ||
        order.services[0].id,
    )
    setAllOrders(readClinicalOrders())
    setNotice("")
    setPage("result")
  }

  if (page === "result") {
    return (
      <div className="min-h-screen bg-canvas pb-28">
        <TopNav
          user={user}
          onLogout={onLogout}
          title="Không gian làm việc KTV Cận lâm sàng"
        />

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-deep">
                Phiếu {selectedOrder.id}
              </div>
              <div className="mt-2 font-display text-3xl font-bold text-text-primary">
                Nhập kết quả CLS: {selectedService.name}
              </div>
              <div className="mt-2 text-sm text-text-muted">
                Ghi nhận kết quả xét nghiệm và hoàn tất phiếu chỉ định.
              </div>
            </div>
            <Button
              variant="ghost"
              className="border border-border-subtle bg-surface"
              onClick={() => setPage("queue")}
            >
              Quay lại hàng đợi
            </Button>
          </div>

          {notice && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-normal/20 bg-normal-bg p-4 text-sm font-semibold text-normal"
            >
              {notice}
            </div>
          )}

          <div className="space-y-6">
            <Section
              number="01"
              title="Thông tin chỉ định"
              description="Thông tin được chuyển từ phiếu chỉ định của bác sĩ."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <ReadOnlyDatum
                  label="Bệnh nhân"
                  value={selectedOrder.patient}
                />
                <ReadOnlyDatum
                  label="Bác sĩ chỉ định"
                  value={selectedOrder.doctor}
                />
                <ReadOnlyDatum
                  label="Chẩn đoán sơ bộ"
                  value={selectedOrder.preliminaryDiagnosis}
                />
              </div>
              <div className="overflow-hidden rounded-xl border border-border-subtle">
                <div className="border-b border-border-subtle bg-subsurface px-4 py-3 text-sm font-semibold text-text-primary">
                  Dịch vụ trong phiếu cha
                </div>
                <div className="divide-y divide-border-subtle">
                  {selectedOrder.services.map((service, index) => (
                    <div
                      key={service.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-surface font-mono text-xs font-bold text-brand-deep">
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">
                            {service.name}
                          </div>
                          <div className="mt-0.5 font-mono text-xs text-text-muted">
                            {service.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={service.status} />
                        <Button
                          variant={
                            selectedService.id === service.id
                              ? "primary"
                              : "ghost"
                          }
                          className={
                            selectedService.id === service.id
                              ? ""
                              : "border border-border-subtle"
                          }
                          onClick={() => {
                            setSelectedServiceId(service.id)
                            setConclusion(
                              service.resultSummary ||
                                "Các chỉ số trong giới hạn tham chiếu.",
                            )
                          }}
                        >
                          {service.status === "completed"
                            ? "Xem kết quả"
                            : "Nhập kết quả"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section
              number="02"
              title="Kết quả chi tiết"
              description="Nhập trị số định lượng theo kết quả từ thiết bị xét nghiệm."
            >
              {selectedService.category === "laboratory" && (
                <div className="overflow-hidden rounded-xl border border-border-subtle">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-3xl text-left text-sm">
                      <thead className="border-b border-border-strong bg-subsurface text-xs uppercase tracking-wide text-text-secondary">
                        <tr>
                          {[
                            "Chỉ số",
                            "Kết quả",
                            "Đơn vị",
                            "Khoảng tham chiếu",
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3 font-semibold"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {RESULT_ROWS.map((row) => (
                          <tr
                            key={row.key}
                            className="border-t border-border-subtle"
                          >
                            <td className="px-4 py-4 font-semibold text-text-primary">
                              {row.label}
                            </td>
                            <td className="px-4 py-4">
                              <TextInput
                                className="w-32 font-mono"
                                disabled={serviceCompleted}
                                value={results[row.key]}
                                aria-label={`Kết quả ${row.label}`}
                                onChange={(event) =>
                                  setResults((current) => ({
                                    ...current,
                                    [row.key]: event.target.value,
                                  }))
                                }
                              />
                            </td>
                            <td className="px-4 py-4 font-mono text-text-secondary">
                              {row.unit}
                            </td>
                            <td className="px-4 py-4 font-mono text-text-secondary">
                              {row.range}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-secondary">
                  {selectedService.category === "imaging"
                    ? "Mô tả hình ảnh / Kết luận của KTV"
                    : "Mô tả / Kết luận của KTV"}
                </span>
                <TextArea
                  rows={5}
                  disabled={serviceCompleted}
                  value={conclusion}
                  onChange={(event) => setConclusion(event.target.value)}
                />
              </label>
            </Section>

            <Section
              number="03"
              title="Đính kèm tệp kết quả"
              description="Tải lên bản kết quả từ máy xét nghiệm hoặc tài liệu liên quan."
            >
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-canvas px-6 py-8 text-center hover:border-brand-primary hover:bg-brand-surface">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,image/*"
                  disabled={serviceCompleted}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) setAttachmentName(file.name)
                  }}
                />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-deep">
                  <Upload aria-hidden="true" strokeWidth={1.75} className="h-6 w-6" />
                </span>
                <span className="mt-3 text-sm font-semibold text-text-primary">
                  Tải lên tệp PDF/Ảnh kết quả
                </span>
                <span className="mt-1 text-xs text-text-muted">
                  Chọn tệp hoặc kéo thả vào khu vực này
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-critical-bg text-critical">
                    <FileText aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text-primary">
                      {selectedOrder.attachments[0] || attachmentName}
                    </div>
                    <div className="mt-0.5 text-xs text-text-muted">
                      Tệp PDF · 1,2 MB
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-normal-bg px-3 py-1 text-xs font-semibold text-normal">
                  Đã tải lên
                </span>
              </div>
            </Section>
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="border border-border-subtle"
              disabled={serviceCompleted}
              onClick={() => {
                saveClinicalSubServiceDraft(
                  selectedOrder.id,
                  selectedService.id,
                  conclusion,
                )
                setAllOrders(readClinicalOrders())
                setNotice(
                  `Đã lưu bản nháp cho dịch vụ ${selectedService.name}.`,
                )
              }}
            >
              Lưu nháp
            </Button>
            <Button
              variant="success"
              disabled={serviceCompleted}
              onClick={() => {
                const updated = completeClinicalSubService({
                  orderId: selectedOrder.id,
                  serviceId: selectedService.id,
                  resultSummary: conclusion,
                  attachment: attachmentName,
                })
                setAllOrders(readClinicalOrders())
                const nextService = updated?.services.find(
                  (service) => service.status !== "completed",
                )
                if (nextService) {
                  setSelectedServiceId(nextService.id)
                  setConclusion(
                    "Các chỉ số trong giới hạn tham chiếu.",
                  )
                  setNotice(
                    `Đã hoàn tất ${selectedService.name}. Phiếu cha vẫn mở vì còn dịch vụ chưa hoàn thành.`,
                  )
                } else {
                  setNotice(
                    "Tất cả dịch vụ con đã hoàn tất. Phiếu cha được tự động đóng và bác sĩ đã nhận thông báo.",
                  )
                }
              }}
            >
              <Check aria-hidden="true" strokeWidth={1.75} className="mr-2 inline h-4 w-4" />
              {serviceCompleted
                ? "Dịch vụ đã hoàn tất"
                : "Lưu & Hoàn tất dịch vụ"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <TopNav
        user={user}
        onLogout={onLogout}
        title="Không gian làm việc KTV Cận lâm sàng"
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-deep">
              <span className="h-2 w-2 rounded-full bg-normal" />
              Phòng kỹ thuật đang hoạt động
            </div>
            <div className="font-display text-3xl font-bold text-text-primary">
              Danh sách Hàng đợi Cận lâm sàng
            </div>
            <div className="mt-2 text-sm text-text-muted">
              Theo dõi, tiếp nhận và xử lý phiếu chỉ định CLS.
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-surface text-brand-deep">
              <FlaskConical aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-medium text-text-muted">
                Số ca cần xử lý
              </div>
              <div className="font-display text-lg font-bold text-text-primary">
                {pendingCount}
              </div>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
          <div className="grid gap-4 border-b border-border-subtle bg-subsurface/60 p-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-secondary">
                Phòng làm việc
              </span>
              <select
                value={room}
                onChange={(event) => setRoom(event.target.value)}
                className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20"
              >
                <option>Phòng Xét Nghiệm Máu 01</option>
                <option>Phòng Xét Nghiệm Máu 02</option>
                <option>Phòng Chẩn đoán hình ảnh 01</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-secondary">
                Trạng thái
              </span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as "all" | ClinicalOrderStatus,
                  )
                }
                className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-3 focus:ring-brand-primary/20"
              >
                <option value="pending">Chờ thực hiện</option>
                <option value="processing">Đang thực hiện</option>
                <option value="completed">Đã hoàn tất</option>
                <option value="all">Tất cả trạng thái</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-5xl text-left text-sm">
              <thead className="border-b border-border-strong bg-subsurface text-xs uppercase tracking-wide text-text-secondary">
                <tr>
                  {[
                    "Mã phiếu CLS",
                    "Họ và tên BN",
                    "Dịch vụ yêu cầu",
                    "Bác sĩ chỉ định",
                    "Trạng thái",
                    "Thao tác",
                  ].map((heading) => (
                    <th key={heading} className="px-5 py-3.5 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-border-subtle transition-colors hover:bg-canvas"
                  >
                    <td className="px-5 py-5 font-mono font-semibold text-brand-deep">
                      {order.id}
                    </td>
                    <td className="px-5 py-5 font-semibold text-text-primary">
                      {order.patient}
                    </td>
                    <td className="px-5 py-5 text-text-secondary">
                      <div className="font-semibold text-text-primary">
                        {order.services.length} dịch vụ
                      </div>
                      <div className="mt-1 text-xs text-text-muted">
                        {order.services.map((service) => service.name).join(", ")}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-text-secondary">
                      {order.doctor}
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-5">
                      <Button
                        disabled={order.status === "completed"}
                        onClick={() => acceptOrder(order)}
                      >
                        {order.status === "processing"
                          ? "Tiếp tục nhập"
                          : "Tiếp nhận"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={tablePage}
            totalPages={totalPages}
            totalItems={orders.length}
            pageSize={tablePageSize}
            onPageChange={setTablePage}
            onPageSizeChange={setTablePageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="phiếu CLS"
          />
        </section>
      </main>
    </div>
  )
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-start gap-4 border-b border-border-subtle p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface font-mono text-sm font-bold text-brand-deep">
          {number}
        </span>
        <div>
          <div className="font-display text-lg font-semibold text-text-primary">
            {title}
          </div>
          <div className="mt-1 text-xs text-text-muted">{description}</div>
        </div>
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  )
}

function ReadOnlyDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-canvas p-4">
      <div className="text-xs font-medium text-text-muted">{label}</div>
      <div className="mt-1 font-semibold text-text-primary">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: ClinicalOrderStatus }) {
  const styles = {
    pending: "bg-warning-bg text-warning",
    processing: "bg-info-bg text-info",
    completed: "bg-normal-bg text-normal",
  }
  const labels = {
    pending: "Chờ thực hiện",
    processing: "Đang thực hiện",
    completed: "Đã hoàn tất",
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
