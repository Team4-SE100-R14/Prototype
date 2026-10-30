# HPMS Prototype – Hướng dẫn demo

Prototype giao diện của Hệ thống Quản lý Bệnh viện & Bệnh nhân (HPMS), React 19 + Vite + Tailwind CSS v4. Toàn bộ dữ liệu là mock chạy phía trình duyệt, không có backend.

Tài liệu này hướng dẫn chạy và demo các module theo SRS:

| Module | Nội dung | Mục |
|---|---|---|
| AUTH | Đăng nhập, MFA, mã khôi phục, phiên làm việc, phân quyền | 5 |
| ADM | Tiếp nhận, phân luồng cấp cứu, hồ sơ cá nhân bệnh nhân, che thông tin định danh | 6 |
| EXAM | Gọi khám, khám bệnh, ICD-10, ký duyệt và khóa phiếu khám, phụ lục | 7 |
| PARAC | Chỉ định và nhập kết quả cận lâm sàng | 7 |
| PRES | Kê đơn điện tử và kiểm tra an toàn thuốc | 3 |
| REC | Ghi nhận sinh hiệu và cảnh báo tại giường bệnh | 4 |
| Quản trị | Dashboard quản trị bệnh viện, nhật ký kiểm toán | 8 |
| INCARE | Chỉ định nhập viện, xếp giường, chuyển giường, bệnh án nội trú, xuất viện | 9 |
| REPORT | Báo cáo RPT-01, 02, 03, 06 và xuất CSV (RPT-05 là nhật ký kiểm toán ở mục 8) | 10 |

## 1. Chạy prototype

```bash
pnpm install
pnpm run dev
```

Có thể dùng `npm install` và `npm run dev` thay cho pnpm. Server chạy ở `http://localhost:8443`. Cổng đặt trong file `.env` (`PORT=8443`); nếu chưa có `.env`, sao chép từ `.env.example`. Biến môi trường `PORT` của shell, nếu có, được ưu tiên hơn `.env`.

Build production:

```bash
pnpm run build
```

Lưu ý: `vite.config.ts` đọc `.figma/make/site.json` (tiêu đề, ngôn ngữ trang). File này đã có trong repo. Nếu thiếu, build sẽ lỗi `UNRESOLVED_IMPORT`.

## 2. Tài khoản demo

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin` | `Admin@12345` |
| Bác sĩ (BS. Trần Minh Khoa) | `dat.nguyen` | `Doctor@12345` |
| Điều dưỡng (ĐD. Phạm Thị Lan) | `mai.le` | `Nurse@12345` |
| KTV Cận lâm sàng | `tuan.cls` | `Tech@12345` |
| Tiếp đón | `lan.tiepdon` | `Reception@123` |
| Bệnh nhân | `bn-26-0089` | `Patient@1234` |

Các nút vai trò ở đầu trang đăng nhập (Bác sĩ, Điều dưỡng, …) giúp điền nhanh tên đăng nhập.

**Xác thực MFA:** mọi vai trò đều phải qua bước MFA. Nhập mã thử nghiệm **`481920`** vào 6 ô rồi bấm "Xác thực & Vào hệ thống". Mã không hết hạn và chỉ dùng cho prototype.

**Khóa tài khoản:** nhập sai mật khẩu 5 lần sẽ khóa tài khoản đó 15 phút. Khi demo, tránh nhập sai nhiều lần liên tiếp.

## 3. Demo PRES – Kê đơn điện tử

Đăng nhập bằng `dat.nguyen`, vào **Kê đơn thuốc** ở thanh bên trái. Màn hình mở sẵn đơn nháp `DT-26-0087` của bệnh nhân Nguyễn Văn A (BN-2026-0901), có tiền sử dị ứng **Penicillin**.

Bảng **Điều khiển demo** (nút ở góc trái dưới) điều khiển kịch bản. Bấm vào nút để mở rộng bảng.

### 3.1 Kịch bản bệnh nhân/phiếu khám

| Kịch bản | Hiển thị |
|---|---|
| Chưa có đơn | Đơn nháp trống để lập mới |
| Có đơn nháp của tôi | Đơn nháp đang soạn (mặc định) |
| Đơn nháp của bác sĩ khác | Đơn bị khóa quyền chỉnh sửa, chỉ bác sĩ tạo đơn mới mở được |
| Đơn đã khóa | Đơn đã khóa, không sửa được; có luồng **đơn thay thế** |
| Phiếu khám đã hoàn tất | Đơn khóa và phiếu khám ở trạng thái hoàn tất |

### 3.2 Thêm thuốc và kiểm tra an toàn

1. Bấm **+ Thêm thuốc**, gõ ít nhất 2 ký tự tên thuốc hoặc hoạt chất, chọn thuốc, điền liều và bấm lưu.
2. Bấm **Kiểm tra an toàn** ở thanh dưới màn hình. Kết quả hiện ở khối "Tương tác thuốc".
3. Khi không còn cảnh báo chặn, bấm **Khóa đơn**.

Dữ liệu mẫu để gây ra từng loại cảnh báo:

| Muốn thấy | Thêm thuốc | Kết quả |
|---|---|---|
| Dị ứng | Amoxicillin, Penicillin V, Ampicillin (bất kỳ thuốc nhóm penicillin) | Modal "Cảnh báo dị ứng thuốc", phải xóa thuốc mới khóa được đơn |
| Tương tác nghiêm trọng | Coumadin 5mg (Warfarin) + Aspirin 81mg | Modal nghiêm trọng, phải gỡ thuốc vi phạm mới khóa được |
| Tương tác trung bình | Amlodipine 5mg + Zocor 20mg (Simvastatin) | Phải nhập lý do lâm sàng tối thiểu 10 ký tự |
| Tương tác nhẹ | Panadol 500mg + Primperan 10mg | Cảnh báo nhẹ, ghi nhận rồi khóa đơn |
| Thuốc ngưng sử dụng | Ranitidine 150mg | Báo thuốc không còn trong danh mục |

### 3.3 Dịch vụ rxcheck.dev (REQ-PRES-04)

Trong bảng Điều khiển demo, chọn trạng thái dịch vụ kiểm tra tương tác bên ngoài **rồi** bấm **Kiểm tra an toàn**. Đơn nháp mặc định (Amlodipine + Panadol, 2 hoạt chất) đủ để thấy mọi trạng thái.

| Trạng thái chọn | Hành vi mong đợi |
|---|---|
| Hoạt động bình thường | Chờ khoảng 0,65 giây, nguồn "rxcheck.dev (dịch vụ ngoài)" |
| Lỗi – quá thời gian | Chờ 2 giây, chuyển sang bảng tương tác nội bộ, hiện cảnh báo dịch vụ ngoài không khả dụng |
| Quá giới hạn yêu cầu (429) | Dùng bảng nội bộ ngay, tạm dừng gọi dịch vụ ngoài 60 giây, hiện bộ đếm ngược |
| Bộ ngắt kết nối đang mở | Dùng bảng nội bộ ngay |
| Đã có trong bộ nhớ đệm | Hiện ngay kết quả, kèm nhãn "Từ bộ nhớ đệm" |

Gợi ý kịch bản: chạy "Hoạt động bình thường" trước để tổ hợp hoạt chất được lưu vào cache; các lần kiểm tra sau với cùng tổ hợp sẽ hiện "Từ bộ nhớ đệm". Trong 60 giây tạm dừng của 429, mọi lần kiểm tra đều dùng bảng nội bộ dù bạn chọn trạng thái khác; hết 60 giây dịch vụ tự về bình thường.

Nếu đơn chỉ có **1 hoạt chất** (xóa bớt thuốc), hệ thống bỏ qua kiểm tra tương tác và hiện "Đơn chỉ có 1 hoạt chất, không cần kiểm tra tương tác", không có dòng Nguồn.

### 3.4 Các điều khiển khác

- **Tiền sử dị ứng:** tắt để mô phỏng dịch vụ tra cứu dị ứng lỗi, lúc đó kiểm tra an toàn chuyển sang trạng thái lỗi và không khóa được đơn.
- **Khóa đơn:** bật mô phỏng lỗi ghi nhật ký an toàn, khóa đơn thất bại và hiện thông báo thử lại.
- **Lưu nháp:** đơn nháp được lưu trong localStorage của trình duyệt theo từng bệnh nhân. Xóa localStorage nếu muốn bắt đầu lại từ dữ liệu mẫu.

## 4. Demo REC – Sinh hiệu và cảnh báo tại giường

Có hai cách vào:

- Đăng nhập `mai.le` (Điều dưỡng) để thấy màn hình ghi sinh hiệu đầy đủ.
- Hoặc đăng nhập `dat.nguyen` và chọn **Bảng giường bệnh** hay **Danh sách cảnh báo** ở thanh bên trái.

Bảng giường có 12 giường (301A đến 306B). Dữ liệu sẵn có: giường **302A** (SpO₂ 88%) ở mức đỏ, giường **305B** (mạch 112) ở mức vàng, bệnh nhân khác ổn định.

### 4.1 Ghi sinh hiệu (REQ-REC-01, 02)

1. Chọn một giường, nhập các chỉ số: nhịp thở, SpO₂, mạch, huyết áp tâm thu/tâm trương, nhiệt độ.
2. Lưu. Hệ thống đánh giá theo ngưỡng từng chỉ số và tạo cảnh báo vàng/đỏ khi vi phạm.

Bảng **Điều khiển demo** (nút "Điều khiển demo" ở góc dưới) có sẵn các nút điền nhanh dữ liệu: Ổn định, Cảnh báo vàng, Cảnh báo đỏ, Thiếu chỉ số, Ngoài miền sinh lý, Dao động trong khoảng vàng, Vàng → Đỏ, Về bình thường rồi vi phạm lại.

### 4.2 Chống cảnh báo trùng (REQ-REC-04)

Dùng nút **Dao động trong khoảng vàng** rồi lưu nhiều lần: cảnh báo vàng lặp lại bị giữ trong thời gian chống trùng 15 phút. Dùng các nút **+5 / +10 / +16 phút** để tua đồng hồ mô phỏng và quan sát khi cảnh báo được phép phát lại. Cảnh báo **Vàng → Đỏ** luôn leo thang ngay, không bị chặn.

### 4.3 Cảnh báo thời gian thực (REQ-REC-03)

Cũng trong bảng demo, mục **Mô phỏng SSE**:

- **Đẩy cảnh báo đỏ giường 302A / vàng giường 305B:** thêm cảnh báo mới, chuông rung và bộ đếm "chưa xác nhận" tăng.
- **Ngắt kết nối SSE:** hiện trạng thái mất kết nối; **Kết nối lại và đồng bộ** để nhận lại cảnh báo bị lỡ.
- **Mô phỏng token hết hạn (15 phút):** kiểm tra luồng làm mới phiên.
- **Đang điều trị / Đã xuất viện:** kiểm tra giường của bệnh nhân đã xuất viện.
- **Đặt lại dữ liệu mock** đưa mọi thứ về trạng thái ban đầu.

## 5. Demo AUTH – Xác thực, phiên làm việc, phân quyền

Mọi vai trò (kể cả Tiếp đón và Bệnh nhân) đều qua MFA khi đăng nhập. Các chức năng phiên nằm trong menu **Bảo mật phiên** ở thanh trên cùng của mọi màn hình.

### 5.1 Đăng nhập và MFA (REQ-AUTH-01, 02)

1. Ở trang đăng nhập, chọn vai trò rồi nhập tài khoản ở mục 2. Sai mật khẩu sẽ báo lỗi; sai 5 lần khóa tài khoản 15 phút.
2. Hộp thoại MFA yêu cầu mã 6 số: nhập `481920`. Trong hộp thoại còn có "Chưa cài đặt thiết bị xác thực? Quét mã QR tại đây" (thiết lập minh họa) và "Dùng mã khôi phục dự phòng".

### 5.2 Mã khôi phục dự phòng (REQ-AUTH-05)

1. Vào **Bảo mật phiên → Bảo mật tài khoản**. Màn hình hiện trạng thái MFA và số mã khôi phục còn dùng (ban đầu 0/8).
2. Bấm **Tạo lại mã khôi phục dự phòng**. Hệ thống yêu cầu xác thực lại bằng mật khẩu hiện tại và mã `481920`, sau đó tạo 8 mã mới và vô hiệu hóa mã cũ.
3. Mã đã tạo có thể dùng ở hộp thoại MFA lần đăng nhập sau, qua "Dùng mã khôi phục dự phòng" (mỗi mã dùng một lần).

### 5.3 Đặt lại MFA của nhân viên (REQ-AUTH-05)

Đăng nhập `admin`, vào **Bảo mật phiên → Quản lý MFA nhân viên**. Danh sách nhân viên có trạng thái MFA và nút **Đặt lại MFA (Reset MFA)**. Thao tác này thu hồi mã cũ và chấm dứt các phiên đang hoạt động của nhân viên đó, nên lần đăng nhập sau họ phải thiết lập MFA lại. Quản trị viên **không thể tự đặt lại MFA của chính mình** (Self-Reset Denial), cần một quản trị viên khác thực hiện.

### 5.4 Phiên làm việc (REQ-AUTH-03)

Trong menu **Bảo mật phiên**:

- **Mô phỏng khóa máy trạm:** hiện màn hình khóa; nhập mật khẩu tài khoản để mở. Nhập sai quá 3 lần sẽ hủy phiên và yêu cầu xác thực lại bằng MFA.
- **Mô phỏng hết hạn phiên:** hiện cảnh báo đếm ngược 58 giây với hai lựa chọn **Gia hạn phiên làm việc** hoặc **Đăng xuất ngay**.

### 5.5 Phân quyền (REQ-AUTH-04)

Chọn **Bảo mật phiên → Kiểm tra quyền truy cập bệnh án**:

- Bác sĩ và Quản trị viên: hiện thông báo được phép.
- Điều dưỡng, KTV, Tiếp đón, Bệnh nhân: hiện trang **403 Forbidden** và ghi sự kiện từ chối truy cập vào nhật ký.

## 6. Demo ADM – Tiếp nhận và hồ sơ bệnh nhân

### 6.1 Tiếp đón (`lan.tiepdon`) – REQ-ADM-01, 02, 03, 05, 06

1. **Tra cứu:** nhập chuỗi bất kỳ (CCCD, SĐT hoặc họ tên + ngày sinh) và bấm **Tra cứu**; prototype trả về hồ sơ có sẵn Nguyễn Văn An (BN-26-0001). Để trống sẽ báo thiếu thông tin.
2. **Đăng ký mới:** bấm **+ Đăng ký hồ sơ mới**. Mã bệnh nhân `BN-26-xxxx` được sinh tự động, tăng dần. Bỏ trống trường bắt buộc rồi lưu sẽ báo lỗi từng trường.
3. **Trùng CCCD:** khi đăng ký mới, nhập CCCD `079456789123` rồi lưu để thấy cảnh báo trùng với hồ sơ BN-26-0001 và nút **Mở hồ sơ hiện có**.
4. **Phân luồng:** chọn **Cấp cứu** thì bệnh nhân vào Khoa Cấp cứu (ưu tiên 1) và được ghim đầu hàng đợi; chọn **Không cấp cứu** thì vào Khoa Khám ngoại trú (ưu tiên 2). Phải chọn phân loại mới lưu được.
5. **Che thông tin định danh:** CCCD và SĐT hiển thị dạng che. Bấm **Hiện đầy đủ** để mở che trong 30 giây; thao tác được ghi vào nhật ký (`NhatKyHeThong`).
6. **Hàng đợi:** các tab Tất cả, Khoa Cấp cứu, Khoa Khám ngoại trú; chọn số bản ghi mỗi trang (5, 10, 20); mỗi dòng có **Điều phối** và **Chi tiết**.

### 6.2 Bệnh nhân (`bn-26-0089`) – REQ-ADM-04, 05

Màn hình **Hồ sơ sức khỏe cá nhân** (mock là hồ sơ BN-26-0001, Nguyễn Văn An):

- CCCD và SĐT bị che; bấm **Bỏ che thông tin (Hiển thị đầy đủ)** để xem.
- Tiền sử dị ứng (Penicillin, Aspirin), bệnh mạn tính (I10).
- Bốn nhóm: lịch sử khám ngoại trú, hồ sơ điều trị nội trú, đơn thuốc đang dùng, kết quả cận lâm sàng. Mỗi lượt khám hiện bác sĩ, chẩn đoán ICD-10, kết luận, đơn thuốc đã khóa và kết quả đính kèm (**Xem kết quả**, **Tải về**).

## 7. Demo EXAM và PARAC – Khám bệnh và cận lâm sàng

### 7.1 Bác sĩ khám bệnh (`dat.nguyen`) – REQ-EXAM-01 đến 07

1. Vào **Khám và chẩn đoán**. Chọn phòng khám và lọc mức ưu tiên (Tất cả, Cấp cứu, Bình thường) rồi bấm **Gọi khám** ở bệnh nhân đầu hàng đợi (Nguyễn Văn A, BN-2026-0901, có dị ứng Penicillin).
2. Phiếu khám gồm 5 phần: thông tin bệnh nhân; hồ sơ sức khỏe (chỉ đọc, hiện cảnh báo dị ứng); khám lâm sàng (triệu chứng, chẩn đoán sơ bộ ICD-10 có gợi ý); cận lâm sàng; kết luận (chẩn đoán xác định ICD-10 và kết luận điều trị).
3. **Chỉ định CLS mới** mở hộp thoại chọn dịch vụ xét nghiệm hoặc chẩn đoán hình ảnh. Khi gửi, hệ thống tạo phiếu cha gồm các dịch vụ đã chọn và chuyển sang hàng đợi KTV.
4. **Ký duyệt & Hoàn tất khám** bị chặn nếu chưa có kết quả cận lâm sàng hoặc chưa chọn ICD-10 chẩn đoán xác định. Bệnh nhân mặc định đã có phiếu CLS-26-1020 có kết quả nên chỉ cần chọn chẩn đoán xác định rồi ký.
5. Sau khi ký, phiếu khám khóa bất biến ("Phiếu khám đã khóa"). Mọi thay đổi sau đó phải thêm bằng **Thêm phụ lục bệnh án**.

Kê đơn thuốc cho bệnh nhân đang khám nằm ở mục **Kê đơn thuốc** (xem mục 3).

### 7.2 KTV cận lâm sàng (`tuan.cls`) – REQ-PARAC-01 đến 04

1. Màn hình **Danh sách Hàng đợi Cận lâm sàng** cho chọn phòng làm việc và lọc trạng thái (Chờ thực hiện, Đang thực hiện, Đã hoàn tất). Mặc định có phiếu CLS-26-1022 (Lê Hoàng Nam, Đường huyết) chờ thực hiện.
2. Bấm **Tiếp nhận** để mở màn hình nhập kết quả: thông tin chỉ định, kết quả chi tiết theo chỉ số (đơn vị, khoảng tham chiếu), mô tả/kết luận của KTV và khu vực đính kèm tệp PDF/ảnh.
3. **Lưu nháp** hoặc **Lưu & Hoàn tất dịch vụ**.

Dữ liệu phiếu chỉ định, phiếu khám dùng chung qua localStorage của trình duyệt (`hpms-clinical-parent-orders-v3`, `hpms-clinical-encounters-v1`). Để thử luồng liên vai trò (bác sĩ chỉ định, KTV nhập kết quả, bác sĩ xem kết quả), đăng nhập các vai trò lần lượt trong cùng một trình duyệt. Muốn bắt đầu lại, xóa hai khóa này.

## 8. Demo Quản trị – Dashboard quản trị bệnh viện

Đăng nhập `admin`. Dashboard có thẻ chỉ số tổng quan (lượt khám, công suất giường, phòng khám quá tải, bác sĩ đang trực) và 5 tab:

| Tab | Nội dung |
|---|---|
| Hàng đợi phòng khám | Tải từng phòng khám, đánh dấu quá tải khi từ 95% công suất |
| Công suất giường bệnh | Bảng công suất giường |
| Ca trực bác sĩ | Lịch trực trong ngày |
| Danh mục thuốc | Danh mục thuốc của bệnh viện |
| Báo cáo & Thống kê | RPT-01, 02, 03, 06 (xem mục 10) |
| Nhật ký kiểm toán | Tra cứu nhật ký theo khoảng thời gian, người thực hiện, hành động, kết quả, từ khóa; mỗi dòng có **Xem Diff JSON**; nhật ký chỉ ghi thêm (append-only) |

Nhật ký kiểm toán cũng hiện các sự kiện bảo mật do prototype ghi lại (ví dụ truy cập bị từ chối ở mục 5.5), các thao tác nội trú (mục 9) và việc xuất báo cáo (mục 10).

## 9. Demo INCARE – Điều trị nội trú

Luồng nội trú dùng một kho dữ liệu chung trong `localStorage` (khóa `hpms-inpatient-v1`), nên thao tác của vai trò này hiện ngay ở vai trò khác trong cùng trình duyệt. Luồng đầy đủ: **chỉ định nhập viện → hàng chờ xếp giường → xếp giường → bệnh án nội trú (ghi diễn biến, chuyển giường) → xuất viện**.

| Vai trò | Vào ở đâu | Được làm gì |
|---|---|---|
| Bác sĩ (`dat.nguyen`) | **Khám và chẩn đoán** → mở phiếu khám → **Chỉ định nhập viện**; mục **Nội trú** ở thanh bên trái | Tất cả: chỉ định nhập viện, xếp giường, chuyển giường, ghi diễn biến, **xuất viện** |
| Điều dưỡng (`mai.le`) | Tab **Nội trú & Xếp giường** | Xếp giường, chuyển giường, ghi diễn biến, **Đánh dấu sẵn sàng** cho giường bảo trì. Nút **Xuất viện** bị khóa |
| Quản trị viên | Không có màn hình nội trú | Xem kết quả qua báo cáo RPT-02 và nhật ký kiểm toán |

Bác sĩ khác điều dưỡng ở hai điểm: chỉ bác sĩ được xuất viện và chỉ định nhập viện; chỉ điều dưỡng được đánh dấu giường sẵn sàng (bác sĩ bấm sẽ nhận thông báo 403).

### 9.1 Chỉ định nhập viện

1. Đăng nhập `dat.nguyen`, vào **Khám và chẩn đoán**, bấm **Gọi khám** ở bệnh nhân Nguyễn Văn A (BN-2026-0901).
2. Ở thanh dưới phiếu khám bấm **Chỉ định nhập viện**. Hộp thoại tự điền sẵn mã ICD-10 và chẩn đoán từ phiếu khám.
3. Chọn **Khoa điều trị** (bác sĩ tự được chọn nếu thuộc khoa đó), nhập chẩn đoán tối thiểu 5 ký tự, bấm **Xác nhận nhập viện**.
4. Hệ thống sinh mã `BA-26-xxxx` tăng dần và đưa người bệnh vào hàng chờ xếp giường của khoa. Nút trên phiếu khám đổi thành **Nội trú: BA-26-xxxx**.
5. **Chống trùng:** bệnh nhân đã có bệnh án nội trú chưa xuất viện thì lần chỉ định thứ hai báo lỗi "Không thể tạo bệnh án mới" và ghi một dòng *Thất bại* vào nhật ký. Sau khi bệnh án cũ xuất viện mới tạo lại được.

### 9.2 Bảng giường và xếp giường

Vào mục **Nội trú**. Bảng có 15 giường (5 phòng, 3 khoa) và danh sách **Chờ xếp giường** (3 người bệnh có sẵn, cộng người vừa chỉ định). Các chip Trống / Đang sử dụng / Bảo trì được tính từ dữ liệu thật; bộ lọc khoa, phòng và ô tìm theo tên, mã bệnh nhân, mã giường đều hoạt động.

- Bấm **Xếp giường** trên một người đang chờ, hoặc bấm vào một giường **Sẵn sàng** để xếp người đang chờ của khoa đó vào chính giường ấy. Chỉ chọn được giường trống thuộc **đúng khoa** của bệnh án.
- Sau khi xác nhận: giường chuyển **Đang sử dụng**, người bệnh rời hàng chờ, bệnh án chuyển **Đang điều trị**.
- Giường đang bảo trì có nút **Đánh dấu sẵn sàng** (chỉ điều dưỡng).
- Giường có cảnh báo (G-KNOI-201B vàng, G-KNOI-202A đỏ) hiện biểu tượng cảnh báo khi di chuột.

### 9.3 Bệnh án nội trú

Bấm **⋮ → Xem bệnh án** trên giường đang dùng. Bệnh án có bốn tab:

- **Diễn biến bệnh:** biểu đồ sinh hiệu 7 ngày (dữ liệu minh họa), form **Thêm diễn biến bệnh** (tối thiểu 10 ký tự) và lịch sử diễn biến mới nhất trước. Mỗi ghi chép có nhãn "Đã ký số" và không sửa được.
- **Thông tin nhập viện:** mã bệnh án, thời điểm nhập viện, chẩn đoán, ICD-10, lý do, bác sĩ phụ trách; sau xuất viện có thêm khối thông tin xuất viện.
- **Sinh hiệu** và **Y lệnh:** chưa có nội dung, chỉ hiện "Nội dung đang được tổng hợp".

**Chuyển giường:** bấm **Chuyển giường**, chọn khoa và giường trống mới. Giường cũ tự chuyển **Bảo trì**, giường mới chuyển **Đang sử dụng**, và một dòng diễn biến "Chuyển giường A → B" được tự ghi. Nếu giường vừa bị người khác lấy (ví dụ ở tab trình duyệt khác), hệ thống báo "Giường không còn khả dụng".

### 9.4 Xuất viện

Chỉ bác sĩ. Bấm **Xuất viện**, nhập tình trạng ra viện, kết luận điều trị, lời dặn, **ngày tái khám** (bắt buộc), tick ô xác nhận rồi bấm **Xác nhận xuất viện**. Kết quả: bệnh án hiện "Bệnh án đã đóng - chỉ đọc", form thêm diễn biến biến mất, giường chuyển **Bảo trì**. Với điều dưỡng nút này bị vô hiệu hóa, kèm gợi ý "Chỉ bác sĩ điều trị mới được phép xác nhận xuất viện".

### 9.5 Nhật ký kiểm toán

Mỗi thao tác sau ghi một dòng vào `NhatKyHeThong`, xem bằng `admin` ở tab **Nhật ký kiểm toán** (mục 8): Chỉ định nhập viện, Xếp giường, Chuyển giường, Ghi diễn biến, Xuất viện, Đánh dấu giường sẵn sàng. Thao tác bị từ chối (403) hoặc xung đột (trùng bệnh án, giường đã bị lấy) ghi với kết quả *Thất bại*.

### 9.6 Dữ liệu mẫu và đặt lại

- Giường đang dùng: BA-26-0057 Trần Thị Bích (G-KNOI-201B, có ba ghi diễn biến mẫu), BA-26-0050, BA-26-0053, BA-26-0046. Ba ca đã xuất viện (BA-26-0038, 0041, 0044) dùng làm lịch sử cho RPT-02.
- Muốn bắt đầu lại, xóa khóa `hpms-inpatient-v1` trong localStorage rồi tải lại trang.

## 10. Demo REPORT – Báo cáo và thống kê

Đăng nhập `admin`, vào tab **Báo cáo & Thống kê**. Bốn báo cáo nằm ở thanh chọn phía trên:

| Mã | Báo cáo | Nguồn dữ liệu |
|---|---|---|
| RPT-01 | Tiếp nhận & Lượng bệnh nhân | Số liệu mẫu cố định |
| RPT-02 | Giường bệnh & Công suất | **Lấy trực tiếp từ module Nội trú** (mục 9) |
| RPT-03 | Mô hình bệnh tật ICD-10 | Số liệu mẫu cố định |
| RPT-06 | An toàn dùng thuốc | Số liệu mẫu cố định, khớp các kịch bản ở mục 3 |
| RPT-05 | Nhật ký kiểm toán | Tab **Nhật ký kiểm toán** riêng (mục 8) |

- **Bộ lọc kỳ (RPT-01, 03, 06):** chọn từ tháng / đến tháng rồi bấm **Tạo báo cáo**. Ngày bắt đầu lớn hơn ngày kết thúc, hoặc vượt tháng hiện tại, hiện lỗi đỏ; kỳ kết thúc trước 01/2026 hiện trạng thái "Chưa có dữ liệu báo cáo". RPT-01 có thêm lựa chọn Theo tháng / Theo năm.
- **RPT-02:** lọc theo khoa rồi bấm **Tạo báo cáo**. Tổng giường, Trống, Đang sử dụng, Bảo trì, Tỷ lệ lấp đầy, tỷ lệ theo khoa, thời gian nằm viện trung bình (ALOS, tính từ các ca đã xuất viện) và bảng **Lịch sử sử dụng giường** đều đổi theo thao tác ở mục 9. Thử: xếp giường, chuyển giường rồi xuất viện một bệnh nhân, sau đó mở lại RPT-02 để thấy số liệu và các dòng lịch sử mới (lý do kết thúc: Chuyển giường, Xuất viện).
- **Xuất báo cáo:** nút **Xuất báo cáo (CSV)** tải tệp `RPT-xx_yyyymmdd.csv` (UTF-8 có BOM, mở được bằng Excel). Mỗi lần xuất ghi một dòng *Xuất báo cáo* vào nhật ký kiểm toán. RPT-01, 03, 06 đang ở trạng thái lỗi hoặc rỗng thì không xuất.

Chưa có: báo cáo xu hướng sinh hiệu, và xuất PDF/Excel thật (chỉ có CSV).

## 11. Lưu ý khi demo

- Mọi dữ liệu và trạng thái là mô phỏng; không có dịch vụ ngoài thật nào được gọi.
- Đồng hồ trong module REC là **đồng hồ mô phỏng**, tách khỏi giờ hệ thống.
- Nếu giao diện hiển thị dữ liệu cũ (đơn nháp, phiên đăng nhập, bệnh án nội trú), xóa localStorage và sessionStorage của trang rồi tải lại.
- Kiểm tra kiểu bằng `npx tsc --noEmit` (hiện không còn lỗi).
