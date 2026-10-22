# 📊 Phân Tích Hệ Thống & Đề Xuất Tính Năng Mới

## 🗂️ Hiện Trạng Hệ Thống

### Stack Công Nghệ
- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
- **Frontend**: React (Vite) + TypeScript + Zustand + React Router
- **Auth**: JWT (cookie httpOnly) + 2 role: `TEACHER` / `STUDENT`
- **AI**: Tích hợp AI tutor (chat)

### Chức Năng Đang Có

#### 🔐 Auth
| Tính năng | Trạng thái |
|-----------|-----------|
| Đăng ký tài khoản (mặc định STUDENT) | ✅ |
| Đăng nhập / Đăng xuất | ✅ |
| Xem thông tin cá nhân (`/me`) | ✅ |

#### 🛡️ Admin (TEACHER)
| Tính năng | Trạng thái |
|-----------|-----------|
| Tạo / Sửa / Xóa đề thi | ✅ |
| Xem danh sách đề thi | ✅ |
| Import đề thi nhanh (QuickImport) | ✅ |
| Bật/Tắt xuất bản đề thi | ✅ |
| Xem thống kê điểm số bài thi | ✅ |
| Xem danh sách bài làm học sinh | ✅ |
| Chấm điểm tự luận | ✅ |
| Quản lý danh sách học sinh | ✅ |
| Cấp / thu hồi quyền Flashcard cho học sinh | ✅ |
| Cấp / thu hồi quyền hàng loạt | ✅ |
| Giao đề theo lớp (TestAssignment) | ✅ Schema có, UI chưa rõ |

#### 👨‍🎓 Học sinh (STUDENT)
| Tính năng | Trạng thái |
|-----------|-----------|
| Xem danh sách bài thi | ✅ |
| Làm bài thi (trắc nghiệm + tự luận + ghi âm) | ✅ |
| Xem kết quả sau khi nộp | ✅ |
| Học flashcard (SRS / SM-2) | ✅ |
| Ôn tập từ vựng tiếng Hàn | ✅ |
| Tra cứu từ Korean (KoreanWordInspector) | ✅ |
| Lưu từ vựng 1-click vào Flashcard cá nhân | ✅ |
| Sync Flashcard từ Local lên Cloud | ✅ |

#### 🤖 AI
| Tính năng | Trạng thái |
|-----------|-----------|
| Chat với AI tutor | ✅ |
| Floating AI widget | ✅ |

---

## 🚀 Đề Xuất Tính Năng Mới

---

### 🛡️ ADMIN – Tính Năng Bổ Sung

#### 📁 Quản lý Lớp học (Class Management)
> Schema có model `Class` nhưng UI quản lý lớp chưa thấy

- **Tạo / Sửa / Xóa lớp học**
- **Gán học sinh vào lớp** (hiện chỉ có `classId` trên User)
- **Xem học sinh theo lớp**
- Độ ưu tiên: 🔴 **Cao** — Schema đã có sẵn, chỉ cần làm UI + API

#### 📋 Giao Bài Theo Lớp (TestAssignment UI)
> Schema `TestAssignment` (testId, classId, openAt, closeAt) đã có nhưng UI chưa hoàn chỉnh

- **Giao đề thi cho một hoặc nhiều lớp** có thời gian mở/đóng
- **Học sinh chỉ thấy bài thi được giao cho lớp mình**
- **Lịch giao bài dạng Calendar view**
- Độ ưu tiên: 🔴 **Cao**

#### 📊 Dashboard Tổng Quan Admin
- Tổng số học sinh / lớp / đề thi / bài đã nộp
- Top học sinh điểm cao
- Biểu đồ tiến độ theo lớp / theo tuần
- Số đề thi chờ chấm (có câu tự luận chưa graded)
- Độ ưu tiên: 🟡 **Trung bình**

#### 👤 Tạo Tài Khoản Học Sinh Hàng Loạt
- Import danh sách học sinh qua file CSV/Excel
- Auto-gen mật khẩu tạm thời
- Gán lớp ngay khi tạo
- Độ ưu tiên: 🟡 **Trung bình**

#### 🔒 Quản lý Mật Khẩu Học Sinh
- Reset mật khẩu học sinh (giáo viên)
- Xem học sinh nào chưa đăng nhập lần nào
- Độ ưu tiên: 🟡 **Trung bình**

#### 📁 Ngân Hàng Câu Hỏi (Question Bank)
- Lưu trữ câu hỏi độc lập, tái sử dụng
- Tag theo kỹ năng, chủ đề, độ khó
- Tạo đề thi ngẫu nhiên từ ngân hàng câu hỏi
- Độ ưu tiên: 🟠 **Thấp-Trung**

#### 📤 Export Kết Quả
- Export điểm số theo lớp ra file Excel/CSV
- Export đề thi ra PDF
- Độ ưu tiên: 🟠 **Thấp-Trung**

#### ⏰ Giám Sát Bài Thi Real-time
- Xem học sinh nào đang làm bài
- Cảnh báo khi học sinh nộp trước thời gian
- Kéo dài thời gian làm bài cho từng học sinh
- Độ ưu tiên: 🟠 **Thấp**

---

### 🎓 HỌC SINH – Tính Năng Bổ Sung

#### 📜 Lịch Sử Bài Thi (Test History)
- Xem lại tất cả các bài đã làm
- So sánh điểm qua các lần (trend chart)
- Xem lại chi tiết đáp án đúng/sai sau khi giáo viên công bố
- Độ ưu tiên: 🔴 **Cao**

#### 📈 Tiến Độ Học Flashcard
- Dashboard tiến độ SRS theo ngày/tuần
- Streak học liên tiếp (gamification)
- Số thẻ cần ôn hôm nay (Due cards)
- Biểu đồ phân bố NEW / LEARNING / REVIEW / MASTERED
- Độ ưu tiên: 🔴 **Cao** (SRS đã có, thiếu dashboard)

#### 🔔 Thông Báo
- Thông báo khi có đề thi mới được giao
- Thông báo khi bài tự luận được chấm xong
- Thông báo nhắc ôn Flashcard hàng ngày
- Độ ưu tiên: 🟡 **Trung bình**

#### ✏️ Đổi Mật Khẩu / Cập Nhật Hồ Sơ
- Hiện tại chưa có trang profile
- Cho phép đổi mật khẩu
- Cập nhật họ tên hiển thị
- Độ ưu tiên: 🟡 **Trung bình**

#### 🎯 Luyện Tập Từ Vựng Theo Chủ Đề
- Flashcard lọc theo chủ đề (bộ deck)
- Chế độ kiểm tra (Quiz mode) từ flashcard
- Chế độ viết (Type-in the answer)
- Độ ưu tiên: 🟡 **Trung bình**

#### 🔍 Tìm Kiếm Bài Thi
- Hiện tại `UserTestListPage` có bao nhiêu tính năng lọc?
- Thêm: lọc theo kỹ năng, trạng thái (đã làm / chưa làm)
- Độ ưu tiên: 🟠 **Thấp-Trung**

---

### ⚙️ HỆ THỐNG – Cải Thiện Kỹ Thuật

#### 🔒 Bảo Mật & Auth
| Vấn đề | Giải pháp |
|--------|-----------|
| `createTest`, `deleteTest`, `updateTest` không có `verifyAuth` | Thêm middleware xác thực bắt buộc |
| `getTestForTaking`, `submitTestAttempt` không verify auth | Nên yêu cầu đăng nhập để submit |
| Password reset chưa có | Thêm flow đặt lại mật khẩu |

> [!CAUTION]
> **Lỗ hổng bảo mật quan trọng**: Routes `POST /api/tests`, `PUT /api/tests/:id`, `DELETE /api/tests/:id`, `POST /api/tests/:id/submit` hiện **không có middleware `verifyAuth`** — bất kỳ ai cũng có thể gọi API này!

#### 🚀 Hiệu Năng
- Thêm **pagination** cho `getAllTests` (đã hỗ trợ query nhưng cần kiểm tra)
- Thêm **Redis cache** cho đề thi đã published
- **Rate limiting** cho endpoint submit bài thi

#### 📡 Real-time
- **WebSocket / SSE** cho chức năng giám sát thi real-time
- Thông báo real-time khi giáo viên chấm xong bài

#### 🧪 Chất Lượng Code
- Thêm **input validation** (zod/joi) ở tầng route
- Thêm **error handling middleware** tập trung
- Thêm **unit tests** cho controller

---

## 📋 Tóm Tắt Ưu Tiên

| # | Tính năng | Đối tượng | Độ ưu tiên | Lý do |
|---|-----------|-----------|-----------|-------|
| 1 | **Sửa lỗ hổng bảo mật auth routes** | Hệ thống | 🔴 Khẩn cấp | Rủi ro bảo mật nghiêm trọng |
| 2 | **UI Quản lý Lớp học** | Admin | 🔴 Cao | Schema đã có, thiếu UI |
| 3 | **UI Giao bài theo lớp** | Admin | 🔴 Cao | Schema đã có, thiếu UI |
| 4 | **Lịch sử bài thi học sinh** | Học sinh | 🔴 Cao | UX cơ bản |
| 5 | **Dashboard tiến độ Flashcard** | Học sinh | 🔴 Cao | SRS cần dashboard |
| 6 | **Dashboard tổng quan Admin** | Admin | 🟡 Trung bình | Quản lý hiệu quả |
| 7 | **Tạo tài khoản hàng loạt** | Admin | 🟡 Trung bình | Tiết kiệm thời gian |
| 8 | **Đổi mật khẩu / Profile** | Học sinh | 🟡 Trung bình | UX cơ bản |
| 9 | **Thông báo** | Cả hai | 🟡 Trung bình | Trải nghiệm người dùng |
| 10 | **Ngân hàng câu hỏi** | Admin | 🟠 Thấp | Tính năng nâng cao |
| 11 | **Export Excel/PDF** | Admin | 🟠 Thấp | Báo cáo |
| 12 | **Quiz mode Flashcard** | Học sinh | 🟠 Thấp | Gamification |
