import { useEffect, useMemo, useState } from "react"
import type { AuthUser } from "../../App"
import TopNav from "../TopNav"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Modal from "../ui/Modal"
import { TextArea, TextInput } from "../ui/TextInput"

type Drug = {
  code: string
  name: string
  ingredient: string
  form: string
  strength: string
  unit: string
  inactive?: boolean
}
type Line = Drug & {
  quantity: number
  dose: string
  route: string
  directions: string
  duration: string
}
type Scenario = "empty" | "mine" | "other" | "locked" | "finished"
type Status = "draft" | "locked" | "cancelled"
type RxService = "normal" | "timeout" | "cache"
type Severity = "critical" | "moderate" | "minor"
type Interaction = { severity: Severity; pair: string; text: string; affected: string[] }
type ModalKind =
  | "delete"
  | "cancel"
  | "allergy"
  | "critical"
  | "moderate"
  | "minor"
  | "lock"
  | "replacement"
  | null

const FORMULARY: Drug[] = [
  { code: "TH-0001", name: "Augmentin 625mg", ingredient: "Amoxicillin", form: "Viên nén bao phim", strength: "625 mg", unit: "Viên" },
  { code: "TH-0002", name: "Klamentin 1g", ingredient: "Amoxicillin", form: "Viên nén", strength: "1 g", unit: "Viên" },
  { code: "TH-0003", name: "Coumadin 5mg", ingredient: "Warfarin", form: "Viên nén", strength: "5 mg", unit: "Viên" },
  { code: "TH-0004", name: "Aspirin 81mg", ingredient: "Aspirin", form: "Viên nén bao tan ở ruột", strength: "81 mg", unit: "Viên" },
  { code: "TH-0005", name: "Amlodipine 5mg", ingredient: "Amlodipine", form: "Viên nén", strength: "5 mg", unit: "Viên" },
  { code: "TH-0006", name: "Zocor 20mg", ingredient: "Simvastatin", form: "Viên nén", strength: "20 mg", unit: "Viên" },
  { code: "TH-0007", name: "Panadol 500mg", ingredient: "Paracetamol", form: "Viên nén", strength: "500 mg", unit: "Viên" },
  { code: "TH-0008", name: "Primperan 10mg", ingredient: "Metoclopramide", form: "Viên nén", strength: "10 mg", unit: "Viên" },
  { code: "TH-0009", name: "Losec 20mg", ingredient: "Omeprazole", form: "Viên nang", strength: "20 mg", unit: "Viên" },
  { code: "TH-0010", name: "Metformin 850mg", ingredient: "Metformin", form: "Viên nén", strength: "850 mg", unit: "Viên" },
  { code: "TH-0011", name: "Ranitidine 150mg", ingredient: "Ranitidine", form: "Viên nén", strength: "150 mg", unit: "Viên", inactive: true },
]

const seedLines: Line[] = [
  { ...FORMULARY[4], quantity: 30, dose: "1 viên/lần", route: "Uống", directions: "Sáng 1 viên sau ăn", duration: "30 ngày" },
  { ...FORMULARY[6], quantity: 20, dose: "1 viên/lần khi đau", route: "Uống", directions: "Cách nhau ít nhất 6 giờ", duration: "5 ngày" },
]
const emptyForm = { quantity: "", dose: "", route: "", directions: "", duration: "" }
const allergyIngredients = ["amoxicillin", "sulfamethoxazole"]

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return <span className="mb-1.5 block text-sm font-semibold text-text-secondary">{children}{required && <span className="text-critical"> *</span>}</span>
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "locked") return <span className="inline-flex items-center gap-1 rounded-full bg-normal-bg px-2.5 py-1 text-xs font-semibold text-normal"><Icon className="h-3.5 w-3.5"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>Đã khóa</span>
  if (status === "cancelled") return <span className="rounded-full bg-subsurface px-2.5 py-1 text-xs font-semibold text-text-muted line-through">Đã hủy</span>
  return <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-semibold text-info">Đang soạn</span>
}

function ModalHeader({ title, tone = "default" }: { title: string; tone?: "default" | "danger" }) {
  return <div className={`flex items-center gap-3 border-b px-6 py-5 ${tone === "danger" ? "border-critical-border bg-critical-bg text-critical" : "border-border-subtle text-text-primary"}`}>
    <Icon className="h-6 w-6"><path d="M12 3 2.7 20h18.6L12 3Z" /><path d="M12 9v4M12 17h.01" /></Icon>
    <div className="font-display text-lg font-semibold">{title}</div>
  </div>
}

export default function PrescriptionWorkspace({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [scenario, setScenario] = useState<Scenario>("mine")
  const [status, setStatus] = useState<Status>("draft")
  const [saved, setSaved] = useState(true)
  const [code, setCode] = useState("DT-26-0087")
  const [date, setDate] = useState("11/10/2026 09:15")
  const [lines, setLines] = useState<Line[]>(seedLines)
  const [instructions, setInstructions] = useState("Tái khám sau 1 tháng, theo dõi huyết áp tại nhà.")
  const [drawer, setDrawer] = useState(false)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Drug | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [inactiveError, setInactiveError] = useState("")
  const [modal, setModal] = useState<ModalKind>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [safety, setSafety] = useState<"unchecked" | "checking" | "result" | "error">("unchecked")
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [flagged, setFlagged] = useState<string[]>([])
  const [rxService, setRxService] = useState<RxService>("normal")
  const [allergyAvailable, setAllergyAvailable] = useState(true)
  const [lockFailure, setLockFailure] = useState(false)
  const [clinicalReason, setClinicalReason] = useState("")
  const [replacementReason, setReplacementReason] = useState("")
  const [replacementFor, setReplacementFor] = useState("")
  const [viewOriginal, setViewOriginal] = useState(false)
  const [originalReplaced, setOriginalReplaced] = useState(false)
  const [notice, setNotice] = useState("")
  const [inlineAlert, setInlineAlert] = useState("")
  const [demoOpen, setDemoOpen] = useState(false)

  const lockedView = status === "locked" || status === "cancelled"
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("vi")
    if (q.length < 2) return []
    return FORMULARY.filter(d => d.name.toLocaleLowerCase("vi").includes(q) || d.ingredient.toLocaleLowerCase("vi").includes(q))
  }, [query])
  const allergyLine = lines.find(line => allergyIngredients.includes(line.ingredient.toLowerCase()))

  useEffect(() => {
    if (query.trim().length < 2) return setSearching(false)
    setSearching(true)
    const timer = window.setTimeout(() => setSearching(false), 200)
    return () => window.clearTimeout(timer)
  }, [query])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(""), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const resetForm = () => {
    setDrawer(false); setSelected(null); setEditing(null); setQuery(""); setForm(emptyForm); setErrors({}); setInactiveError("")
  }
  const switchScenario = (next: Scenario, toast = true) => {
    setScenario(next); setSafety("unchecked"); setInteractions([]); setFlagged([]); setInlineAlert(""); setModal(null); setReplacementFor(""); setViewOriginal(false); setOriginalReplaced(false)
    if (next === "empty") {
      setStatus("draft"); setSaved(false); setCode(""); setDate(""); setLines([]); setInstructions("")
      if (toast) setNotice("Đã khởi tạo đơn nháp mới (chưa lưu)")
    } else if (next === "other") {
      setStatus("draft"); setSaved(true); setCode("DT-26-0087"); setDate("11/10/2026 09:15"); setLines(seedLines); setInstructions("")
    } else {
      setStatus(next === "locked" || next === "finished" ? "locked" : "draft"); setSaved(true); setCode("DT-26-0087"); setDate("11/10/2026 09:15"); setLines(seedLines); setInstructions("Tái khám sau 1 tháng, theo dõi huyết áp tại nhà.")
      if (next === "mine" && toast) setNotice("Đã mở lại đơn nháp DT-26-0087")
      if (next === "locked" || next === "finished") setSafety("result")
    }
    resetForm()
  }

  const saveDraft = (quiet = false) => {
    if (!lines.length) { setInlineAlert("Cần thêm ít nhất một thuốc trước khi lưu đơn nháp."); return false }
    setInlineAlert("")
    if (!saved) {
      setSaved(true); setCode("DT-26-0088"); setDate("11/10/2026 09:15")
      if (!quiet) setNotice("Đã lưu đơn nháp DT-26-0088")
    } else if (!quiet) setNotice("Đã cập nhật đơn nháp")
    return true
  }

  const validateForm = () => {
    const next: Record<string, string> = {}
    const qty = Number(form.quantity)
    if (!Number.isInteger(qty) || qty <= 0) next.quantity = "Số lượng phải là số nguyên lớn hơn 0."
    ;(["dose", "route", "directions"] as const).forEach(key => {
      if (form[key].trim().length < 2 || form[key].length > 255) next[key] = "Vui lòng nhập từ 2 đến 255 ký tự."
    })
    setErrors(next)
    return !Object.keys(next).length
  }
  const submitLine = () => {
    if (!selected || !validateForm()) return
    const line: Line = { ...selected, quantity: Number(form.quantity), dose: form.dose, route: form.route, directions: form.directions, duration: form.duration }
    setLines(current => editing === null ? [...current, line] : current.map((item, index) => index === editing ? line : item))
    setSafety("unchecked"); setFlagged([]); setInlineAlert(""); resetForm()
  }
  const editLine = (index: number) => {
    if (lockedView) return setNotice("Yêu cầu bị từ chối: đơn thuốc đã khóa không thể thay đổi (403).")
    const line = lines[index]
    setSelected(line); setEditing(index); setForm({ quantity: String(line.quantity), dose: line.dose, route: line.route, directions: line.directions, duration: line.duration }); setDrawer(true)
  }
  const removeLine = (index: number) => {
    setLines(current => current.filter((_, i) => i !== index)); setModal(null); setDeleteIndex(null); setFlagged([]); setSafety("unchecked")
  }

  const deriveInteractions = (items: Line[]) => {
    const ingredients = new Set(items.map(line => line.ingredient))
    const found: Interaction[] = []
    if (ingredients.has("Warfarin") && ingredients.has("Aspirin")) found.push({ severity: "critical", pair: "Warfarin + Aspirin", text: "Tăng nguy cơ chảy máu nặng", affected: ["Coumadin 5mg", "Aspirin 81mg"] })
    if (ingredients.has("Amlodipine") && ingredients.has("Simvastatin")) found.push({ severity: "moderate", pair: "Amlodipine + Simvastatin", text: "Tăng nồng độ simvastatin, nguy cơ đau cơ/tiêu cơ vân", affected: ["Amlodipine 5mg", "Zocor 20mg"] })
    if (ingredients.has("Paracetamol") && ingredients.has("Metoclopramide")) found.push({ severity: "minor", pair: "Paracetamol + Metoclopramide", text: "Có thể tăng tốc độ hấp thu paracetamol", affected: ["Panadol 500mg", "Primperan 10mg"] })
    return found
  }
  const performSafety = (items: Line[]) => {
    setSafety("checking")
    const finish = () => {
      const found = deriveInteractions(items)
      const matchedAllergy = items.find(line => allergyIngredients.includes(line.ingredient.toLowerCase()))
      setInteractions(found); setSafety("result")
      if (matchedAllergy) {
        setFlagged([matchedAllergy.name]); setModal("allergy")
      } else if (found.some(i => i.severity === "critical")) {
        setFlagged(found.filter(i => i.severity === "critical").flatMap(i => i.affected)); setModal("critical")
      } else if (found.some(i => i.severity === "moderate")) setModal("moderate")
      else if (found.some(i => i.severity === "minor")) setModal("minor")
      else setModal("lock")
    }
    window.setTimeout(finish, rxService === "cache" ? 50 : 650)
  }
  const runSafety = () => {
    if (!saveDraft(true)) return
    if (!allergyAvailable) { setSafety("error"); return }
    performSafety(lines)
  }
  const removeViolations = () => {
    const names = new Set(flagged)
    const remaining = lines.filter(line => !names.has(line.name))
    setLines(remaining); setFlagged([]); setModal(null)
    performSafety(remaining)
  }
  const confirmLock = () => {
    if (lockFailure) { setModal(null); setSafety("result"); setInlineAlert("Khóa đơn thất bại do lỗi lưu nhật ký an toàn. Vui lòng thử lại."); return }
    const lockedCode = code || "DT-26-0088"
    setCode(lockedCode); setSaved(true); setStatus("locked"); setModal(null); setInlineAlert("")
    if (replacementFor) setOriginalReplaced(true)
    setNotice(`Đã khóa đơn ${lockedCode} và lưu kết quả kiểm tra an toàn`)
  }
  const cancelDraft = () => {
    setModal(null)
    if (replacementFor) {
      setReplacementFor(""); setReplacementReason(""); setStatus("locked"); setSaved(true); setCode("DT-26-0087"); setDate("11/10/2026 09:15"); setLines(seedLines); setSafety("result")
      setNotice("Đã hủy đơn nháp thay thế. Đơn gốc tiếp tục là đơn hiệu lực.")
      return
    }
    if (!saved) { switchScenario("empty", false); setNotice("Đã bỏ đơn nháp chưa lưu"); return }
    setStatus("cancelled"); setNotice("Đã hủy đơn thuốc")
  }
  const createReplacement = () => {
    if (replacementReason.trim().length < 5) return
    setReplacementFor(code); setStatus("draft"); setSaved(false); setCode(""); setDate(""); setSafety("unchecked"); setModal(null); setViewOriginal(false)
    setNotice("Đã tạo đơn nháp thay thế")
  }

  const renderSafetyPanel = () => (
    <aside className="self-start rounded-xl border border-border-subtle bg-surface shadow-sm xl:sticky xl:top-20">
      <div className="flex items-center gap-3 border-b border-border-subtle p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-surface text-brand-deep"><Icon><path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z" /><path d="M9.5 12l1.5 1.5 3.5-4" /></Icon></div>
        <div><div className="font-display font-semibold text-text-primary">Kiểm tra an toàn dùng thuốc</div><div className="text-xs text-text-muted">Dị ứng và tương tác thuốc</div></div>
      </div>
      <div className="space-y-4 p-5">
        {safety === "unchecked" && <div className="py-10 text-center text-sm text-text-muted"><Icon className="mx-auto mb-3 h-10 w-10 text-border-strong"><path d="M12 3l7 3v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3z" /></Icon><div className="font-semibold text-text-secondary">Chưa kiểm tra</div><div className="mt-1">Kết quả sẽ xuất hiện trước khi khóa đơn.</div></div>}
        {safety === "checking" && <div className="space-y-3 py-8"><div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-border-subtle border-t-brand-primary" /><div className="text-center text-sm font-semibold text-text-secondary">Đang kiểm tra...</div><div className="h-12 animate-pulse rounded-lg bg-subsurface" /><div className="h-20 animate-pulse rounded-lg bg-subsurface" /></div>}
        {safety === "error" && <div className="rounded-lg border border-critical-border bg-critical-bg p-4 text-sm text-critical"><div className="font-semibold">Không thể truy xuất tiền sử dị ứng của bệnh nhân. Dừng kê đơn để bảo đảm an toàn.</div><Button variant="danger" className="mt-3" onClick={runSafety}>Thử lại</Button></div>}
        {safety === "result" && <>
          <div><div className="mb-2 text-sm font-semibold text-text-primary">Đối chiếu dị ứng</div>{allergyLine ? <div className="rounded-lg border border-critical-border bg-critical-bg p-3 text-sm font-semibold text-critical">Phát hiện trùng hoạt chất: {allergyLine.ingredient}</div> : <div className="rounded-lg bg-normal-bg p-3 text-sm text-normal">Không phát hiện trùng tiền sử dị ứng.</div>}</div>
          <div>
            <div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold text-text-primary">Tương tác thuốc</div>{rxService === "cache" && <span className="text-xs text-warning">ϟ Từ bộ nhớ đệm</span>}</div>
            {rxService === "timeout" && <div className="mb-3 rounded-lg border border-warning/30 bg-warning-bg p-3 text-xs text-warning">Dịch vụ kiểm tra tương tác bên ngoài không khả dụng. Đã đối chiếu với danh mục an toàn nội bộ.</div>}
            {!interactions.length ? <div className="rounded-lg bg-normal-bg p-3 text-sm text-normal">Không phát hiện tương tác thuốc.</div> : <div className="space-y-2">{interactions.map(item => <div key={item.pair} className="rounded-lg border border-border-subtle p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.severity === "critical" ? "bg-critical-bg text-critical" : item.severity === "moderate" ? "bg-warning-bg text-warning" : "bg-info-bg text-info"}`}>{item.severity === "critical" ? "Nghiêm trọng" : item.severity === "moderate" ? "Trung bình" : "Nhẹ"}</span><div className="mt-2 text-sm font-semibold text-text-primary">{item.pair}</div><div className="mt-1 text-xs leading-relaxed text-text-muted">{item.text}</div><div className="mt-1 text-xs text-text-secondary">Dòng thuốc: {item.affected.join(", ")}</div></div>)}</div>}
            <div className="mt-2 text-xs text-text-muted">Nguồn: {rxService === "timeout" ? "Bảng tương tác nội bộ" : "rxcheck.dev (dịch vụ ngoài)"}</div>
          </div>
          {status === "locked" && <div className="rounded-lg border border-normal/20 bg-normal-bg p-4"><div className="font-semibold text-normal">Bản chụp kết quả an toàn (snapshot)</div><div className="mt-2 space-y-1 text-xs text-text-secondary"><div>Thời gian: 11/10/2026 09:32</div><div>Bác sĩ: BS. Trần Minh Khoa</div><div>Dị ứng: {allergyLine ? `Trùng ${allergyLine.ingredient}` : "Không phát hiện"}</div><div>Tương tác: {interactions.length ? interactions.map(i => i.pair).join("; ") : "Không phát hiện"}</div>{clinicalReason && <div>Lý do lâm sàng: {clinicalReason}</div>}</div></div>}
        </>}
      </div>
    </aside>
  )

  if (scenario === "other") return <div className="min-h-screen bg-canvas"><TopNav user={user} onLogout={onLogout} title="Kê đơn điện tử" /><PatientHeader finished={false} /><div className="mx-auto max-w-7xl p-6"><Tabs /><div className="mt-5 rounded-xl border border-warning/30 bg-warning-bg p-6 text-warning"><div className="font-display text-lg font-semibold">Đơn nháp đang bị khóa quyền chỉnh sửa</div><div className="mt-2 text-sm">Đơn nháp này do BS. Lê Thị Hoa tạo. Chỉ bác sĩ tạo đơn mới được mở đơn nháp.</div></div></div><DemoControls {...{ demoOpen, setDemoOpen, scenario, switchScenario, rxService, setRxService, allergyAvailable, setAllergyAvailable, lockFailure, setLockFailure, setNotice }} /></div>

  return <div className="min-h-screen bg-canvas">
    <TopNav user={user} onLogout={onLogout} title="Phòng khám Nội tổng quát" />
    <div className="flex">
      <nav className="hidden w-60 shrink-0 border-r border-border-subtle bg-surface p-4 lg:block">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Không gian Bác sĩ</div>
        {["Tổng quan", "Danh sách khám", "Lịch làm việc"].map(item => <Button key={item} variant="ghost" className="mb-1 w-full justify-start text-left">{item}</Button>)}
        <Button className="mt-2 w-full text-left">Kê đơn thuốc</Button>
        <div className="mt-6 rounded-lg bg-brand-surface p-3 text-xs leading-relaxed text-brand-deep">Đang mở phiếu khám <span className="font-mono font-semibold">PK-26-0345</span></div>
      </nav>
      <main className="min-w-0 flex-1">
        <PatientHeader finished={scenario === "finished"} />
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <Tabs />
          {viewOriginal && replacementFor ? <div className="mt-5 space-y-4"><Button variant="ghost" onClick={() => setViewOriginal(false)}>← Quay lại đơn thay thế</Button><div className="rounded-xl border border-border-subtle bg-surface p-6"><div className="flex flex-wrap items-center gap-2"><div className="font-display text-xl font-semibold text-text-primary">Đơn gốc {replacementFor}</div><StatusBadge status="locked" />{originalReplaced ? <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">Đã bị thay thế</span> : <span className="rounded-full bg-normal-bg px-2.5 py-1 text-xs font-semibold text-normal">Đơn hiệu lực</span>}</div><div className="mt-4 text-sm text-text-secondary">Đơn gốc chỉ đọc · {seedLines.map(l => l.name).join(", ")}</div>{originalReplaced && <Button className="mt-4" onClick={() => setViewOriginal(false)}>Xem đơn thay thế DT-26-0088</Button>}</div></div> :
          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <div className="min-w-0 space-y-5 xl:col-span-2">
              <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Thông tin đơn thuốc</div><div className="mt-2 flex flex-wrap items-center gap-2"><div className="font-display text-xl font-semibold text-text-primary">{code || "Chưa cấp mã (sinh khi lưu nháp lần đầu)"}</div><StatusBadge status={status} />{replacementFor && <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">Thay thế cho: {replacementFor}</span>}{status === "locked" && !replacementFor && <span className="rounded-full bg-normal-bg px-2.5 py-1 text-xs font-semibold text-normal">Đơn hiệu lực</span>}</div></div>
                  {status === "locked" && scenario !== "finished" && !replacementFor && <Button onClick={() => setModal("replacement")} disabled={originalReplaced} title={originalReplaced ? "Đơn thuốc này không thể thay thế." : undefined}>Tạo đơn thay thế</Button>}
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><span className="text-text-muted">Mã đơn thuốc</span><div className="mt-1 font-mono font-semibold text-text-primary">{code || "—"}</div></div><div><span className="text-text-muted">Ngày kê đơn</span><div className="mt-1 font-semibold text-text-primary">{date || "—"}</div></div><div><span className="text-text-muted">Bác sĩ kê đơn</span><div className="mt-1 font-semibold text-text-primary">BS. Trần Minh Khoa</div></div></div>
                {replacementFor && <div className="mt-4 rounded-lg border border-warning/30 bg-warning-bg p-3 text-sm text-warning">Lý do thay thế: {replacementReason} · <Button variant="ghost" className="p-0 text-warning underline" onClick={() => setViewOriginal(true)}>Xem đơn gốc</Button></div>}
                {scenario === "finished" && <div className="mt-4 text-sm text-text-muted">Không thể tạo đơn thay thế cho lượt khám đã kết thúc.</div>}
              </section>

              <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
                <div className="flex items-center justify-between border-b border-border-subtle p-5"><div><div className="font-display text-lg font-semibold text-text-primary">Danh sách thuốc</div><div className="text-xs text-text-muted">{lines.length} dòng thuốc trong đơn</div></div>{!lockedView && <Button onClick={() => setDrawer(true)}>+ Thêm thuốc</Button>}</div>
                {!lines.length ? <div className="p-10 text-center text-sm text-text-muted">Chưa có thuốc nào. Hãy tìm và thêm thuốc vào đơn.</div> : <div className="overflow-x-auto"><table className="w-full min-w-4xl text-left text-sm"><thead className="bg-canvas text-xs text-text-muted"><tr>{["STT","Tên thuốc / Hoạt chất","Số lượng","Liều lượng","Đường dùng","Cách dùng","Thời gian dùng",...(lockedView ? [] : ["Thao tác"])].map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{lines.map((line, index) => <tr key={`${line.code}-${index}`} className={`border-t border-border-subtle ${flagged.includes(line.name) ? "border-l-4 border-l-critical bg-critical-bg/30" : ""}`}><td className="px-4 py-4">{index + 1}</td><td className="px-4 py-4"><div className="font-semibold text-text-primary">{line.name}</div><div className="text-xs text-text-muted">{line.ingredient} · {line.strength}</div>{flagged.includes(line.name) && <span className="mt-1 inline-flex rounded-full bg-critical-bg px-2 py-0.5 text-xs font-semibold text-critical">{allergyIngredients.includes(line.ingredient.toLowerCase()) ? "Dị ứng" : "Tương tác nghiêm trọng"}</span>}</td><td className="px-4 py-4 font-mono">{line.quantity}</td><td className="px-4 py-4">{line.dose}</td><td className="px-4 py-4">{line.route}</td><td className="max-w-52 px-4 py-4">{line.directions}</td><td className="px-4 py-4">{line.duration || "—"}</td>{!lockedView && <td className="px-4 py-4"><div className="flex gap-1"><Button variant="ghost" className="px-2" onClick={() => editLine(index)}>Sửa</Button><Button variant="danger" className="px-2" onClick={() => { setDeleteIndex(index); setModal("delete") }}>Xóa</Button></div></td>}</tr>)}</tbody></table></div>}
              </section>

              <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-sm"><div className="mb-3 flex items-center justify-between"><div className="font-display text-lg font-semibold text-text-primary">Lời dặn của bác sĩ</div><span className="text-xs text-text-muted">{instructions.length}/500</span></div><TextArea rows={4} disabled={lockedView} maxLength={500} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Nhập lời dặn cho bệnh nhân (không bắt buộc)" /></section>
              {inlineAlert && <div className="rounded-lg border border-critical-border bg-critical-bg p-4 text-sm font-semibold text-critical">{inlineAlert}{inlineAlert.includes("thất bại") && <Button variant="danger" className="ml-3" onClick={runSafety}>Thử lại</Button>}</div>}
              {!lockedView ? <div className="sticky bottom-0 z-20 rounded-xl border border-border-subtle bg-surface/95 p-4 shadow-lg backdrop-blur"><div className="flex flex-wrap justify-end gap-2"><Button variant="danger" onClick={() => setModal("cancel")}>Hủy đơn</Button><Button variant="ghost" className="border border-border-subtle" onClick={() => saveDraft()}>Lưu nháp</Button><Button onClick={runSafety} disabled={safety === "checking" || safety === "error"} title={flagged.length ? "Không thể khóa đơn khi còn xung đột nghiêm trọng hoặc trùng dị ứng" : undefined}>Kiểm tra an toàn & Khóa đơn</Button></div><div className="mt-3 text-right text-xs text-text-muted">Đơn nháp chưa khóa tự động bị hủy nếu phiếu khám bị hệ thống khóa sau 24 giờ.</div></div> :
              <div className={`rounded-xl p-4 text-sm font-semibold ${status === "locked" ? "bg-normal-bg text-normal" : "bg-subsurface text-text-muted"}`}>{status === "locked" ? "Đơn thuốc đã khóa - chỉ đọc" : "Đơn thuốc đã hủy - chỉ đọc"}{status === "cancelled" && <Button className="ml-3" onClick={() => switchScenario("empty")}>Tạo đơn mới</Button>}</div>}
              {replacementFor && <div className="rounded-xl border border-border-subtle bg-surface p-4"><div className="text-sm font-semibold text-text-primary">Lịch sử thay thế</div><div className="mt-2 font-mono text-sm text-text-secondary">{replacementFor} → {status === "locked" ? code : "Đơn nháp thay thế"}</div></div>}
            </div>
            {renderSafetyPanel()}
          </div>}
        </div>
      </main>
    </div>

    {drawer && !lockedView && <div className="fixed inset-0 z-40 bg-text-primary/30" onMouseDown={e => { if (e.target === e.currentTarget) resetForm() }}><div className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-surface p-6 shadow-2xl"><div className="flex items-center justify-between"><div className="font-display text-xl font-semibold text-text-primary">{editing === null ? "Thêm thuốc vào đơn" : "Sửa dòng thuốc"}</div><Button variant="ghost" onClick={resetForm}>Đóng</Button></div>
      {editing === null && <div className="mt-6"><FieldLabel required>Tìm thuốc (tên thương mại hoặc hoạt chất)</FieldLabel><TextInput value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setInactiveError("") }} placeholder="Ví dụ: Panadol hoặc Paracetamol" /><div className="mt-2 text-xs text-text-muted">{query.length < 2 ? "Nhập tối thiểu 2 ký tự" : searching ? "Đang tìm kiếm..." : `${filtered.length} kết quả phù hợp`}</div>{inactiveError && <div className="mt-2 text-sm text-critical">{inactiveError}</div>}
        {query.length >= 2 && !searching && <div className="mt-3 overflow-hidden rounded-lg border border-border-subtle">{!filtered.length ? <div className="p-4 text-sm text-text-muted">Không tìm thấy thuốc phù hợp trong danh mục. Vui lòng kiểm tra lại chính tả hoặc hoạt chất.</div> : filtered.map(drug => <Button key={drug.code} variant="ghost" className="w-full rounded-none border-b border-border-subtle p-4 text-left last:border-0" onClick={() => drug.inactive ? setInactiveError("Thuốc đã chọn hiện không có trong danh mục của bệnh viện.") : setSelected(drug)}><span className="flex items-center justify-between"><span className="font-semibold text-text-primary">{drug.name}</span>{drug.inactive && <span className="rounded-full bg-subsurface px-2 py-0.5 text-xs text-text-muted">Ngưng sử dụng</span>}</span><span className="mt-1 block text-xs font-normal text-text-muted">{drug.ingredient} · {drug.form} · {drug.strength} · {drug.unit} · <span className="font-mono">{drug.code}</span></span></Button>)}</div>}</div>}
      {selected && <div className="mt-6 space-y-4"><div className="rounded-lg border border-brand-primary/20 bg-brand-surface p-4"><div className="font-semibold text-brand-deep">{selected.name}</div><div className="mt-1 text-xs text-text-secondary">Hoạt chất dùng để kiểm tra an toàn</div><div className="text-sm font-semibold text-text-primary">Hoạt chất chính: {selected.ingredient}</div></div><div className="grid gap-4 sm:grid-cols-2"><label><FieldLabel required>Số lượng</FieldLabel><TextInput type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />{errors.quantity && <span className="mt-1 block text-xs text-critical">{errors.quantity}</span>}</label><label><FieldLabel required>Liều lượng</FieldLabel><TextInput value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })} placeholder="1 viên/lần" />{errors.dose && <span className="mt-1 block text-xs text-critical">{errors.dose}</span>}</label><label><FieldLabel required>Đường dùng</FieldLabel><TextInput value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} placeholder="Uống" />{errors.route && <span className="mt-1 block text-xs text-critical">{errors.route}</span>}</label><label><FieldLabel>Thời gian dùng</FieldLabel><TextInput value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="7 ngày" /></label></div><label><FieldLabel required>Cách dùng</FieldLabel><TextArea rows={3} value={form.directions} onChange={e => setForm({ ...form, directions: e.target.value })} placeholder="Sáng 1 viên, tối 1 viên sau ăn" />{errors.directions && <span className="mt-1 block text-xs text-critical">{errors.directions}</span>}</label><div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={resetForm}>Hủy</Button><Button onClick={submitLine}>{editing === null ? "Thêm vào đơn" : "Lưu thay đổi"}</Button></div></div>}
    </div></div>}

    {modal && <Modal titleId="rx-modal-title" onClose={() => setModal(null)}>
      {modal === "delete" && <><ModalHeader title="Xóa thuốc này khỏi đơn nháp?" tone="danger" /><div className="p-6 text-sm text-text-secondary">Dòng thuốc sẽ được gỡ khỏi đơn đang soạn.</div><ModalActions cancel="Hủy" confirm="Xóa" danger onCancel={() => setModal(null)} onConfirm={() => deleteIndex !== null && removeLine(deleteIndex)} /></>}
      {modal === "cancel" && <><ModalHeader title="Hủy đơn thuốc đang soạn?" tone="danger" /><div className="p-6 text-sm text-text-secondary">Đơn sẽ chuyển sang trạng thái Đã hủy.</div><ModalActions cancel="Quay lại" confirm="Hủy đơn" danger onCancel={() => setModal(null)} onConfirm={cancelDraft} /></>}
      {modal === "allergy" && allergyLine && <><ModalHeader title="CẢNH BÁO DỊ ỨNG THUỐC" tone="danger" /><div className="space-y-3 p-6 text-sm text-text-secondary"><div><strong>Thuốc vi phạm:</strong> {allergyLine.name}</div><div><strong>Hoạt chất trùng khớp:</strong> {allergyLine.ingredient}</div><div><strong>Phản ứng bất lợi trước đây của bệnh nhân:</strong> Nổi mề đay toàn thân, khó thở (ghi nhận 03/2022)</div><div className="font-semibold text-critical">Đơn không thể khóa cho đến khi gỡ thuốc này khỏi đơn nháp.</div></div><ModalActions cancel="Đóng" confirm="Xóa thuốc khỏi đơn" danger onCancel={() => setModal(null)} onConfirm={() => { const remaining = lines.filter(l => l.code !== allergyLine.code); setLines(remaining); setFlagged([]); setModal(null); performSafety(remaining) }} /></>}
      {modal === "critical" && <><ModalHeader title="Xung đột nghiêm trọng - không thể khóa đơn" tone="danger" /><div className="space-y-3 p-6 text-sm text-text-secondary"><div>Thuốc vi phạm: <strong>{flagged.join(", ")}</strong></div><div>Hãy gỡ hoặc thay thế thuốc vi phạm. Quy tắc này không thể bị ghi đè bởi bất kỳ vai trò nào.</div></div><ModalActions cancel="Đóng" confirm="Xóa thuốc vi phạm" danger onCancel={() => setModal(null)} onConfirm={removeViolations} /></>}
      {modal === "moderate" && <><ModalHeader title="Xác nhận khóa đơn kèm lý do lâm sàng" /><div className="space-y-4 p-6"><div className="rounded-lg bg-warning-bg p-3 text-sm text-warning">{interactions.filter(i => i.severity === "moderate").map(i => `${i.pair}: ${i.text}`).join("; ")}</div><label><div className="flex justify-between"><FieldLabel required>Lý do lâm sàng</FieldLabel><span className="text-xs text-text-muted">{clinicalReason.length}/500</span></div><TextArea rows={4} maxLength={500} value={clinicalReason} onChange={e => setClinicalReason(e.target.value)} />{clinicalReason.length > 0 && clinicalReason.trim().length < 10 && <span className="mt-1 block text-xs text-critical">Lý do lâm sàng phải có ít nhất 10 ký tự, nêu rõ cơ sở y khoa.</span>}<span className="mt-2 block text-xs text-text-muted">Lý do này sẽ được gắn vĩnh viễn với danh tính của bác sĩ kê đơn.</span></label></div><ModalActions cancel="Quay lại" confirm="Xác nhận kèm lý do lâm sàng" onCancel={() => setModal(null)} onConfirm={() => clinicalReason.trim().length >= 10 && setModal("lock")} disabled={clinicalReason.trim().length < 10} /></>}
      {modal === "minor" && <><ModalHeader title="Cảnh báo tương tác nhẹ" /><div className="p-6"><div className="rounded-lg bg-info-bg p-4 text-sm text-info">Chỉ có cảnh báo tương tác nhẹ. Bạn có thể tiếp tục khóa đơn.</div></div><ModalActions cancel="Quay lại chỉnh sửa" confirm="Tiếp tục khóa đơn" onCancel={() => setModal(null)} onConfirm={() => setModal("lock")} /></>}
      {modal === "lock" && <><ModalHeader title="Khóa đơn thuốc?" /><div className="p-6 text-sm text-text-secondary">Sau khi khóa, đơn không thể sửa hoặc hủy.</div><ModalActions cancel="Quay lại" confirm="Khóa đơn" onCancel={() => setModal(null)} onConfirm={confirmLock} /></>}
      {modal === "replacement" && <><ModalHeader title="Tạo đơn thay thế" /><div className="p-6"><label><div className="flex justify-between"><FieldLabel required>Lý do thay thế</FieldLabel><span className="text-xs text-text-muted">{replacementReason.length}/255</span></div><TextArea rows={4} maxLength={255} value={replacementReason} onChange={e => setReplacementReason(e.target.value)} />{replacementReason.length > 0 && replacementReason.trim().length < 5 && <span className="mt-1 block text-xs text-critical">Lý do thay thế phải có ít nhất 5 ký tự.</span>}</label></div><ModalActions cancel="Hủy" confirm="Tạo đơn thay thế" onCancel={() => setModal(null)} onConfirm={createReplacement} disabled={replacementReason.trim().length < 5} /></>}
    </Modal>}
    {notice && <div role="status" className={`fixed right-5 top-20 z-50 max-w-md rounded-lg border p-4 text-sm font-semibold shadow-lg ${notice.includes("từ chối") || notice.includes("Không thể") ? "border-critical-border bg-critical-bg text-critical" : "border-normal/20 bg-normal-bg text-normal"}`}>{notice}</div>}
    <DemoControls {...{ demoOpen, setDemoOpen, scenario, switchScenario, rxService, setRxService, allergyAvailable, setAllergyAvailable, lockFailure, setLockFailure, setNotice }} />
  </div>
}

function PatientHeader({ finished }: { finished: boolean }) {
  return <div className="sticky top-14 z-30 border-b border-border-subtle bg-surface px-4 py-4 shadow-sm sm:px-6"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><div className="font-display text-xl font-semibold text-text-primary">Nguyễn Văn An</div><span className="font-mono text-xs text-text-muted">BN-26-0012</span><span className="text-sm text-text-secondary">Nam, 58 tuổi</span></div><div className="mt-1 text-xs text-text-muted">Phiếu khám <span className="font-mono font-semibold">PK-26-0345</span> · Nội tổng quát</div></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${finished ? "bg-subsurface text-text-muted" : "bg-brand-surface text-brand-deep"}`}>{finished ? "Hoàn tất" : "Đang khám"}</span><span className="rounded-full border border-critical-border bg-critical-bg px-3 py-1 text-xs font-semibold text-critical">Dị ứng: Amoxicillin</span></div></div></div>
}
function Tabs() {
  return <div className="flex gap-1 border-b border-border-subtle"><Button variant="ghost" className="rounded-b-none text-text-muted">Khám bệnh</Button><Button variant="ghost" className="rounded-b-none text-text-muted">Chỉ định CLS</Button><Button className="rounded-b-none border-b-2 border-brand-primary bg-brand-surface text-brand-deep shadow-none">Kê đơn điện tử</Button></div>
}
function ModalActions({ cancel, confirm, onCancel, onConfirm, danger = false, disabled = false }: { cancel: string; confirm: string; onCancel: () => void; onConfirm: () => void; danger?: boolean; disabled?: boolean }) {
  return <div className="flex justify-end gap-2 border-t border-border-subtle bg-canvas px-6 py-4"><Button variant="ghost" onClick={onCancel}>{cancel}</Button><Button variant={danger ? "destructive" : "primary"} onClick={onConfirm} disabled={disabled}>{confirm}</Button></div>
}
function DemoControls(props: {
  demoOpen: boolean; setDemoOpen: (v: boolean) => void; scenario: Scenario; switchScenario: (v: Scenario) => void
  rxService: RxService; setRxService: (v: RxService) => void; allergyAvailable: boolean; setAllergyAvailable: (v: boolean) => void
  lockFailure: boolean; setLockFailure: (v: boolean) => void; setNotice: (v: string) => void
}) {
  return <div className="fixed bottom-4 left-4 z-40 w-80 rounded-xl border border-border-strong bg-surface shadow-xl"><Button variant="ghost" className="flex w-full items-center justify-between text-left" onClick={() => props.setDemoOpen(!props.demoOpen)}><span>Điều khiển demo <span className="font-normal text-text-muted">(chỉ dùng cho prototype)</span></span><span>{props.demoOpen ? "−" : "+"}</span></Button>{props.demoOpen && <div className="max-h-96 space-y-3 overflow-y-auto border-t border-border-subtle p-4">
    <DemoChoice label="Kịch bản bệnh nhân/phiếu khám" value={props.scenario} onChange={props.switchScenario} options={[["empty","Chưa có đơn"],["mine","Có đơn nháp của tôi"],["other","Đơn nháp của bác sĩ khác"],["locked","Đơn đã khóa"],["finished","Phiếu khám đã hoàn tất"]]} />
    <DemoChoice label="Dịch vụ rxcheck.dev" value={props.rxService} onChange={props.setRxService} options={[["normal","Hoạt động bình thường"],["timeout","Lỗi - quá thời gian"],["cache","Đã có trong bộ nhớ đệm"]]} />
    <DemoChoice label="Tiền sử dị ứng" value={props.allergyAvailable ? "yes" : "no"} onChange={value => props.setAllergyAvailable(value === "yes")} options={[["yes","Truy xuất được"],["no","Lỗi truy xuất"]]} />
    <DemoChoice label="Khóa đơn" value={props.lockFailure ? "fail" : "ok"} onChange={value => props.setLockFailure(value === "fail")} options={[["ok","Thành công"],["fail","Lỗi lưu nhật ký"]]} />
    <div className="grid gap-2"><Button variant="danger" onClick={() => props.setNotice("Yêu cầu bị từ chối: đơn thuốc đã khóa không thể thay đổi (403).")}>Thử sửa đơn đã khóa</Button><Button variant="danger" onClick={() => props.setNotice("Không thể hủy đơn thuốc đã khóa.")}>Thử hủy đơn đã khóa</Button><Button variant="ghost" className="border border-border-subtle" onClick={() => props.switchScenario("mine")}>Đặt lại dữ liệu mock</Button></div>
  </div>}</div>
}

function DemoChoice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: [T, string][] }) {
  return <div><FieldLabel>{label}</FieldLabel><div className="grid gap-1">{options.map(([key, text]) => <Button key={key} variant="ghost" className={`w-full border px-3 py-2 text-left text-xs ${value === key ? "border-brand-primary bg-brand-surface text-brand-deep" : "border-border-subtle"}`} onClick={() => onChange(key)}>{text}</Button>)}</div></div>
}
