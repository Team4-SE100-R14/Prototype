import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { AuthUser } from "../App"
import Button from "./ui/Button"
import Modal from "./ui/Modal"
import Pagination from "./ui/Pagination"
import Tooltip from "./ui/Tooltip"
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit3,
  FlaskConical,
  HeartPulse,
  KeyRound,
  Lock,
  LockOpen,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldPlus,
  Stethoscope,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react"

export type HospitalRole =
  | "admin"
  | "physician"
  | "nurse"
  | "paraclinical_tech"
  | "receptionist"

export type AccountStatus = "Đang hoạt động" | "Đã khóa"

export interface HospitalAccount {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: HospitalRole
  roleTitle: string
  clinic: string
  facility: string
  permissions: string[]
  status: AccountStatus
  mfaEnabled: boolean
  lastLogin: string
  workstation: string
  isRoot?: boolean
}

const DEFAULT_ACCOUNTS: HospitalAccount[] = [
  {
    id: "AD001",
    name: "Trần Thị Quản Lý",
    username: "admin",
    email: "admin@hpms.med.vn",
    phone: "0903 111 222",
    role: "admin",
    roleTitle: "Giám đốc Điều hành & KHTH",
    clinic: "Ban Giám đốc & Điều hành viện",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Toàn quyền quản trị hệ thống",
      "Quản lý tài khoản bệnh viện & phòng khám",
      "Cấu hình danh mục thuốc & ca trực",
      "Tra cứu toàn bộ nhật ký kiểm toán",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 08:00",
    workstation: "WS-ADMIN-01",
    isRoot: true,
  },
  {
    id: "NV-26-004",
    name: "BS. Trần Minh Khoa",
    username: "dat.nguyen",
    email: "khoa.tran@hpms.med.vn",
    phone: "0912 345 678",
    role: "physician",
    roleTitle: "Bác sĩ CK1 Nội tổng quát",
    clinic: "Phòng Nội Tổng hợp 1",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Kê đơn thuốc điện tử",
      "Chỉ định xét nghiệm & CĐHA",
      "Ký số bệnh án ngoại trú",
      "Hội chẩn cấp cứu",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 08:32",
    workstation: "WS-EXAM-01",
  },
  {
    id: "NV-26-007",
    name: "BS. Vũ Công Thành",
    username: "thanh.vu",
    email: "thanh.vu@hpms.med.vn",
    phone: "0913 888 999",
    role: "physician",
    roleTitle: "Bác sĩ Ngoại khoa",
    clinic: "Phòng Ngoại Tổng quát",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Kê đơn thuốc điện tử",
      "Chỉ định CLS & Phẫu thuật",
      "Ký số bệnh án ngoại trú",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 07:45",
    workstation: "WS-EXAM-02",
  },
  {
    id: "NV-26-009",
    name: "BS. Lê Thị Hương",
    username: "huong.le",
    email: "huong.le@hpms.med.vn",
    phone: "0988 222 333",
    role: "physician",
    roleTitle: "Bác sĩ Nhi khoa",
    clinic: "Phòng khám Nhi 01",
    facility: "Phòng khám Vệ tinh Cơ sở 2",
    permissions: [
      "Kê đơn thuốc điện tử",
      "Chỉ định CLS nhi khoa",
      "Ký số bệnh án",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm qua 16:20",
    workstation: "WS-CLINIC-01",
  },
  {
    id: "NV-26-011",
    name: "BS. Phạm Quốc Anh",
    username: "anh.pham",
    email: "anh.pham@hpms.med.vn",
    phone: "0977 444 555",
    role: "physician",
    roleTitle: "Bác sĩ Tim mạch",
    clinic: "Phòng Tim mạch 1",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Kê đơn thuốc điện tử",
      "Chỉ định xét nghiệm & CĐHA",
      "Đọc kết quả điện tâm đồ & siêu âm",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "29/10/2026 14:10",
    workstation: "WS-EXAM-03",
  },
  {
    id: "NV-26-012",
    name: "ĐD. Phạm Thị Lan",
    username: "mai.le",
    email: "lan.pham@hpms.med.vn",
    phone: "0908 654 321",
    role: "nurse",
    roleTitle: "Điều dưỡng trưởng khoa",
    clinic: "Khoa Nội tổng quát",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Ghi nhận chỉ số sinh hiệu",
      "Ghi diễn biến bệnh án nội trú",
      "Điều phối & xếp giường bệnh",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 07:15",
    workstation: "WS-WARD-01",
  },
  {
    id: "NV-26-015",
    name: "ĐD. Nguyễn Bích Ngọc",
    username: "ngoc.nguyen",
    email: "ngoc.nguyen@hpms.med.vn",
    phone: "0909 555 666",
    role: "nurse",
    roleTitle: "Điều dưỡng Cấp cứu",
    clinic: "Khoa Cấp cứu & Triage",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Ghi nhận chỉ số sinh hiệu khẩn",
      "Phân loại cấp cứu 5 mức độ",
      "Kích hoạt báo động đỏ Code Red",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 06:50",
    workstation: "WS-ER-01",
  },
  {
    id: "NV-26-025",
    name: "KTV. Lê Quang Minh",
    username: "tuan.cls",
    email: "minh.le@hpms.med.vn",
    phone: "0933 777 888",
    role: "paraclinical_tech",
    roleTitle: "Kỹ thuật viên trưởng Xét nghiệm",
    clinic: "Phòng Xét nghiệm Máu 01",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Tiếp nhận mẫu bệnh phẩm",
      "Nhập trị số định lượng thiết bị labo",
      "Hoàn tất phiếu kết quả xét nghiệm",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 08:10",
    workstation: "WS-LAB-01",
  },
  {
    id: "NV-26-028",
    name: "KTV. Hoàng Văn Đức",
    username: "duc.hoang",
    email: "duc.hoang@hpms.med.vn",
    phone: "0934 999 111",
    role: "paraclinical_tech",
    roleTitle: "Kỹ thuật viên Chẩn đoán hình ảnh",
    clinic: "Phòng Chẩn đoán hình ảnh 01",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Chụp X-quang, CT Scanner",
      "Đính kèm tệp kết quả hình ảnh DICOM",
      "Ghi nhận kết luận kỹ thuật viên",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 07:55",
    workstation: "WS-PAC-01",
  },
  {
    id: "NV-26-030",
    name: "Phạm Thị Lan Anh",
    username: "lan.tiepdon",
    email: "lananh.pham@hpms.med.vn",
    phone: "0945 123 789",
    role: "receptionist",
    roleTitle: "Nhân viên Tiếp đón & BHYT",
    clinic: "Quầy Tiếp đón Ngoại trú 01",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Tiếp đón và phân luồng phòng khám",
      "Đăng ký thông tin bệnh nhân mới",
      "Xem & Mở che thông tin CCCD trong 30 giây",
      "In phiếu số thứ tự khám bệnh",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 07:00",
    workstation: "WS-INTAKE-01",
  },
  {
    id: "NV-26-033",
    name: "Trần Mai Linh",
    username: "linh.tran",
    email: "linh.tran@hpms.med.vn",
    phone: "0946 234 890",
    role: "receptionist",
    roleTitle: "Nhân viên Tiếp đón Cấp cứu",
    clinic: "Quầy Tiếp đón Cấp cứu",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Tiếp nhận bệnh nhân cấp cứu",
      "Kích hoạt quy trình bỏ qua thủ tục Code Red",
      "Tạo hồ sơ người bệnh vô danh",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm qua 22:30",
    workstation: "WS-INTAKE-ER",
  },
  {
    id: "ADM-002",
    name: "Phan Huỳnh Hưng",
    username: "hung.phan",
    email: "hung.phan@hpms.med.vn",
    phone: "0901 888 777",
    role: "admin",
    roleTitle: "Quản trị viên An ninh & Cơ sở",
    clinic: "Ban Giám đốc & Điều hành viện",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: [
      "Khóa và mở khóa tài khoản nhân sự",
      "Đặt lại mật khẩu & phiên đăng nhập",
      "Giám sát phiên làm việc đồng thời",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "Hôm nay 08:15",
    workstation: "WS-ADMIN-02",
  },
  {
    id: "ADM-003",
    name: "Lê Thị Minh Anh",
    username: "anh.le",
    email: "anh.le@hpms.med.vn",
    phone: "0902 333 444",
    role: "admin",
    roleTitle: "Quản trị viên Cơ sở vệ tinh",
    clinic: "Phòng khám Vệ tinh Cơ sở 2",
    facility: "Phòng khám Vệ tinh Cơ sở 2",
    permissions: [
      "Quản trị tài khoản phòng khám cơ sở 2",
      "Điều phối lịch trực bác sĩ phòng khám",
      "Xem báo cáo thống kê phòng khám",
    ],
    status: "Đang hoạt động",
    mfaEnabled: true,
    lastLogin: "28/10/2026 15:40",
    workstation: "WS-CLINIC-ADM",
  },
  {
    id: "ADM-004",
    name: "Trần Quốc Bảo",
    username: "bao.tran",
    email: "bao.tran@hpms.med.vn",
    phone: "0903 666 555",
    role: "admin",
    roleTitle: "Quản trị viên Kỹ thuật (Đã nghỉ)",
    clinic: "Phòng Quản trị CNTT",
    facility: "Bệnh viện Đa khoa Trung tâm",
    permissions: ["Quyền hạn đã bị thu hồi"],
    status: "Đã khóa",
    mfaEnabled: false,
    lastLogin: "15/09/2026 09:20",
    workstation: "WS-ADMIN-03",
  },
]

const ROLE_CONFIG: Record<
  HospitalRole,
  {
    label: string
    color: string
    badgeClass: string
    icon: typeof Stethoscope
    defaultClinic: string
    defaultPermissions: string[]
  }
> = {
  physician: {
    label: "Bác sĩ",
    color: "blue",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Stethoscope,
    defaultClinic: "Phòng Nội Tổng hợp 1",
    defaultPermissions: [
      "Kê đơn thuốc điện tử",
      "Chỉ định xét nghiệm & CĐHA",
      "Ký số bệnh án ngoại trú",
    ],
  },
  nurse: {
    label: "Điều dưỡng",
    color: "emerald",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: HeartPulse,
    defaultClinic: "Khoa Nội tổng quát",
    defaultPermissions: [
      "Ghi nhận chỉ số sinh hiệu",
      "Ghi diễn biến bệnh án nội trú",
      "Điều phối & xếp giường bệnh",
    ],
  },
  paraclinical_tech: {
    label: "KTV Cận lâm sàng",
    color: "purple",
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700",
    icon: FlaskConical,
    defaultClinic: "Phòng Xét nghiệm Máu 01",
    defaultPermissions: [
      "Tiếp nhận mẫu bệnh phẩm",
      "Nhập trị số định lượng thiết bị labo",
      "Hoàn tất phiếu kết quả xét nghiệm",
    ],
  },
  receptionist: {
    label: "Tiếp đón",
    color: "amber",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    icon: ClipboardList,
    defaultClinic: "Quầy Tiếp đón Ngoại trú 01",
    defaultPermissions: [
      "Tiếp đón và phân luồng phòng khám",
      "Đăng ký thông tin bệnh nhân mới",
      "Xem & Mở che thông tin CCCD trong 30 giây",
    ],
  },
  admin: {
    label: "Quản trị viên",
    color: "slate",
    badgeClass: "border-slate-300 bg-slate-100 text-slate-700",
    icon: Shield,
    defaultClinic: "Ban Giám đốc & Điều hành viện",
    defaultPermissions: [
      "Toàn quyền quản trị hệ thống",
      "Quản lý tài khoản bệnh viện & phòng khám",
      "Cấu hình danh mục thuốc & ca trực",
    ],
  },
}

const CLINICS_LIST = [
  "Phòng Nội Tổng hợp 1",
  "Phòng Nội Tổng hợp 2",
  "Phòng Ngoại Tổng quát",
  "Phòng Tim mạch 1",
  "Phòng khám Nhi 01",
  "Khoa Cấp cứu & Triage",
  "Khoa Nội tổng quát",
  "Phòng Xét nghiệm Máu 01",
  "Phòng Chẩn đoán hình ảnh 01",
  "Quầy Tiếp đón Ngoại trú 01",
  "Quầy Tiếp đón Cấp cứu",
  "Phòng khám Vệ tinh Cơ sở 2",
  "Ban Giám đốc & Điều hành viện",
]

const FACILITIES_LIST = [
  "Bệnh viện Đa khoa Trung tâm",
  "Phòng khám Vệ tinh Cơ sở 2",
]

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
      {children} {required && <span className="text-critical">*</span>}
    </label>
  )
}

interface CreateAccountModalProps {
  onClose: () => void
  onCreate: (newAccount: HospitalAccount) => void
  existingCount: number
}

function CreateAccountModal({
  onClose,
  onCreate,
  existingCount,
}: CreateAccountModalProps) {
  const [role, setRole] = useState<HospitalRole>("physician")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [facility, setFacility] = useState(FACILITIES_LIST[0])
  const [clinic, setClinic] = useState(ROLE_CONFIG["physician"].defaultClinic)
  const [roleTitle, setRoleTitle] = useState("Bác sĩ chuyên khoa")

  const generatedId = `NV-26-${String(existingCount + 1).padStart(3, "0")}`

  const handleRoleChange = (newRole: HospitalRole) => {
    setRole(newRole)
    setClinic(ROLE_CONFIG[newRole].defaultClinic)
    if (newRole === "physician") setRoleTitle("Bác sĩ chuyên khoa")
    else if (newRole === "nurse") setRoleTitle("Điều dưỡng viên")
    else if (newRole === "paraclinical_tech") setRoleTitle("Kỹ thuật viên xét nghiệm")
    else if (newRole === "receptionist") setRoleTitle("Nhân viên tiếp đón")
    else if (newRole === "admin") setRoleTitle("Quản trị viên cơ sở")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !username || !email) return

    const newAcc: HospitalAccount = {
      id: generatedId,
      name,
      username: username.toLowerCase().trim(),
      email: email.trim(),
      phone: phone.trim() || "0900 000 000",
      role,
      roleTitle,
      clinic,
      facility,
      permissions: ROLE_CONFIG[role].defaultPermissions,
      status: "Đang hoạt động",
      mfaEnabled: true,
      lastLogin: "Chưa đăng nhập (Tài khoản mới)",
      workstation: "Chưa phân bổ",
    }
    onCreate(newAcc)
  }

  return (
    <Modal titleId="create-account-title" onClose={onClose}>
      <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-deep">
            <UserPlus className="h-4 w-4" />
            Cấp tài khoản mới
          </div>
          <h2
            id="create-account-title"
            className="mt-1 font-display text-lg font-bold text-text-primary"
          >
            Tạo tài khoản Nhân sự Bệnh viện &amp; Phòng khám
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Tài khoản sẽ được phân quyền nghiệp vụ và nhận liên kết kích hoạt qua email công vụ.
          </p>
        </div>
        <button
          aria-label="Đóng hộp thoại"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-subsurface hover:text-text-primary"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-6 sm:grid-cols-2">
          {/* Employee ID */}
          <div>
            <FieldLabel>Mã nhân viên / ID</FieldLabel>
            <input
              className="w-full cursor-not-allowed rounded-lg border border-border-subtle bg-subsurface px-3 py-2 font-mono text-xs font-bold text-brand-deep"
              disabled
              value={generatedId}
            />
          </div>

          {/* Role selector */}
          <div>
            <FieldLabel required>Chức vụ / Vai trò</FieldLabel>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as HospitalRole)}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-text-primary focus:border-brand-primary focus:outline-none"
            >
              <option value="physician">Bác sĩ (Physician)</option>
              <option value="nurse">Điều dưỡng (Nurse)</option>
              <option value="paraclinical_tech">KTV Cận lâm sàng (Tech)</option>
              <option value="receptionist">Nhân viên Tiếp đón (Receptionist)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          {/* Full Name */}
          <div>
            <FieldLabel required>Họ và tên nhân sự</FieldLabel>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: BS. Nguyễn Văn Hải"
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-brand-primary focus:outline-none"
            />
          </div>

          {/* Professional Title */}
          <div>
            <FieldLabel required>Chức danh hiển thị</FieldLabel>
            <input
              required
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Ví dụ: Bác sĩ điều trị, Điều dưỡng viên..."
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-brand-primary focus:outline-none"
            />
          </div>

          {/* Username */}
          <div>
            <FieldLabel required>Tên đăng nhập</FieldLabel>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: hai.nguyen"
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-disabled focus:border-brand-primary focus:outline-none"
            />
          </div>

          {/* Hospital Email */}
          <div>
            <FieldLabel required>Email công vụ</FieldLabel>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hai.nguyen@hpms.med.vn"
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-brand-primary focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <FieldLabel>Số điện thoại liên lạc</FieldLabel>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0918 222 333"
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-brand-primary focus:outline-none"
            />
          </div>

          {/* Medical Facility */}
          <div>
            <FieldLabel required>Cơ sở y tế</FieldLabel>
            <select
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary focus:border-brand-primary focus:outline-none"
            >
              {FACILITIES_LIST.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>

          {/* Clinic / Department Assignment */}
          <div className="sm:col-span-2">
            <FieldLabel required>Khoa / Phòng khám được phân công</FieldLabel>
            <select
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-medium text-text-primary focus:border-brand-primary focus:outline-none"
            >
              {CLINICS_LIST.map((cl) => (
                <option key={cl} value={cl}>
                  {cl}
                </option>
              ))}
            </select>
          </div>

          {/* Default Permissions preview */}
          <div className="rounded-xl border border-border-subtle bg-subsurface/60 p-4 sm:col-span-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <ShieldCheck className="h-4 w-4 text-brand-deep" />
              Quyền hạn chuyên môn được kích hoạt sẵn theo vai trò:
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
              {ROLE_CONFIG[role].defaultPermissions.map((perm) => (
                <li key={perm} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-normal" />
                  <span>{perm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            className="border border-border-subtle"
            onClick={onClose}
            type="button"
          >
            Hủy bỏ
          </Button>
          <Button type="submit">Cấp tài khoản &amp; Gửi liên kết</Button>
        </div>
      </form>
    </Modal>
  )
}

interface PermissionsModalProps {
  account: HospitalAccount
  onClose: () => void
  onSave: (updatedPermissions: string[], updatedClinic: string) => void
}

function PermissionsModal({
  account,
  onClose,
  onSave,
}: PermissionsModalProps) {
  const [perms, setPerms] = useState<string[]>(account.permissions)
  const [clinic, setClinic] = useState<string>(account.clinic)

  const availableOptions = [
    "Kê đơn thuốc điện tử",
    "Chỉ định xét nghiệm & CĐHA",
    "Ký số bệnh án ngoại trú",
    "Ghi nhận chỉ số sinh hiệu",
    "Ghi diễn biến bệnh án nội trú",
    "Điều phối & xếp giường bệnh",
    "Tiếp nhận mẫu bệnh phẩm",
    "Nhập trị số định lượng thiết bị labo",
    "Chụp X-quang, CT Scanner",
    "Đính kèm tệp kết quả hình ảnh DICOM",
    "Tiếp đón và phân luồng phòng khám",
    "Đăng ký thông tin bệnh nhân mới",
    "Xem & Mở che thông tin CCCD trong 30 giây",
    "Kích hoạt báo động đỏ Code Red",
    "Toàn quyền quản trị hệ thống",
    "Quản lý tài khoản bệnh viện & phòng khám",
    "Cấu hình danh mục thuốc & ca trực",
    "Tra cứu toàn bộ nhật ký kiểm toán",
  ]

  const togglePermission = (perm: string) => {
    if (perms.includes(perm)) {
      setPerms(perms.filter((p) => p !== perm))
    } else {
      setPerms([...perms, perm])
    }
  }

  return (
    <Modal titleId="permissions-title" onClose={onClose}>
      <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-deep">
            <ShieldPlus className="h-4 w-4" />
            Phân quyền &amp; Phân công
          </div>
          <h2
            id="permissions-title"
            className="mt-1 font-display text-lg font-bold text-text-primary"
          >
            {account.name} ({account.id})
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {account.roleTitle} · {account.facility}
          </p>
        </div>
        <button
          aria-label="Đóng hộp thoại"
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-subsurface hover:text-text-primary"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
        <div>
          <FieldLabel required>Phòng khám / Khoa được phân công</FieldLabel>
          <select
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-text-primary focus:border-brand-primary focus:outline-none"
          >
            {CLINICS_LIST.map((cl) => (
              <option key={cl} value={cl}>
                {cl}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Danh mục quyền hạn chuyên môn</FieldLabel>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {availableOptions.map((opt) => {
              const checked = perms.includes(opt)
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors ${
                    checked
                      ? "border-brand-primary/40 bg-brand-surface/40 text-text-primary"
                      : "border-border-subtle bg-surface text-text-secondary hover:bg-subsurface"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePermission(opt)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border-subtle text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-xs font-medium leading-relaxed">{opt}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-canvas px-6 py-4 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          className="border border-border-subtle"
          onClick={onClose}
        >
          Hủy
        </Button>
        <Button onClick={() => onSave(perms, clinic)}>Lưu thay đổi</Button>
      </div>
    </Modal>
  )
}

interface Props {
  currentUser?: AuthUser
}

export default function IdentityManagement({ currentUser }: Props) {
  const [accountsList, setAccountsList] =
    useState<HospitalAccount[]>(DEFAULT_ACCOUNTS)
  const [query, setQuery] = useState("")
  const [clinicFilter, setClinicFilter] = useState("Tất cả")
  const [roleFilter, setRoleFilter] = useState("Tất cả")
  const [statusFilter, setStatusFilter] = useState("Tất cả")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedForPerms, setSelectedForPerms] =
    useState<HospitalAccount | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("vi")
    return accountsList.filter((acc) => {
      const matchQuery =
        !q ||
        [acc.id, acc.name, acc.username, acc.email, acc.phone, acc.clinic].some(
          (field) => field.toLocaleLowerCase("vi").includes(q),
        )

      const matchClinic =
        clinicFilter === "Tất cả" || acc.clinic === clinicFilter
      const matchRole =
        roleFilter === "Tất cả" || ROLE_CONFIG[acc.role].label === roleFilter
      const matchStatus =
        statusFilter === "Tất cả" || acc.status === statusFilter

      return matchQuery && matchClinic && matchRole && matchStatus
    })
  }, [accountsList, query, clinicFilter, roleFilter, statusFilter])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [query, clinicFilter, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize))
  const paginatedAccounts = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAccounts.slice(start, start + pageSize)
  }, [filteredAccounts, page, pageSize])

  // Statistics
  const stats = useMemo(() => {
    const total = accountsList.length
    const clinical = accountsList.filter(
      (a) => a.role === "physician" || a.role === "nurse",
    ).length
    const techAndIntake = accountsList.filter(
      (a) => a.role === "paraclinical_tech" || a.role === "receptionist",
    ).length
    const active = accountsList.filter((a) => a.status === "Đang hoạt động").length
    const locked = total - active
    return { total, clinical, techAndIntake, active, locked }
  }, [accountsList])

  // Actions
  const handleToggleLock = (targetAcc: HospitalAccount) => {
    const isSelf =
      targetAcc.isRoot ||
      (currentUser &&
        (currentUser.id === targetAcc.id ||
          currentUser.name === targetAcc.name))

    if (isSelf && targetAcc.status === "Đang hoạt động") {
      setNotice("Không thể tự khóa tài khoản quản trị đang đăng nhập (Bảo vệ an ninh hệ thống).")
      return
    }

    const nextStatus: AccountStatus =
      targetAcc.status === "Đang hoạt động" ? "Đã khóa" : "Đang hoạt động"
    setAccountsList((prev) =>
      prev.map((acc) =>
        acc.id === targetAcc.id ? { ...acc, status: nextStatus } : acc,
      ),
    )
    setNotice(
      nextStatus === "Đã khóa"
        ? `Đã tạm khóa tài khoản của ${targetAcc.name} (${targetAcc.id}). Tất cả phiên hoạt động đã bị thu hồi.`
        : `Đã mở khóa và kích hoạt lại tài khoản của ${targetAcc.name} (${targetAcc.id}).`,
    )
  }

  const handleResetPassword = (targetAcc: HospitalAccount) => {
    const tempPass = `HPMS@${Math.floor(1000 + Math.random() * 9000)}!`
    setNotice(
      `Đã tạo mật khẩu tạm thời [${tempPass}] cho ${targetAcc.name}. Hướng dẫn đặt lại đã được gửi đến ${targetAcc.email}.`,
    )
  }

  const handleResetMfa = (targetAcc: HospitalAccount) => {
    setNotice(
      `Đã đặt lại xác thực 2 lớp (MFA) cho ${targetAcc.name} (${targetAcc.id}). Nhân viên sẽ được yêu cầu quét lại mã ở lần đăng nhập tiếp theo.`,
    )
  }

  const handleCreate = (newAcc: HospitalAccount) => {
    setAccountsList([newAcc, ...accountsList])
    setIsCreateOpen(false)
    setNotice(
      `Đã cấp mới tài khoản cho ${newAcc.name} (${newAcc.id}) thành công. Email kích hoạt đã gửi tới ${newAcc.email}.`,
    )
  }

  const handleSavePerms = (newPerms: string[], newClinic: string) => {
    if (!selectedForPerms) return
    setAccountsList((prev) =>
      prev.map((acc) =>
        acc.id === selectedForPerms.id
          ? { ...acc, permissions: newPerms, clinic: newClinic }
          : acc,
      ),
    )
    setNotice(
      `Đã cập nhật quyền hạn và điều phối phòng khám cho ${selectedForPerms.name}.`,
    )
    setSelectedForPerms(null)
  }

  return (
    <>
      <section className="space-y-6">
        {/* Notice alert */}
        {notice && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-brand-primary/30 bg-brand-surface p-4 text-xs font-semibold text-brand-deep shadow-clinical-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-deep" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded p-1 hover:bg-brand-primary/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-deep">
              <Building2 className="h-4 w-4" />
              Cơ sở dữ liệu nhân sự &amp; Tài khoản y tế
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Quản trị tài khoản Bệnh viện &amp; Phòng khám
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Cấp mới, phân quyền chuyên môn, phân công phòng khám và kiểm soát trạng thái đăng nhập cho toàn thể y bác sĩ và nhân viên.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            Cấp tài khoản mới
          </Button>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-clinical-xs">
            <div className="flex items-center justify-between text-text-muted">
              <span className="font-heading text-xs font-semibold">Tổng nhân sự</span>
              <Users className="h-4 w-4 text-brand-deep" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
              {stats.total}
            </div>
            <div className="mt-0.5 text-[11px] text-text-muted">Tài khoản toàn viện</div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-clinical-xs">
            <div className="flex items-center justify-between text-text-muted">
              <span className="font-heading text-xs font-semibold">Bác sĩ &amp; Điều dưỡng</span>
              <Stethoscope className="h-4 w-4 text-brand-deep" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
              {stats.clinical}
            </div>
            <div className="mt-0.5 text-[11px] text-text-muted">Nhân sự khối lâm sàng</div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-clinical-xs">
            <div className="flex items-center justify-between text-text-muted">
              <span className="font-heading text-xs font-semibold">KTV &amp; Tiếp đón</span>
              <FlaskConical className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
              {stats.techAndIntake}
            </div>
            <div className="mt-0.5 text-[11px] text-text-muted">Cận lâm sàng &amp; Tiền sảnh</div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-clinical-xs">
            <div className="flex items-center justify-between text-text-muted">
              <span className="font-heading text-xs font-semibold">Trạng thái tài khoản</span>
              <ShieldCheck className="h-4 w-4 text-normal" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 font-mono text-2xl font-bold tabular-nums">
              <span className="text-normal">{stats.active}</span>
              <span className="text-xs font-normal text-text-muted">hoạt động</span>
              {stats.locked > 0 && (
                <span className="ml-1 text-xs font-semibold text-critical">
                  ({stats.locked} khóa)
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-text-muted">Tỷ lệ khả dụng cao</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-clinical-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên, mã NV, username, email..."
                className="w-full rounded-lg border border-border-subtle bg-subsurface py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-disabled focus:border-brand-primary focus:bg-surface focus:outline-none"
              />
            </div>

            {/* Clinic / Department Filter */}
            <div>
              <select
                value={clinicFilter}
                onChange={(e) => setClinicFilter(e.target.value)}
                aria-label="Lọc theo phòng khám"
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary focus:border-brand-primary focus:outline-none"
              >
                <option value="Tất cả">Tất cả khoa / phòng khám</option>
                {CLINICS_LIST.map((cl) => (
                  <option key={cl} value={cl}>
                    {cl}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Lọc theo vai trò"
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary focus:border-brand-primary focus:outline-none"
              >
                <option value="Tất cả">Tất cả vai trò chức danh</option>
                <option value="Bác sĩ">Bác sĩ (Physician)</option>
                <option value="Điều dưỡng">Điều dưỡng (Nurse)</option>
                <option value="KTV Cận lâm sàng">KTV Cận lâm sàng (Tech)</option>
                <option value="Tiếp đón">Nhân viên Tiếp đón</option>
                <option value="Quản trị viên">Quản trị viên (Admin)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Lọc theo trạng thái"
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-primary focus:border-brand-primary focus:outline-none"
              >
                <option value="Tất cả">Tất cả trạng thái tài khoản</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Đã khóa">Đã khóa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-clinical-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="border-b border-border-strong bg-subsurface text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Mã NV / Tài khoản</th>
                  <th className="px-4 py-3">Họ và tên nhân sự</th>
                  <th className="px-4 py-3">Vai trò chức danh</th>
                  <th className="px-4 py-3">Khoa / Phòng khám</th>
                  <th className="px-4 py-3">Đăng nhập gần nhất</th>
                  <th className="px-4 py-3">Bảo mật MFA</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {paginatedAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-xs text-text-muted"
                    >
                      Không tìm thấy tài khoản nhân viên nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((account) => {
                    const RoleIcon = ROLE_CONFIG[account.role].icon
                    const isSelf =
                      account.isRoot ||
                      (currentUser &&
                        (currentUser.id === account.id ||
                          currentUser.name === account.name))

                    return (
                      <tr
                        key={account.id}
                        className={`transition-colors hover:bg-canvas ${
                          account.status === "Đã khóa"
                            ? "bg-subsurface/40 opacity-75"
                            : ""
                        }`}
                      >
                        {/* ID & Username */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <div className="font-mono text-xs font-bold text-brand-deep">
                            {account.id}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-text-muted">
                            @{account.username}
                          </div>
                        </td>

                        {/* Name & Contact */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading text-xs font-bold text-text-primary">
                              {account.name}
                            </span>
                            {account.isRoot && (
                              <Tooltip content="Tài khoản quản trị viên gốc">
                                <span className="inline-flex rounded bg-brand-surface px-1.5 py-0.2 text-[10px] font-bold text-brand-deep">
                                  Root
                                </span>
                              </Tooltip>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {account.email}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {account.phone}
                            </span>
                          </div>
                        </td>

                        {/* Role with Permissions Tooltip */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Tooltip
                            content={
                              <div className="space-y-1">
                                <div className="font-bold text-brand-surface">
                                  Quyền hạn chuyên môn:
                                </div>
                                {account.permissions.map((p) => (
                                  <div key={p} className="text-[11px]">
                                    • {p}
                                  </div>
                                ))}
                              </div>
                            }
                          >
                            <span
                              className={`cursor-help inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${ROLE_CONFIG[account.role].badgeClass}`}
                            >
                              <RoleIcon className="h-3.5 w-3.5 shrink-0" />
                              {account.roleTitle}
                            </span>
                          </Tooltip>
                        </td>

                        {/* Clinic & Facility */}
                        <td className="px-4 py-3.5 text-xs">
                          <div className="font-semibold text-text-primary">
                            {account.clinic}
                          </div>
                          <div className="mt-0.5 text-[11px] text-text-muted">
                            {account.facility}
                          </div>
                        </td>

                        {/* Last Login & Workstation */}
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-text-muted">
                          <div>{account.lastLogin}</div>
                          <div className="text-[10px] text-text-disabled">
                            {account.workstation}
                          </div>
                        </td>

                        {/* MFA Status */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              account.mfaEnabled
                                ? "bg-normal-bg text-normal"
                                : "bg-warning-bg text-warning"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                account.mfaEnabled ? "bg-normal" : "bg-warning"
                              }`}
                            />
                            {account.mfaEnabled ? "Đã bật 2FA" : "Chưa bật"}
                          </span>
                        </td>

                        {/* Account Status */}
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-heading text-xs font-semibold ${
                              account.status === "Đang hoạt động"
                                ? "border-sptt-stable-border/50 bg-sptt-stable-bg text-sptt-stable"
                                : "border-sptt-red-border/50 bg-sptt-red-bg text-sptt-red"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                account.status === "Đang hoạt động"
                                  ? "bg-sptt-stable-border"
                                  : "bg-sptt-red-border"
                              }`}
                            />
                            {account.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Phân quyền */}
                            <Tooltip content="Chỉnh sửa phân công & quyền hạn">
                              <button
                                type="button"
                                onClick={() => setSelectedForPerms(account)}
                                aria-label={`Phân quyền cho ${account.name}`}
                                className="interactive-tactile flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary shadow-clinical-xs transition-colors hover:border-brand-primary hover:bg-brand-surface hover:text-brand-deep"
                              >
                                <ShieldPlus className="h-3.5 w-3.5" />
                              </button>
                            </Tooltip>

                            {/* Khóa / Mở khóa */}
                            <Tooltip
                              content={
                                isSelf
                                  ? "Không thể tự khóa tài khoản quản trị đang đăng nhập"
                                  : account.status === "Đã khóa"
                                    ? "Mở khóa tài khoản"
                                    : "Tạm khóa tài khoản"
                              }
                            >
                              <button
                                type="button"
                                disabled={Boolean(isSelf)}
                                onClick={() => handleToggleLock(account)}
                                aria-label={`${
                                  account.status === "Đã khóa" ? "Mở khóa" : "Khóa"
                                } tài khoản ${account.name}`}
                                className={`interactive-tactile flex h-7 w-7 items-center justify-center rounded-lg border shadow-clinical-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                  account.status === "Đã khóa"
                                    ? "border-normal/30 bg-normal-bg text-normal hover:bg-normal-bg/80"
                                    : "border-border-subtle bg-surface text-text-secondary hover:border-critical-border hover:bg-critical-bg hover:text-critical"
                                }`}
                              >
                                {account.status === "Đã khóa" ? (
                                  <LockOpen className="h-3.5 w-3.5" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </Tooltip>

                            {/* Đặt lại mật khẩu */}
                            <Tooltip content="Đặt lại mật khẩu tạm thời">
                              <button
                                type="button"
                                onClick={() => handleResetPassword(account)}
                                aria-label={`Đặt lại mật khẩu cho ${account.name}`}
                                className="interactive-tactile flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary shadow-clinical-xs transition-colors hover:border-warning hover:bg-warning-bg hover:text-warning"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            </Tooltip>

                            {/* Đặt lại MFA */}
                            <Tooltip content="Đặt lại bảo mật 2 lớp (MFA)">
                              <button
                                type="button"
                                onClick={() => handleResetMfa(account)}
                                aria-label={`Đặt lại MFA cho ${account.name}`}
                                className="interactive-tactile flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-surface text-text-secondary shadow-clinical-xs transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredAccounts.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="tài khoản nhân sự"
          />
        </div>
      </section>

      {/* Create Account Modal */}
      {isCreateOpen && (
        <CreateAccountModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreate}
          existingCount={accountsList.length}
        />
      )}

      {/* Permissions Modal */}
      {selectedForPerms && (
        <PermissionsModal
          account={selectedForPerms}
          onClose={() => setSelectedForPerms(null)}
          onSave={handleSavePerms}
        />
      )}
    </>
  )
}
