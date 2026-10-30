import { useEffect, useMemo, useRef, useState } from "react"
import type { AuthUser } from "../../App"
import {
  addEncounterAddendum,
  CLINICAL_WORKFLOW_EVENT,
  createClinicalOrders,
  getClinicalPatient,
  lockEncounter,
  readClinicalOrders,
  readEncounter,
  saveEncounterDraft,
  type ClinicalOrder,
} from "../../lib/clinicalWorkflow"
import useInpatient from "../../hooks/useInpatient"
import { activeRecordFor, canAdmit } from "../../lib/inpatient"
import AdmissionModal from "../inpatient/AdmissionModal"
import Button from "../ui/Button"
import Tooltip from "../ui/Tooltip"
import { AlertTriangle, Check, Lock, Plus, Search } from "lucide-react"
import { TextArea, TextInput } from "../ui/TextInput"
import ClinicalOrderModal from "./ClinicalOrderModal"
import DoctorEncounterHeader from "./DoctorEncounterHeader"
import MedicalRecordAddendumModal from "./MedicalRecordAddendumModal"

export default function ClinicalExamPage({
  user,
  onLogout,
  patientId,
  onBackToQueue,
  onOpenPrescription,
  embedded = false,
  onDirtyChange,
  saveDraftRequest = 0,
  discardDraftRequest = 0,
}: {
  user: AuthUser
  onLogout: () => void
  patientId: string
  onBackToQueue: () => void
  onOpenPrescription: () => void
  embedded?: boolean
  onDirtyChange?: (dirty: boolean) => void
  saveDraftRequest?: number
  discardDraftRequest?: number
}) {
  const patient = getClinicalPatient(patientId)
  const initialEncounter = readEncounter(patient)
  const [symptoms, setSymptoms] = useState(initialEncounter.symptoms)
  const [diagnosis, setDiagnosis] = useState(initialEncounter.diagnosis)
  const [finalDiagnosis, setFinalDiagnosis] = useState(
    initialEncounter.finalDiagnosis ?? "",
  )
  const [conclusion, setConclusion] = useState(initialEncounter.conclusion)
  const [locked, setLocked] = useState(initialEncounter.locked)
  const [addenda, setAddenda] = useState(initialEncounter.addenda)
  const [orders, setOrders] = useState<ClinicalOrder[]>(readClinicalOrders)
  const [orderOpen, setOrderOpen] = useState(false)
  const [addendumOpen, setAddendumOpen] = useState(false)
  const [admissionOpen, setAdmissionOpen] = useState(false)
  const inpatient = useInpatient()
  const activeAdmission = activeRecordFor(inpatient, patient.id)
  const [notice, setNotice] = useState("")
  const [draftDirty, setDraftDirty] = useState(false)
  const lastSaveRequest = useRef(saveDraftRequest)
  const lastDiscardRequest = useRef(discardDraftRequest)
  const completedOrderIds = useRef(
    new Set(
      readClinicalOrders()
        .filter(
          (order) =>
            order.patientId === patient.id && order.status === "completed",
        )
        .map((order) => order.id),
    ),
  )

  const patientOrders = useMemo(
    () => orders.filter((order) => order.patientId === patient.id),
    [orders, patient.id],
  )
  const awaitingResults = patientOrders.some(
    (order) => order.status !== "completed",
  )
  const hasCompletedResult = patientOrders.some(
    (order) => order.status === "completed",
  )

  useEffect(() => {
    const refresh = () => {
      const nextOrders = readClinicalOrders()
      const newlyCompleted = nextOrders.find(
        (order) =>
          order.patientId === patient.id &&
          order.status === "completed" &&
          !completedOrderIds.current.has(order.id),
      )
      completedOrderIds.current = new Set(
        nextOrders
          .filter(
            (order) =>
              order.patientId === patient.id && order.status === "completed",
          )
          .map((order) => order.id),
      )
      setOrders(nextOrders)
      if (newlyCompleted) {
        setNotice(
          `Đã nhận đủ kết quả phiếu ${newlyCompleted.id}. Bạn có thể hoàn thiện kết luận và ký duyệt lượt khám.`,
        )
      }
      const encounter = readEncounter(patient)
      setLocked(encounter.locked)
      setAddenda(encounter.addenda)
      if (encounter.locked) {
        setSymptoms(encounter.symptoms)
        setDiagnosis(encounter.diagnosis)
        setFinalDiagnosis(encounter.finalDiagnosis ?? "")
        setConclusion(encounter.conclusion)
      }
    }
    window.addEventListener(CLINICAL_WORKFLOW_EVENT, refresh)
    window.addEventListener("storage", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener(CLINICAL_WORKFLOW_EVENT, refresh)
      window.removeEventListener("storage", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [patient])

  const sealedFinal = !locked && (awaitingResults || !hasCompletedResult)

  useEffect(() => {
    onDirtyChange?.(draftDirty && !locked)
  }, [draftDirty, locked, onDirtyChange])

  useEffect(() => {
    if (saveDraftRequest === lastSaveRequest.current) return
    lastSaveRequest.current = saveDraftRequest
    if (
      saveEncounterDraft(patient.id, {
        symptoms,
        diagnosis,
        finalDiagnosis,
        conclusion,
      })
    ) {
      setDraftDirty(false)
      setNotice("Đã lưu bản nháp phiếu khám.")
    }
  }, [conclusion, diagnosis, finalDiagnosis, patient.id, saveDraftRequest, symptoms])

  useEffect(() => {
    if (discardDraftRequest === lastDiscardRequest.current) return
    lastDiscardRequest.current = discardDraftRequest
    const encounter = readEncounter(patient)
    setSymptoms(encounter.symptoms)
    setDiagnosis(encounter.diagnosis)
    setFinalDiagnosis(encounter.finalDiagnosis ?? "")
    setConclusion(encounter.conclusion)
    setDraftDirty(false)
  }, [discardDraftRequest, patient])

  const completeExam = () => {
    if (awaitingResults || !hasCompletedResult) {
      setNotice(
        "Chưa thể ký duyệt: cần nhận đầy đủ kết quả cận lâm sàng trước khi hoàn tất khám.",
      )
      return
    }
    if (!finalDiagnosis.trim()) {
      setNotice("Chưa thể ký duyệt: cần chọn mã ICD-10 chẩn đoán xác định ở phần Kết luận.")
      return
    }
    lockEncounter(patient.id, { symptoms, diagnosis, finalDiagnosis, conclusion })
    setLocked(true)
    setDraftDirty(false)
    setNotice(
      "Phiếu khám đã được ký duyệt và khóa bất biến. Mọi thay đổi tiếp theo phải được lưu dưới dạng phụ lục.",
    )
  }

  return (
    <div className={`${embedded ? "min-h-full" : "min-h-screen"} bg-canvas pb-28`}>
      <DoctorEncounterHeader
        user={user}
        onLogout={onLogout}
        patient={patient}
        status={locked ? "Đã khóa" : "Đang khám"}
        embedded={embedded}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {!embedded && <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-border-subtle">
          <Button
            variant="ghost"
            className="rounded-b-none border-b-2 border-brand-primary bg-brand-surface text-brand-deep shadow-none"
          >
            Phiếu khám
          </Button>
          <Button
            variant="ghost"
            className="rounded-b-none text-text-muted"
            onClick={onOpenPrescription}
          >
            Kê đơn điện tử
          </Button>
          <Button
            variant="ghost"
            className="ml-auto rounded-b-none text-text-muted"
            onClick={onBackToQueue}
          >
            Quay lại hàng đợi
          </Button>
        </div>}

        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-deep">
            Mã phiếu {patient.encounterId}
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-text-primary">
            Phiếu Khám Bệnh: BN {patient.name}
          </div>
          <div className="mt-2 text-sm text-text-muted">
            Ghi nhận thông tin khám, chẩn đoán và kết luận điều trị.
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-normal/20 bg-normal-bg p-4 text-sm font-semibold text-normal"
          >
            <Check aria-hidden="true" strokeWidth={1.75} className="h-5 w-5 shrink-0" />
            {notice}
          </div>
        )}

        <div className="space-y-6">
          <ClinicalSection
            number="01"
            title="Thông tin bệnh nhân"
            description="Thông tin định danh của bệnh nhân."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <PatientDatum label="Họ và tên" value={patient.name} />
              <PatientDatum label="Mã bệnh nhân" value={patient.id} mono />
              <PatientDatum
                label="Tuổi & Giới tính"
                value={`${patient.age} tuổi · ${patient.gender}`}
              />
              <PatientDatum label="Phòng khám" value={patient.room} />
            </div>
          </ClinicalSection>

          <ClinicalSection
            number="02"
            title="Hồ sơ sức khỏe"
            description="Tự động truy vấn khi gọi bệnh nhân · Chỉ đọc"
            action={
              <Tooltip content="Dữ liệu từ hồ sơ bệnh nhân. Không chỉnh sửa trực tiếp.">
                <span className="cursor-help inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-canvas px-3 py-1 text-xs font-semibold text-text-secondary">
                  <Lock aria-hidden="true" strokeWidth={2} className="h-3.5 w-3.5" />
                  Chỉ đọc
                </span>
              </Tooltip>
            }
          >
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                Tiền sử dị ứng thuốc
              </div>
              {patient.allergyAlert ? (
              <Tooltip
                content="Tiền sử dị ứng: Hệ thống sẽ chặn nếu kê thuốc chứa hoạt chất này."
                className="w-full"
              >
                <div
                  role="alert"
                  className="w-full cursor-help flex items-start gap-3 rounded-xl border border-critical-border bg-critical-bg p-4 text-critical interactive-peek"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-critical text-surface">
                    <AlertTriangle aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-bold">Cảnh báo dị ứng:</div>
                    <div className="mt-1 text-sm font-medium">
                      {patient.allergyAlert}
                    </div>
                  </div>
                </div>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-normal/20 bg-normal-bg p-4 text-normal">
                <Check aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  Chưa ghi nhận tiền sử dị ứng.
                </span>
              </div>
            )}
            </div>
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                Tiền sử bệnh
              </div>
              <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                {patient.medicalHistory.map((item) => (
                  <li key={item.condition} className="flex gap-4 p-4">
                    <span className="w-20 shrink-0 font-mono text-xs font-semibold text-text-muted">
                      {item.period}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">
                        {item.condition}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {item.note}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </ClinicalSection>

          <ClinicalSection
            number="03"
            title="Khám lâm sàng"
            description="Ghi nhận triệu chứng và chọn mã ICD-10 chẩn đoán sơ bộ."
          >
            <Field label="Triệu chứng lâm sàng">
              <TextArea
                rows={5}
                value={symptoms}
                disabled={locked}
                onChange={(event) => {
                  setSymptoms(event.target.value)
                  setDraftDirty(true)
                }}
              />
            </Field>
            <Field label="Chẩn đoán sơ bộ (ICD-10)">
              <IcdPicker
                value={diagnosis}
                disabled={locked}
                suggested="J00"
                onChange={(value) => {
                  setDiagnosis(value)
                  setDraftDirty(true)
                }}
              />
              <div className="mt-2 text-xs text-text-muted">
                Dựa trên đánh giá triệu chứng lâm sàng, trước khi có kết quả cận lâm sàng.
              </div>
            </Field>
          </ClinicalSection>

          <ClinicalSection
            number="04"
            title="Cận lâm sàng"
            description="Theo dõi chỉ định và kết quả cận lâm sàng."
            action={
              <Button
                variant="ghost"
                className="border border-brand-primary bg-brand-surface text-brand-deep"
                disabled={locked}
                onClick={() => setOrderOpen(true)}
              >
                <Plus aria-hidden="true" strokeWidth={1.75} className="mr-2 inline h-4 w-4" />
                Chỉ định CLS mới
              </Button>
            }
          >
            <div className="overflow-hidden rounded-xl border border-border-subtle">
              <div className="overflow-x-auto">
                <table className="w-full min-w-2xl text-left text-sm">
                  <thead className="bg-subsurface text-xs uppercase tracking-wide text-text-muted">
                    <tr>
                      {["Phiếu cha / Dịch vụ", "Trạng thái", "Kết quả"].map((heading) => (
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
                    {patientOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-border-subtle"
                      >
                        <td className="px-4 py-4">
                          <div className="font-semibold text-text-primary">
                            {order.id} · {order.services.length} dịch vụ
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {order.services.map((service) => (
                              <div
                                key={service.id}
                                className="flex flex-wrap items-center gap-2 text-xs text-text-secondary"
                              >
                                <span>{service.name}</span>
                                <OrderStatusBadge status={service.status} />
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-4">
                          {order.status === "completed" ? (
                            <Button
                              variant="ghost"
                              className="px-0 text-brand-deep underline"
                              onClick={() =>
                                setNotice(
                                  order.resultSummary ||
                                    "Kết quả đã được trả về từ phòng kỹ thuật.",
                                )
                              }
                            >
                              Xem chi tiết
                            </Button>
                          ) : (
                            <span className="text-text-muted">
                              Chưa có kết quả
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!patientOrders.length && (
                  <div className="p-8 text-center text-sm text-text-muted">
                    Chưa có chỉ định cận lâm sàng.
                  </div>
                )}
              </div>
            </div>
          </ClinicalSection>

          <ClinicalSection
            number="05"
            title="Kết luận"
            description="Chọn chẩn đoán xác định sau cận lâm sàng và hoàn thiện kết luận."
          >
            <Field label="Chẩn đoán xác định (ICD-10)">
              {sealedFinal ? (
                <div className="rounded-lg border border-border-subtle bg-canvas p-4 text-sm text-text-muted">
                  Chọn sau khi nhận đủ kết quả cận lâm sàng.
                  {diagnosis && (
                    <div className="mt-1 text-xs">
                      Chẩn đoán sơ bộ hiện tại: <span className="font-semibold text-text-secondary">{diagnosis}</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <IcdPicker
                    value={finalDiagnosis}
                    disabled={locked}
                    onChange={(value) => {
                      setFinalDiagnosis(value)
                      setDraftDirty(true)
                    }}
                  />
                  {diagnosis && finalDiagnosis && diagnosis !== finalDiagnosis && (
                    <div className="mt-2 text-xs text-warning">
                      Khác chẩn đoán sơ bộ: {diagnosis}
                    </div>
                  )}
                </>
              )}
            </Field>
            <Field label="Kết luận điều trị">
              <TextArea
                rows={5}
                value={conclusion}
                disabled={locked}
                onChange={(event) => {
                  setConclusion(event.target.value)
                  setDraftDirty(true)
                }}
              />
            </Field>
            {locked && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-strong border-l-4 border-l-text-secondary bg-subsurface p-4">
                  <div>
                    <div className="font-heading font-semibold text-text-primary">
                      Bệnh án đã được khóa bất biến
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">
                      Dữ liệu gốc chỉ đọc. Có thể bổ sung thông tin bằng phụ
                      lục.
                    </div>
                  </div>
                  <Button onClick={() => setAddendumOpen(true)}>
                    Thêm phụ lục bệnh án
                  </Button>
                </div>
                {addenda.map((addendum, index) => (
                  <div
                    key={addendum.id}
                    className="rounded-xl border border-border-subtle border-l-4 border-l-brand-primary bg-surface p-4 shadow-clinical-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-text-primary">
                        Phụ lục {index + 1}
                      </div>
                      <div className="text-xs text-text-muted">
                        {addendum.createdAt}
                      </div>
                    </div>
                    <div className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {addendum.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ClinicalSection>
        </div>
      </main>

      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6 ${embedded ? "lg:left-60" : ""}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <Lock aria-hidden="true" strokeWidth={1.75} className="h-4 w-4" />
            {awaitingResults || !hasCompletedResult
              ? "Đang chờ đầy đủ kết quả CLS trước khi ký duyệt."
              : "Sau khi ký duyệt, phiếu khám không thể chỉnh sửa trực tiếp."}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBackToQueue}>
              Hủy
            </Button>
            {canAdmit(user.role) && (
              <Button
                variant="secondary"
                onClick={() => setAdmissionOpen(true)}
                title={
                  activeAdmission
                    ? `Đang có bệnh án nội trú ${activeAdmission.id}`
                    : undefined
                }
              >
                {activeAdmission
                  ? `Nội trú: ${activeAdmission.id}`
                  : "Chỉ định nhập viện"}
              </Button>
            )}
            <Button
              variant="ghost"
              className="border border-border-subtle"
              disabled={locked || !draftDirty}
              onClick={() => {
                if (
                  saveEncounterDraft(patient.id, {
                    symptoms,
                    diagnosis,
                    finalDiagnosis,
                    conclusion,
                  })
                ) {
                  setDraftDirty(false)
                  setNotice("Đã lưu bản nháp phiếu khám.")
                }
              }}
            >
              Lưu nháp
            </Button>
            <Button
              variant="success"
              disabled={locked}
              onClick={completeExam}
              title={
                awaitingResults || !hasCompletedResult
                  ? "Cần nhận đầy đủ kết quả CLS trước khi ký duyệt"
                  : undefined
              }
            >
              <Check aria-hidden="true" strokeWidth={1.75} className="mr-2 inline h-4 w-4" />
              {locked ? "Phiếu khám đã khóa" : "Ký duyệt & Hoàn tất khám"}
            </Button>
          </div>
        </div>
      </div>

      {orderOpen && (
        <ClinicalOrderModal
          patient={patient}
          onClose={() => setOrderOpen(false)}
          onSubmitted={({ diagnosis: preliminaryDiagnosis, services }) => {
            const created = createClinicalOrders({
              patient,
              doctor: user.name,
              diagnosis: preliminaryDiagnosis,
              services,
            })
            setOrders(readClinicalOrders())
            setOrderOpen(false)
            setNotice(
              `Đã tạo phiếu cha ${created.id} gồm ${created.services.length} dịch vụ và chuyển ngay sang hàng đợi KTV.`,
            )
          }}
        />
      )}

      {admissionOpen && (
        <AdmissionModal
          patient={{
            code: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            encounterId: patient.encounterId,
          }}
          user={user}
          defaultIcd={
            (finalDiagnosis || diagnosis).match(/^([A-Z]\d{2}(?:\.\d+)?)\s*-/)?.[1] ?? ""
          }
          defaultDiagnosis={(finalDiagnosis || diagnosis).replace(/^[A-Z]\d{2}(?:\.\d+)?\s*-\s*/, "")}
          onClose={() => setAdmissionOpen(false)}
          onSuccess={(record) => {
            setAdmissionOpen(false)
            setNotice(
              `Đã tạo bệnh án nội trú ${record.id}. ${patient.name} đã vào hàng chờ xếp giường (${record.department}); mở mục Nội trú để xếp giường.`,
            )
          }}
        />
      )}

      {addendumOpen && (
        <MedicalRecordAddendumModal
          patientName={patient.name}
          encounterId={patient.encounterId}
          onClose={() => setAddendumOpen(false)}
          onSave={(content) => {
            addEncounterAddendum(patient.id, content)
            setAddenda(readEncounter(patient).addenda)
            setAddendumOpen(false)
            setNotice(
              "Đã lưu phụ lục bệnh án. Nội dung gốc vẫn được giữ nguyên.",
            )
          }}
        />
      )}
    </div>
  )
}

function ClinicalSection({
  number,
  title,
  description,
  action,
  children,
}: {
  number: string
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex flex-wrap items-start gap-4 border-b border-border-subtle p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-surface font-mono text-sm font-bold text-brand-deep">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-semibold text-text-primary">
            {title}
          </div>
          <div className="mt-1 text-xs text-text-muted">{description}</div>
        </div>
        {action}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  )
}

function OrderStatusBadge({ status }: { status: ClinicalOrder["status"] }) {
  const styles = {
    pending: "bg-warning-bg text-warning",
    processing: "bg-info-bg text-info",
    completed: "bg-normal-bg text-normal",
  }
  const labels = {
    pending: "Chờ thực hiện",
    processing: "Đang thực hiện",
    completed: "Đã có kết quả",
  }
  const explanations = {
    pending: "Chờ thực hiện: Y lệnh đã gửi sang phòng cận lâm sàng, đang chờ tiếp nhận bệnh nhân/mẫu",
    processing: "Đang thực hiện: Kỹ thuật viên đang tiến hành xét nghiệm / chụp chiếu",
    completed: "Đã có kết quả: Đã hoàn tất và ký duyệt, sẵn sàng đối chiếu kết luận",
  }

  return (
    <Tooltip content={explanations[status]}>
      <span
        className={`cursor-help inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
      >
        {labels[status]}
      </span>
    </Tooltip>
  )
}

function PatientDatum({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-canvas p-4">
      <div className="text-xs font-medium text-text-muted">{label}</div>
      <div
        className={`mt-1 font-semibold text-text-primary ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text-secondary">
        {label}
      </span>
      {children}
    </label>
  )
}

const ICD_OPTIONS: Array<[string, string]> = [
  ["J00", "Viêm mũi họng cấp"],
  ["J02", "Viêm họng cấp"],
  ["J18.9", "Viêm phổi, không xác định tác nhân"],
  ["I10", "Tăng huyết áp vô căn"],
  ["E11.9", "Đái tháo đường típ 2 không biến chứng"],
  ["K29.7", "Viêm dạ dày, không xác định"],
  ["R07.4", "Đau ngực, không đặc hiệu"],
]

function IcdPicker({
  value,
  onChange,
  disabled,
  suggested,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  suggested?: string
}) {
  return (
    <>
      <div className="relative">
        <Search aria-hidden="true" strokeWidth={1.75} className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
        <TextInput
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10"
          placeholder="Nhập mã hoặc tên bệnh"
        />
      </div>
      {!disabled && (
        <div className="mt-2 overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-lg">
          {ICD_OPTIONS.map(([code, label], index) => {
            const isSuggested = code === suggested
            return (
              <Button
                key={code}
                variant="ghost"
                className={`flex w-full items-center justify-between rounded-none px-4 py-3 text-left ${
                  index ? "border-t border-border-subtle" : ""
                } ${isSuggested ? "border-l-4 border-l-brand-primary bg-brand-surface text-brand-deep" : ""}`}
                onClick={() => onChange(`${code} - ${label}`)}
              >
                <span>
                  <span className="font-mono font-bold">{code}</span>
                  {` - ${label}`}
                </span>
                {isSuggested && (
                  <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs text-surface">
                    Gợi ý phù hợp
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      )}
    </>
  )
}
