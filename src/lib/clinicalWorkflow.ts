export type ClinicalPatient = {
  order: number
  id: string
  encounterId: string
  name: string
  age: number
  gender: "Nam" | "Nữ"
  priority: "emergency" | "normal"
  room: string
  allergy: string | null
  allergyAlert: string | null
  medicalHistory: Array<{ period: string; condition: string; note: string }>
  symptoms: string
  diagnosis: string
  conclusion: string
}

export type ClinicalOrderStatus = "pending" | "processing" | "completed"

export type ClinicalSubService = {
  id: string
  name: string
  category: "laboratory" | "imaging"
  status: ClinicalOrderStatus
  resultSummary?: string
  completedAt?: string
}

export type ClinicalOrder = {
  id: string
  patientId: string
  patient: string
  doctor: string
  preliminaryDiagnosis: string
  status: ClinicalOrderStatus
  services: ClinicalSubService[]
  resultSummary?: string
  attachments: string[]
  completedAt?: string
}

export type EncounterSnapshot = {
  symptoms: string
  diagnosis: string
  finalDiagnosis?: string
  conclusion: string
  locked: boolean
  lockedAt?: string
  addenda: Array<{
    id: string
    content: string
    createdAt: string
  }>
}

export const CLINICAL_WORKFLOW_EVENT = "hpms-clinical-workflow-changed"
const ORDER_STORAGE_KEY = "hpms-clinical-parent-orders-v3"
const ENCOUNTER_STORAGE_KEY = "hpms-clinical-encounters-v1"

export const CLINICAL_PATIENTS: ClinicalPatient[] = [
  {
    order: 1,
    id: "BN-2026-0901",
    encounterId: "PK-26-0089",
    name: "Nguyễn Văn A",
    age: 35,
    gender: "Nam",
    priority: "emergency",
    room: "Nội Tổng Hợp 1",
    allergy: "Penicillin",
    allergyAlert: "Bệnh nhân có tiền sử sốc phản vệ với Penicillin",
    medicalHistory: [
      { period: "03/2022", condition: "Sốc phản vệ do Penicillin", note: "Nhập viện cấp cứu 2 ngày, điều trị ổn định" },
      { period: "2020", condition: "Viêm xoang mạn tính", note: "Tái phát theo mùa, điều trị ngoại trú" },
    ],
    symptoms: "Sốt cao, ho nhiều có đờm",
    diagnosis: "J00 - Viêm mũi họng cấp",
    conclusion:
      "Viêm mũi họng cấp, điều trị ngoại trú và theo dõi triệu chứng.",
  },
  {
    order: 2,
    id: "BN-2026-0902",
    encounterId: "PK-26-0090",
    name: "Trần Thị Mai",
    age: 42,
    gender: "Nữ",
    priority: "normal",
    room: "Nội Tổng Hợp 1",
    allergy: null,
    allergyAlert: null,
    medicalHistory: [
      { period: "2024", condition: "Tăng huyết áp độ 1", note: "Theo dõi tại nhà, chưa dùng thuốc" },
      { period: "2021", condition: "Thiếu máu nhẹ", note: "Đã bổ sung sắt, ổn định" },
    ],
    symptoms: "Đau đầu, chóng mặt kéo dài trong ba ngày",
    diagnosis: "R51 - Đau đầu",
    conclusion: "Theo dõi huyết áp và đánh giá nguyên nhân chóng mặt.",
  },
  {
    order: 3,
    id: "BN-2026-0903",
    encounterId: "PK-26-0091",
    name: "Lê Hoàng Nam",
    age: 58,
    gender: "Nam",
    priority: "normal",
    room: "Tim mạch 1",
    allergy: "Sulfonamid",
    allergyAlert: "Tiền sử phát ban toàn thân khi dùng Sulfonamid",
    medicalHistory: [
      { period: "2018", condition: "Tăng huyết áp vô căn", note: "Đang dùng thuốc hạ áp duy trì" },
      { period: "2023", condition: "Phát ban do Sulfonamid", note: "Ngừng thuốc, điều trị kháng histamin" },
    ],
    symptoms: "Tái khám tăng huyết áp, đôi lúc hồi hộp",
    diagnosis: "I10 - Tăng huyết áp vô căn",
    conclusion: "Điều chỉnh phác đồ và tiếp tục theo dõi huyết áp tại nhà.",
  },
  {
    order: 4,
    id: "BN-2026-0904",
    encounterId: "PK-26-0092",
    name: "Phạm Thu Hà",
    age: 29,
    gender: "Nữ",
    priority: "normal",
    room: "Nội Tổng Hợp 2",
    allergy: "Hải sản",
    allergyAlert: "Dị ứng hải sản, từng nổi mề đay và khó thở",
    medicalHistory: [
      { period: "2025", condition: "Viêm dạ dày HP (+)", note: "Đã điều trị diệt HP, tái khám định kỳ" },
      { period: "2019", condition: "Mề đay do hải sản", note: "Tránh tiếp xúc, mang theo thuốc kháng histamin" },
    ],
    symptoms: "Đau bụng âm ỉ vùng thượng vị sau ăn",
    diagnosis: "R10.1 - Đau khu trú vùng bụng trên",
    conclusion: "Theo dõi viêm dạ dày và tư vấn chế độ ăn.",
  },
]

const SEED_ORDERS: ClinicalOrder[] = [
  {
    id: "CLS-26-1020",
    patientId: "BN-2026-0901",
    patient: "Nguyễn Văn A",
    doctor: "BS. Đăng Khoa",
    preliminaryDiagnosis: "Nghi ngờ viêm phổi",
    status: "completed",
    services: [
      {
        id: "DV-1020-01",
        name: "Sinh hóa máu",
        category: "laboratory",
        status: "completed",
        resultSummary: "CRP tăng nhẹ; chức năng gan, thận trong giới hạn.",
        completedAt: "15/10/2026 08:45",
      },
      {
        id: "DV-1020-02",
        name: "Công thức máu toàn phần (CBC)",
        category: "laboratory",
        status: "completed",
        resultSummary:
          "Bạch cầu tăng nhẹ, phù hợp tình trạng nhiễm khuẩn đường hô hấp.",
        completedAt: "15/10/2026 09:10",
      },
    ],
    resultSummary:
      "Sinh hóa máu và công thức máu đã hoàn tất; ghi nhận dấu hiệu viêm nhẹ.",
    attachments: [
      "KetQua_SinhHoa_NguyenVanA.pdf",
      "KetQua_Mau_NguyenVanA.pdf",
    ],
    completedAt: "15/10/2026 09:10",
  },
  {
    id: "CLS-26-1021",
    patientId: "BN-2026-0902",
    patient: "Trần Thị Mai",
    doctor: "BS. Minh Tuấn",
    preliminaryDiagnosis: "Theo dõi tổn thương phổi",
    status: "pending",
    services: [
      {
        id: "DV-1021-01",
        name: "Chụp X-quang ngực thẳng",
        category: "imaging",
        status: "pending",
      },
      {
        id: "DV-1021-02",
        name: "Siêu âm ổ bụng tổng quát",
        category: "imaging",
        status: "pending",
      },
    ],
    attachments: [],
  },
  {
    id: "CLS-26-1022",
    patientId: "BN-2026-0903",
    patient: "Lê Hoàng Nam",
    doctor: "BS. Đăng Khoa",
    preliminaryDiagnosis: "Theo dõi rối loạn đường huyết",
    status: "pending",
    services: [
      {
        id: "DV-1022-01",
        name: "Đường huyết",
        category: "laboratory",
        status: "pending",
      },
    ],
    attachments: [],
  },
  {
    id: "CLS-26-1023",
    patientId: "BN-2026-0904",
    patient: "Phạm Thu Hà",
    doctor: "BS. Thu Hương",
    preliminaryDiagnosis: "Đau vùng thượng vị",
    status: "completed",
    services: [
      {
        id: "DV-1023-01",
        name: "Công thức máu toàn phần (CBC)",
        category: "laboratory",
        status: "completed",
        resultSummary: "Các chỉ số huyết học trong giới hạn tham chiếu.",
        completedAt: "15/10/2026 07:50",
      },
      {
        id: "DV-1023-02",
        name: "Sinh hóa máu",
        category: "laboratory",
        status: "completed",
        resultSummary: "Không ghi nhận bất thường chức năng gan, thận.",
        completedAt: "15/10/2026 07:55",
      },
    ],
    resultSummary: "Các chỉ số huyết học trong giới hạn tham chiếu.",
    attachments: ["KetQua_Mau_PhamThuHa.pdf"],
    completedAt: "15/10/2026 07:50",
  },
]

function announceChange(detail?: {
  type: "order-updated" | "order-completed"
  orderId: string
  patientId: string
}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CLINICAL_WORKFLOW_EVENT, { detail }),
    )
  }
}

export function getClinicalPatient(patientId: string) {
  return CLINICAL_PATIENTS.find((patient) => patient.id === patientId) ||
    CLINICAL_PATIENTS[0]
}

export function readClinicalOrders(): ClinicalOrder[] {
  try {
    const stored = localStorage.getItem(ORDER_STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(SEED_ORDERS))
      return SEED_ORDERS
    }
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : SEED_ORDERS
  } catch {
    return SEED_ORDERS
  }
}

function writeClinicalOrders(
  orders: ClinicalOrder[],
  detail?: {
    type: "order-updated" | "order-completed"
    orderId: string
    patientId: string
  },
) {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders))
  } catch {
    /* Storage is optional for the prototype. */
  }
  announceChange(detail)
}

export function createClinicalOrders({
  patient,
  doctor,
  diagnosis,
  services,
}: {
  patient: ClinicalPatient
  doctor: string
  diagnosis: string
  services: string[]
}) {
  const current = readClinicalOrders()
  const highest = current.reduce((value, order) => {
    const numeric = Number(order.id.split("-").pop())
    return Number.isFinite(numeric) ? Math.max(value, numeric) : value
  }, 1023)
  const orderId = `CLS-26-${highest + 1}`
  const created: ClinicalOrder = {
    id: orderId,
    patientId: patient.id,
    patient: patient.name,
    doctor,
    preliminaryDiagnosis: diagnosis,
    status: "pending",
    services: services.map((service, index) => ({
      id: `DV-${orderId.split("-").pop()}-${String(index + 1).padStart(2, "0")}`,
      name: service,
      category: service.includes("Chụp") || service.includes("Siêu âm")
        ? "imaging"
        : "laboratory",
      status: "pending",
    })),
    attachments: [],
  }
  writeClinicalOrders([...current, created], {
    type: "order-updated",
    orderId: created.id,
    patientId: created.patientId,
  })
  return created
}

export function updateClinicalOrder(
  orderId: string,
  patch: Partial<ClinicalOrder>,
) {
  const orders = readClinicalOrders().map((order) =>
    order.id === orderId ? { ...order, ...patch } : order,
  )
  const updated = orders.find((order) => order.id === orderId)
  writeClinicalOrders(
    orders,
    updated
      ? {
          type:
            updated.status === "completed"
              ? "order-completed"
              : "order-updated",
          orderId,
          patientId: updated.patientId,
        }
      : undefined,
  )
}

export function acceptClinicalOrder(orderId: string) {
  const current = readClinicalOrders()
  const order = current.find((item) => item.id === orderId)
  if (!order || order.status === "completed") return
  updateClinicalOrder(orderId, {
    status: "processing",
    services: order.services.map((service) =>
      service.status === "pending"
        ? { ...service, status: "processing" }
        : service,
    ),
  })
}

export function saveClinicalSubServiceDraft(
  orderId: string,
  serviceId: string,
  resultSummary: string,
) {
  const order = readClinicalOrders().find((item) => item.id === orderId)
  if (!order) return
  updateClinicalOrder(orderId, {
    status: "processing",
    services: order.services.map((service) =>
      service.id === serviceId
        ? { ...service, status: "processing", resultSummary }
        : service,
    ),
  })
}

export function completeClinicalSubService({
  orderId,
  serviceId,
  resultSummary,
  attachment,
}: {
  orderId: string
  serviceId: string
  resultSummary: string
  attachment?: string
}) {
  const current = readClinicalOrders()
  const order = current.find((item) => item.id === orderId)
  if (!order) return null
  const services = order.services.map((service) =>
    service.id === serviceId
      ? {
          ...service,
          status: "completed" as const,
          resultSummary,
          completedAt: new Date().toLocaleString("vi-VN"),
        }
      : service,
  )
  const parentCompleted = services.every(
    (service) => service.status === "completed",
  )
  const updated: ClinicalOrder = {
    ...order,
    status: parentCompleted ? "completed" : "processing",
    services,
    attachments:
      attachment && !order.attachments.includes(attachment)
        ? [...order.attachments, attachment]
        : order.attachments,
    resultSummary: parentCompleted
      ? services
          .map(
            (service) =>
              `${service.name}: ${service.resultSummary || "Đã hoàn tất"}`,
          )
          .join(" · ")
      : order.resultSummary,
    completedAt: parentCompleted
      ? new Date().toLocaleString("vi-VN")
      : order.completedAt,
  }
  writeClinicalOrders(
    current.map((item) => (item.id === orderId ? updated : item)),
    {
      type: parentCompleted ? "order-completed" : "order-updated",
      orderId,
      patientId: order.patientId,
    },
  )
  return updated
}

function readEncounterRegistry(): Record<string, EncounterSnapshot> {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(ENCOUNTER_STORAGE_KEY) || "{}",
    )
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function readEncounter(patient: ClinicalPatient): EncounterSnapshot {
  const stored = readEncounterRegistry()[patient.id]
  return (
    stored || {
      symptoms: patient.symptoms,
      diagnosis: patient.diagnosis,
      finalDiagnosis: "",
      conclusion: patient.conclusion,
      locked: false,
      addenda: [],
    }
  )
}

export function saveEncounterDraft(
  patientId: string,
  snapshot: Pick<
    EncounterSnapshot,
    "symptoms" | "diagnosis" | "finalDiagnosis" | "conclusion"
  >,
) {
  const current = readEncounterRegistry()[patientId]
  if (current?.locked) return false
  writeEncounter(patientId, {
    ...snapshot,
    locked: false,
    addenda: current?.addenda || [],
  })
  return true
}

function writeEncounter(patientId: string, encounter: EncounterSnapshot) {
  const registry = readEncounterRegistry()
  try {
    localStorage.setItem(
      ENCOUNTER_STORAGE_KEY,
      JSON.stringify({ ...registry, [patientId]: encounter }),
    )
  } catch {
    /* Storage is optional for the prototype. */
  }
  announceChange()
}

export function lockEncounter(
  patientId: string,
  snapshot: Omit<EncounterSnapshot, "locked" | "lockedAt" | "addenda">,
) {
  const current = readEncounterRegistry()[patientId]
  writeEncounter(patientId, {
    ...snapshot,
    locked: true,
    lockedAt: new Date().toLocaleString("vi-VN"),
    addenda: current?.addenda || [],
  })
}

export function addEncounterAddendum(patientId: string, content: string) {
  const registry = readEncounterRegistry()
  const current = registry[patientId]
  if (!current?.locked) return false
  writeEncounter(patientId, {
    ...current,
    addenda: [
      ...current.addenda,
      {
        id: `PL-${Date.now()}`,
        content,
        createdAt: new Date().toLocaleString("vi-VN"),
      },
    ],
  })
  return true
}
