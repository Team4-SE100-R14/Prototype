import { useState } from "react"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"
import { TextInput } from "../ui/TextInput"
import type { ClinicalPatient } from "../../lib/clinicalWorkflow"

type ServiceTab = "laboratory" | "imaging"

const SERVICES = {
  laboratory: [
    "Công thức máu toàn phần (CBC)",
    "Sinh hóa máu",
    "Đường huyết",
  ],
  imaging: [
    "Chụp X-quang ngực thẳng",
    "Siêu âm ổ bụng tổng quát",
    "Chụp cắt lớp vi tính lồng ngực",
  ],
}

export default function ClinicalOrderModal({
  patient,
  onClose,
  onSubmitted,
}: {
  patient: ClinicalPatient
  onClose: () => void
  onSubmitted: (submission: {
    diagnosis: string
    services: string[]
  }) => void
}) {
  const [diagnosis, setDiagnosis] = useState("Nghi ngờ viêm phổi")
  const [activeTab, setActiveTab] = useState<ServiceTab>("laboratory")
  const [selected, setSelected] = useState<string[]>([
    "Công thức máu toàn phần (CBC)",
    "Sinh hóa máu",
  ])
  const [error, setError] = useState("")

  const toggleService = (service: string) => {
    setSelected((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service],
    )
    setError("")
  }

  const submit = () => {
    if (!diagnosis.trim()) {
      setError("Vui lòng nhập chẩn đoán sơ bộ.")
      return
    }
    if (!selected.length) {
      setError("Vui lòng chọn ít nhất một dịch vụ.")
      return
    }
    onSubmitted({ diagnosis: diagnosis.trim(), services: selected })
  }

  return (
    <Modal
      titleId="clinical-order-title"
      descriptionId="clinical-order-patient"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
        <div>
          <div
            id="clinical-order-title"
            className="font-display text-xl font-semibold text-text-primary"
          >
            Chỉ định Cận lâm sàng
          </div>
          <div
            id="clinical-order-patient"
            className="mt-2 text-sm text-text-secondary"
          >
            {patient.name} ·{" "}
            <span className="font-mono">{patient.id}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="shrink-0 px-2"
          onClick={onClose}
          aria-label="Đóng hộp thoại"
        >
          <Icon className="h-5 w-5">
            <path d="M6 6l12 12M18 6 6 18" />
          </Icon>
        </Button>
      </div>

      <div className="space-y-6 p-6">
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-surface font-mono text-xs font-bold text-brand-deep">
              01
            </span>
            <div className="font-display text-lg font-semibold text-text-primary">
              Thông tin chung
            </div>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text-secondary">
              Chẩn đoán sơ bộ
            </span>
            <TextInput
              data-initial-focus
              value={diagnosis}
              aria-invalid={!!error && !diagnosis.trim()}
              onChange={(event) => {
                setDiagnosis(event.target.value)
                setError("")
              }}
            />
          </label>
        </section>

        <section className="border-t border-border-subtle pt-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-surface font-mono text-xs font-bold text-brand-deep">
              02
            </span>
            <div>
              <div className="font-display text-lg font-semibold text-text-primary">
                Chọn dịch vụ
              </div>
              <div className="mt-0.5 text-xs text-text-muted">
                Đã chọn {selected.length} dịch vụ
              </div>
            </div>
          </div>

          <div className="mb-4 flex gap-1 border-b border-border-subtle">
            <Button
              variant="ghost"
              className={`rounded-b-none ${
                activeTab === "laboratory"
                  ? "border-b-2 border-brand-primary bg-brand-surface text-brand-deep"
                  : "text-text-muted"
              }`}
              onClick={() => setActiveTab("laboratory")}
            >
              Xét nghiệm
            </Button>
            <Button
              variant="ghost"
              className={`rounded-b-none ${
                activeTab === "imaging"
                  ? "border-b-2 border-brand-primary bg-brand-surface text-brand-deep"
                  : "text-text-muted"
              }`}
              onClick={() => setActiveTab("imaging")}
            >
              Chẩn đoán hình ảnh
            </Button>
          </div>

          <div className="space-y-2">
            {SERVICES[activeTab].map((service) => {
              const checked = selected.includes(service)
              return (
                <Button
                  key={service}
                  variant="ghost"
                  className={`flex w-full items-center gap-3 border p-3 text-left ${
                    checked
                      ? "border-brand-primary bg-brand-surface text-brand-deep"
                      : "border-border-subtle bg-surface text-text-secondary"
                  }`}
                  aria-pressed={checked}
                  onClick={() => toggleService(service)}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? "border-brand-primary bg-brand-primary text-surface"
                        : "border-border-strong bg-surface"
                    }`}
                  >
                    {checked && (
                      <Icon className="h-3.5 w-3.5">
                        <path d="m4 12 5 5L20 6" />
                      </Icon>
                    )}
                  </span>
                  <span className="font-normal">{service}</span>
                </Button>
              )
            })}
          </div>
          <div className="mt-4 rounded-lg border border-info/20 bg-info-bg p-3 text-sm text-info">
            Các dịch vụ đã chọn sẽ được gộp vào một phiếu chỉ định cha và
            chuyển đồng thời sang hàng đợi KTV phù hợp.
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-critical-border bg-critical-bg p-3 text-sm font-semibold text-critical"
          >
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border-subtle bg-canvas px-6 py-4">
        <Button variant="ghost" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={submit}>Gửi chỉ định</Button>
      </div>
    </Modal>
  )
}
