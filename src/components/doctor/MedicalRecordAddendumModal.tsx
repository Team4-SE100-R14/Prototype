import { useState } from "react"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"
import { TextArea } from "../ui/TextInput"

export default function MedicalRecordAddendumModal({
  patientName,
  encounterId,
  onClose,
  onSave,
}: {
  patientName: string
  encounterId: string
  onClose: () => void
  onSave: (content: string) => void
}) {
  const [content, setContent] = useState(
    "Bệnh nhân báo cáo thêm tình trạng đau dạ dày nhẹ sau khi uống thuốc...",
  )

  return (
    <Modal
      titleId="medical-record-addendum-title"
      descriptionId="medical-record-addendum-warning"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
        <div>
          <div
            id="medical-record-addendum-title"
            className="font-display text-xl font-semibold text-text-primary"
          >
            Thêm phụ lục bệnh án
          </div>
          <div className="mt-1 text-sm text-text-muted">
            Phiếu khám {encounterId} · {patientName}
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

      <div className="space-y-5 p-6">
        <div
          id="medical-record-addendum-warning"
          className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-bg p-4 text-sm leading-relaxed text-warning"
        >
          <Icon className="mt-0.5 h-5 w-5 shrink-0">
            <path d="M12 3 2.7 20h18.6L12 3Z" />
            <path d="M12 9v4M12 17h.01" />
          </Icon>
          <div>
            <span className="font-bold">Lưu ý:</span> Phiếu khám gốc đã bị
            khóa bất biến. Bất kỳ thông tin bổ sung nào sẽ được lưu dưới dạng
            phụ lục và không ghi đè dữ liệu cũ.
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-text-secondary">
            Nội dung bổ sung
          </span>
          <TextArea
            data-initial-focus
            rows={7}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle bg-canvas px-6 py-4">
        <Button variant="ghost" onClick={onClose}>
          Hủy
        </Button>
        <Button
          disabled={!content.trim()}
          onClick={() => onSave(content.trim())}
        >
          Lưu phụ lục
        </Button>
      </div>
    </Modal>
  )
}
