import { useEffect, useState, type FormEvent } from "react"
import Modal from "./ui/Modal"
import Button from "./ui/Button"
import { TextInput } from "./ui/TextInput"
import {
  PATIENT_ID,
  PATIENT_PHONE,
  PATIENT_CCCD,
  SMS_TEST_CODE,
  validPassword,
  savePatientPassword,
} from "../lib/patientPassword"

export default function PatientPasswordReset({
  onClose,
}: {
  onClose: () => void
}) {
  const [step, setStep] = useState<"identity" | "otp" | "password" | "success">(
    "identity",
  )
  const [identity, setIdentity] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [deadline, setDeadline] = useState(0)
  const [now, setNow] = useState(Date.now)
  const [verifiedUntil, setVerifiedUntil] = useState(0)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000))
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (step !== "success") return
    const timer = window.setTimeout(onClose, 2500)
    return () => window.clearTimeout(timer)
  }, [step, onClose])
  const send = () => {
    setDeadline(Date.now() + 120000)
    setNow(Date.now())
    setOtp("")
    setError("")
    setStep("otp")
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (step === "identity") {
      if (
        ![PATIENT_ID, PATIENT_CCCD].includes(identity.trim().toUpperCase()) ||
        phone.trim() !== PATIENT_PHONE
      ) {
        setError(
          "Không thể xác minh thông tin bệnh nhân và số điện thoại đăng ký.",
        )
        return
      }
      send()
    } else if (step === "otp") {
      if (Date.now() >= deadline) {
        setError("Mã OTP đã hết hạn. Vui lòng gửi lại mã.")
        return
      }
      if (otp !== SMS_TEST_CODE) {
        setError("Mã OTP không chính xác.")
        return
      }
      setVerifiedUntil(Date.now() + 120000)
      setStep("password")
    } else if (step === "password") {
      if (Date.now() >= verifiedUntil) {
        setError("Xác thực đã hết hạn. Vui lòng yêu cầu mã OTP mới.")
        setStep("otp")
        setDeadline(0)
        return
      }
      if (!validPassword(password)) {
        setError(
          "Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.",
        )
        return
      }
      if (password !== confirm) {
        setError("Mật khẩu xác nhận không khớp.")
        return
      }
      try {
        await savePatientPassword(password)
        setPassword("")
        setConfirm("")
        setStep("success")
      } catch {
        setError("Không thể lưu mật khẩu trên trình duyệt. Vui lòng thử lại.")
      }
    }
  }
  return (
    <Modal titleId="reset-title" onClose={onClose} widthClass="max-w-lg">
      <div className="border-b border-border-subtle p-6">
        <h2 id="reset-title" className="text-lg font-semibold">
          Đặt lại mật khẩu bệnh nhân
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Prototype: SMS được mô phỏng trên trình duyệt.
        </p>
      </div>
      <form onSubmit={submit}>
        <div className="space-y-4 p-6">
          {step === "identity" && (
            <>
              <p className="text-xs text-text-muted">
                Dữ liệu minh họa: {PATIENT_ID} hoặc CCCD {PATIENT_CCCD}; SĐT{" "}
                {PATIENT_PHONE}.
              </p>
              <label className="block text-sm">
                Mã bệnh nhân hoặc số CCCD
                <TextInput
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  required
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm">
                Số điện thoại đăng ký
                <TextInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  type="tel"
                  autoComplete="tel"
                />
              </label>
            </>
          )}
          {step === "otp" && (
            <>
              <p className="text-sm">
                Mã SMS gửi đến số ******4567. Mã kiểm thử:{" "}
                <strong>{SMS_TEST_CODE}</strong>.
              </p>
              <p role="timer" className="text-sm">
                Hiệu lực OTP: {seconds} giây
              </p>
              <label className="block text-sm">
                Mã OTP SMS 6 chữ số
                <TextInput
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
              </label>
              <Button variant="ghost" disabled={seconds > 0} onClick={send}>
                Gửi lại mã OTP
              </Button>
            </>
          )}
          {step === "password" && (
            <>
              <p className="text-sm text-text-muted">
                Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
              <label className="block text-sm">
                Mật khẩu mới
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="block text-sm">
                Xác nhận mật khẩu mới
                <TextInput
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
            </>
          )}
          {step === "success" && (
            <p role="status" className="text-normal">
              Đặt lại mật khẩu thành công. Đang trở về màn hình đăng nhập…
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-critical">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle p-4">
          <Button variant="ghost" onClick={onClose}>
            {step === "success" ? "Về đăng nhập" : "Hủy"}
          </Button>
          {step !== "success" && (
            <Button type="submit">
              {step === "identity"
                ? "Gửi mã OTP"
                : step === "otp"
                  ? "Xác minh OTP"
                  : "Lưu mật khẩu mới"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
