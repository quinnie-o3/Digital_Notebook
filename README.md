# Digital Student Planner

Digital Student Planner là ứng dụng web full-stack giúp sinh viên quản lý thời khóa biểu, ghi chú bài học, bài tập và deadline theo từng buổi học.

Ứng dụng sử dụng React + TypeScript ở frontend, Spring Boot REST API ở backend và MongoDB để lưu trữ dữ liệu. Hệ thống hỗ trợ tài khoản người dùng, access token/refresh token, phân quyền dữ liệu theo chủ sở hữu và khôi phục dữ liệu planner sau khi tải lại trang hoặc đăng nhập lại.

- Repository: `https://github.com/quinnie-o3/Digital_Notebook`
- Live frontend: `https://digital-notebook-rho.vercel.app`
- Backend API documentation: `student-planner-BE/student-planner/API.md`
- Swagger UI khi chạy backend: `http://localhost:8080/swagger-ui/index.html`

> **Trạng thái import lịch nguyên khối:** Luồng `POST /api/planner-import` và cơ chế staging/cleanup đã được xây dựng trong working tree local nhưng chưa được commit vào nhánh chính tại thời điểm cập nhật tài liệu này.

---

## Mục Lục

- [Tính năng chính](#tính-năng-chính)
- [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Luồng xác thực và giao diện khách](#luồng-xác-thực-và-giao-diện-khách)
- [Access token và refresh token](#access-token-và-refresh-token)
- [Thông tin người dùng và đổi mật khẩu](#thông-tin-người-dùng-và-đổi-mật-khẩu)
- [Phân quyền ownership](#phân-quyền-ownership)
- [Luồng hoạt động chính](#luồng-hoạt-động-chính)
- [Thiết kế dữ liệu](#thiết-kế-dữ-liệu)
- [API chính](#api-chính)
- [Migration dữ liệu ownership](#migration-dữ-liệu-ownership)
- [Persistence](#persistence)
- [Automated tests](#automated-tests)
- [Cách chạy local](#cách-chạy-local)
- [Deploy](#deploy)
- [Trạng thái triển khai](#trạng-thái-triển-khai)
- [Điểm cần nắm khi phỏng vấn](#điểm-cần-nắm-khi-phỏng-vấn)

---

## Tính Năng Chính

### Authentication

- Đăng ký tài khoản bằng email và mật khẩu.
- Đăng nhập để nhận access token và refresh token.
- Tự động kiểm tra refresh token khi ứng dụng khởi động.
- Tự động refresh access token và retry request một lần khi backend trả `401 Unauthorized`.
- Đăng xuất và revoke refresh token.
- Chuyển người dùng về màn hình Sign in khi phiên hết hạn.

### Guest experience

- Người chưa đăng nhập vẫn xem được dashboard rỗng.
- Guest không tải dữ liệu planner từ backend.
- Khi guest thực hiện tác vụ planner, ứng dụng chuyển sang màn hình Sign up.
- Header hiển thị:
  - Avatar.
  - `Sign up` và `Sign in` khi chưa đăng nhập.
  - `Sign out` khi đã đăng nhập.
- Trang Sign up có liên kết `Have an account? Sign in`.
- Trang Sign in có liên kết `Don't have an account? Sign up`.

### Planner

- Quản lý thời khóa biểu theo tuần.
- Thêm môn học thủ công gồm:
  - Tên môn.
  - Mã môn.
  - Màu hiển thị.
  - Thứ học.
  - Giờ bắt đầu và kết thúc.
  - Phòng học.
  - Khoảng ngày áp dụng.
- Chọn một buổi học để mở notebook.
- Lưu ghi chú bài học.
- Quản lý bài tập, deadline, trạng thái và độ ưu tiên.
- Hiển thị cảnh báo deadline quá hạn, đến hạn hôm nay hoặc sắp đến hạn.
- Dữ liệu được lưu trong MongoDB và được tải lại sau khi refresh trang hoặc đăng nhập lại.

### Import thời khóa biểu

- Parse dữ liệu copy từ UIT Student.
- Parse file lịch `.ics`.
- Preview dữ liệu trước khi import.
- Hỗ trợ hai chế độ:
  - `append`: thêm vào lịch hiện tại.
  - `replace`: tạo lịch mới hoàn chỉnh trước khi dọn lịch cũ.
- Backend kiểm tra toàn bộ request trước khi ghi dữ liệu.
- Khi import lỗi, dữ liệu staging được xóa và lịch cũ được giữ nguyên.

### User information

- Xem thông tin tài khoản ở chế độ chỉ đọc:
  - Name.
  - Avatar URL.
  - Email.
  - Password đã được che.
- Chuyển sang màn hình Change password riêng.
- Validate mật khẩu ở cả frontend và backend.

---

## Kiến Trúc Tổng Quan

```text
Browser
  -> React + TypeScript UI
  -> authFetch() gắn Bearer access token
  -> Spring Boot REST API
  -> AuthContext xác định current user
  -> Ownership validation
  -> Spring Data MongoDB
  -> MongoDB Atlas hoặc MongoDB local
```

Frontend không truy cập MongoDB trực tiếp. Mọi thao tác đọc và ghi dữ liệu đều đi qua REST API.

Backend không tin `userId` do client gửi. Danh tính người dùng được lấy từ access token và lưu trong `AuthContext` trong suốt request.

### Nguyên tắc thiết kế

1. **Authentication trước khi tải dữ liệu**  
   Planner chỉ được tải khi ứng dụng đã xác nhận session hợp lệ.

2. **Backend-controlled ownership**  
   Backend tự gán `userId` cho tài nguyên mới và kiểm tra ownership với mọi thao tác đọc, sửa hoặc xóa.

3. **Persistence qua MongoDB**  
   Frontend state chỉ phục vụ hiển thị. MongoDB là nguồn dữ liệu chính.

4. **Safe schedule import**  
   Chế độ replace không xóa lịch cũ trước khi lịch mới được tạo thành công.

5. **Không expose dữ liệu nhạy cảm**  
   API không trả `passwordHash` và không cho client sửa trực tiếp role, status hoặc password hash.

---

## Công Nghệ Sử Dụng

### Frontend

- React 18
- TypeScript
- Vite
- CSS Modules
- Radix UI components
- lucide-react
- date-fns
- Fetch API

Frontend nằm trong thư mục `FE`.

Các file quan trọng:

- `FE/src/app/App.tsx`: component gốc, xử lý restore session, guest mode và điều hướng authentication.
- `FE/src/app/hooks/usePlannerState.ts`: quản lý state và các thao tác planner.
- `FE/src/app/lib/authApi.ts`: register, login, refresh, logout và request có authentication.
- `FE/src/app/lib/plannerApi.ts`: gọi planner API và mapping dữ liệu giữa frontend/backend.
- `FE/src/app/lib/uitSchedule.ts`: parser cho UIT Student text/HTML và `.ics`.
- `FE/src/app/components/planner/`: lịch tuần, header, deadline alerts và notebook.
- `FE/src/app/components/dialogs/`: thêm môn, import lịch và thông tin người dùng.

### Backend

- Java 21
- Spring Boot 4
- Spring Web
- Spring Data MongoDB
- Bean Validation
- Lombok
- Springdoc OpenAPI
- MongoDB
- Docker
- Maven

Backend nằm trong thư mục `student-planner-BE/student-planner`.

Các thành phần quan trọng:

- `StudentPlannerApplication.java`: entry point của backend.
- `AuthController.java`: register, login, refresh, logout, device session và current-user auth API.
- `AccessTokenFilter.java`: đọc và validate Bearer access token.
- `AuthContext`: lưu principal của người dùng hiện tại trong request.
- `TokenService.java`: tạo, validate, rotate và revoke token.
- Password service/encoder: băm và kiểm tra mật khẩu bằng PBKDF2.
- Ownership-aware controllers/services: scope dữ liệu theo current user.
- `MongoLongIdEventListener.java`: tạo ID kiểu `Long` cho MongoDB document.
- Ownership migration: backfill `user_id` cho dữ liệu cũ.
- `PlannerImportController.java`: endpoint import lịch nguyên khối.
- `ScheduleImportService.java`: validate, staging, cleanup và replace lịch an toàn.
- `CorsConfig.java`: cấu hình domain frontend được phép gọi backend.

---

## Cấu Trúc Dự Án

```text
Digital_Notebook/
├── FE/
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/
│   │       └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── student-planner-BE/
│   └── student-planner/
│       ├── src/main/java/com/uit/studentplanner/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── entity/
│       │   ├── repository/
│       │   └── service/
│       ├── src/main/resources/
│       │   └── application.properties
│       ├── src/test/
│       ├── API.md
│       ├── Dockerfile
│       └── pom.xml
│
├── render.yaml
├── .gitignore
└── README.md
```

---

## Luồng Xác Thực Và Giao Diện Khách

### Khi ứng dụng khởi động

```text
App starts
  -> đọc refresh token từ localStorage
  -> có refresh token?
       -> không: hiển thị guest dashboard
       -> có: gọi POST /api/auth/refresh
              -> thành công: lưu token mới, set current user
              -> thất bại: xóa token, xóa current user, chuyển Sign in
  -> chỉ tải planner khi current user hợp lệ
```

Quy tắc:

- Frontend kiểm tra refresh token trước khi tải planner.
- Session hợp lệ mới được phép gọi API planner.
- Session hết hạn hoặc refresh thất bại sẽ:
  - Xóa access token khỏi `sessionStorage`.
  - Xóa refresh token khỏi `localStorage`.
  - Xóa current user trong frontend state.
  - Chuyển sang Sign in.
- Không có refresh token thì frontend không tự tạo device session.

### Guest dashboard

Guest được xem UI tổng quan nhưng không được tải dữ liệu từ MongoDB.

Khi guest thực hiện các tác vụ như:

- Thêm môn học.
- Import lịch.
- Mở notebook.
- Tạo hoặc sửa task.
- Mở thông tin tài khoản cần xác thực.

ứng dụng sẽ chuyển sang Sign up.

### Device session

Backend vẫn giữ endpoint:

```text
POST /api/auth/device-session
```

Endpoint này không còn được frontend sử dụng và không phải luồng authentication chính của ứng dụng.

---

## Access Token Và Refresh Token

### Luồng hiện tại

```text
Login
  -> backend trả access token + refresh token
  -> access token lưu trong sessionStorage
  -> refresh token lưu trong localStorage
  -> request bảo vệ gắn Authorization: Bearer <accessToken>
  -> backend trả 401
       -> frontend gọi refresh
       -> thành công: lưu cặp token mới và retry request một lần
       -> thất bại: xóa session và yêu cầu đăng nhập lại
```

### Thời hạn mặc định

- Access token: 30 phút.
- Refresh token: 30 ngày.

### Bảo vệ refresh token

- Refresh token raw không được lưu trong database.
- Backend chỉ lưu SHA-256 hash của refresh token.
- Khi refresh thành công:
  - Token cũ được gán `revokedAt`.
  - Backend tạo cặp access token và refresh token mới.
- Khi logout:
  - Backend revoke refresh token.
  - Frontend xóa access token và refresh token đã lưu.

### Lưu trữ token ở frontend

| Token | Nơi lưu | Mục đích |
| --- | --- | --- |
| Access token | `sessionStorage` | Gửi kèm request trong tab/session hiện tại |
| Refresh token | `localStorage` | Khôi phục đăng nhập ở lần mở ứng dụng tiếp theo |

---

## Thông Tin Người Dùng Và Đổi Mật Khẩu

### User information

Màn hình User information là màn hình chỉ đọc, hiển thị:

- Name.
- Avatar URL.
- Email.
- Password đã che.

Nhấn `Edit` bên cạnh Password sẽ chuyển sang màn hình Change password riêng.

### Change password

Các trường nhập:

- Current password.
- New password.
- Confirm new password.

Validation:

- Current password phải đúng với password hash trong database.
- New password phải có ít nhất 8 ký tự.
- New password không được trùng Current password.
- Confirm new password phải trùng New password.
- Lỗi được hiển thị ngay dưới trường tương ứng.
- Nút Save chỉ bật khi frontend validation hợp lệ.
- Backend kiểm tra lại toàn bộ validation trước khi cập nhật.
- Password mới được băm bằng PBKDF2 trước khi lưu.

### User endpoints

```text
GET   /api/app-users/me
PATCH /api/app-users/me/password
GET   /api/user-profiles/me
```

Request đổi mật khẩu:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

Ví dụ lỗi Current password:

```json
{
  "field": "currentPassword",
  "message": "Current password is incorrect."
}
```

Ví dụ lỗi New password:

```json
{
  "field": "newPassword",
  "message": "New password must be different from current password."
}
```

### API đã được giới hạn

`AppUser` và `UserProfile` không còn được expose qua generic CRUD.

Mục đích:

- Không cho client tự sửa email, role hoặc status.
- Không cho client gửi trực tiếp `passwordHash`.
- Không trả `passwordHash` trong response.
- Không cho người dùng đọc profile bằng một `userId` tùy ý.

---

## Phân Quyền Ownership

Các tài nguyên sau có trường `user_id` trong MongoDB:

- `Timetable`
- `Subject`
- `ClassEntity`
- `ClassSession`
- `LessonNote`
- `Task`
- `ImportFile`
- `ImportItem`

### Nguyên tắc ownership

1. Backend lấy `userId` từ access token thông qua `AuthContext`.
2. Backend không tin `userId` trong URL hoặc request body.
3. Khi tạo tài nguyên, backend tự gán current user làm owner.
4. Nếu client gửi một owner khác, backend ghi đè bằng current user.
5. Endpoint danh sách chỉ trả dữ liệu của current user.
6. `GET`, `PUT`, `PATCH` và `DELETE` theo ID kiểm tra đồng thời `_id` và `user_id`.
7. Tài nguyên không thuộc current user trả `404 Not Found`.

Việc trả `404` thay vì `403` giúp không tiết lộ rằng tài nguyên của người dùng khác có tồn tại.

### Kiểm tra foreign key ownership

Backend kiểm tra cả ownership của tài nguyên cha:

```text
Timetable + Subject
  -> ClassEntity
  -> ClassSession
  -> LessonNote / Task

ImportFile
  -> ImportItem
```

Người dùng không thể tạo tài nguyên con bằng ID của tài nguyên cha thuộc người dùng khác.

### Endpoint đã loại bỏ

```text
GET /api/timetables/user/{userId}
GET /api/subjects/user/{userId}
GET /api/import-files/user/{userId}
GET /api/user-profiles/user/{userId}
```

### Endpoint frontend đang sử dụng

```text
GET /api/timetables
GET /api/subjects
GET /api/classes
GET /api/class-sessions
GET /api/lesson-notes
GET /api/tasks
```

Mỗi endpoint tự động scope dữ liệu theo access token.

---

## Luồng Hoạt Động Chính

### 1. Khởi động và tải planner

```text
App.tsx
  -> restore authentication session
  -> session hợp lệ?
       -> không: guest dashboard, không tải planner
       -> có: set current user
              -> usePlannerState tải dữ liệu planner
              -> backend scope dữ liệu theo access token
```

Planner không được tải trước khi frontend hoàn tất restore session.

### 2. Thêm môn học thủ công

```text
AddSubjectDialog
  -> validate input
  -> tạo hoặc lấy timetable hiện tại
  -> POST /api/subjects
  -> POST /api/classes
  -> POST /api/class-sessions
  -> reload/update planner state
```

Backend tách dữ liệu thành:

- `Subject`: thông tin môn học.
- `ClassEntity`: liên kết môn với timetable.
- `ClassSession`: thứ, giờ, phòng và khoảng ngày học.

Backend tự gán `user_id` cho từng tài nguyên và kiểm tra ownership của `timetableId`, `subjectId` và `classId`.

### 3. Import lịch UIT và `.ics`

Frontend xử lý input trong `uitSchedule.ts`:

- Nhận diện `.ics` qua `BEGIN:VCALENDAR` hoặc `BEGIN:VEVENT`.
- Parse HTML/text copy từ bảng thời khóa biểu UIT Student.
- Normalize header và chuỗi tiếng Việt.
- Map tiết học UIT sang giờ thực tế.
- Chuyển các dòng hợp lệ thành danh sách subject để preview.

Luồng import mới:

```text
Frontend parse + preview
  -> POST /api/planner-import
  -> backend validate toàn bộ payload
  -> chụp thông tin lịch hiện tại
  -> tạo timetable/subject/class/session mới ở staging
  -> xảy ra lỗi?
       -> có: xóa staging, giữ nguyên lịch cũ
       -> không: hoàn tất lịch mới, sau đó mới dọn lịch cũ nếu mode=replace
```

Request mẫu:

```json
{
  "mode": "replace",
  "subjects": [
    {
      "name": "Mobile App Development",
      "courseCode": "SE346",
      "color": "#2563eb",
      "day": 1,
      "startTime": "07:30",
      "endTime": "09:30",
      "room": "A1.101",
      "startDate": "2026-01-15",
      "endDate": "2026-05-31"
    }
  ]
}
```

Mode:

- `append`: tạo thêm dữ liệu trong lịch hiện tại.
- `replace`: tạo lịch mới đầy đủ trước, sau đó mới xóa dữ liệu lịch cũ.

Các file của thay đổi local chưa commit:

```text
FE/src/app/lib/plannerApi.ts
student-planner-BE/student-planner/src/main/java/.../PlannerImportController.java
student-planner-BE/student-planner/src/main/java/.../ScheduleImportService.java
student-planner-BE/student-planner/src/test/java/.../ScheduleImportServiceTests.java
```

### 4. Mở notebook

```text
WeeklySchedule
  -> người dùng chọn một ClassSession
  -> tải LessonNote thuộc session và current user
  -> tải Task thuộc session và current user
  -> hiển thị NotebookSheet
```

Khi lưu:

```text
NotebookSheet
  -> tạo hoặc cập nhật LessonNote
  -> tạo/cập nhật/xóa Task
  -> MongoDB lưu dữ liệu
  -> UI cập nhật state hiện tại
```

### 5. Deadline alerts

Frontend lọc task có:

- Deadline hợp lệ.
- Trạng thái chưa hoàn thành.
- Deadline đã quá hạn hoặc nằm trong khoảng cảnh báo.

Các task được sắp xếp theo deadline gần nhất.

---

## Thiết Kế Dữ Liệu

| Entity | Ý nghĩa | Ownership |
| --- | --- | --- |
| `AppUser` | Tài khoản đăng nhập | Chính tài khoản đó |
| `RefreshToken` | Hash refresh token và trạng thái revoke | Theo user |
| `UserProfile` | Thông tin hiển thị của sinh viên | Theo user |
| `Timetable` | Một thời khóa biểu | `user_id` |
| `Subject` | Thông tin môn học | `user_id` |
| `ClassEntity` | Liên kết Subject với Timetable | `user_id` |
| `ClassSession` | Một buổi học cụ thể | `user_id` |
| `LessonNote` | Ghi chú của buổi học | `user_id` |
| `Task` | Bài tập và deadline | `user_id` |
| `ImportFile` | Một lần import | `user_id` |
| `ImportItem` | Dữ liệu chi tiết của lần import | `user_id` |
| `DatabaseSequence` | Sequence tạo Long ID | Internal |

### Quan hệ chính

```text
AppUser
  -> UserProfile
  -> Timetable
  -> Subject

Timetable + Subject
  -> ClassEntity
  -> ClassSession
  -> LessonNote
  -> Task

AppUser
  -> ImportFile
  -> ImportItem
```

### Long ID trong MongoDB

MongoDB mặc định sử dụng ObjectId. Dự án dùng ID kiểu `Long` như:

- `userId`
- `timetableId`
- `subjectId`
- `classId`
- `sessionId`
- `noteId`
- `taskId`

`MongoLongIdEventListener` cấp ID mới trước khi document được lưu.

---

## API Chính

Tài liệu chi tiết:

```text
student-planner-BE/student-planner/API.md
```

Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

### Health

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/health` | Kiểm tra backend |

### Authentication

| Method | Endpoint | Authentication | Mô tả |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản |
| `POST` | `/api/auth/login` | Public | Đăng nhập |
| `POST` | `/api/auth/refresh` | Public | Rotate refresh token |
| `POST` | `/api/auth/logout` | Public | Revoke refresh token |
| `GET` | `/api/auth/me` | Bearer token | Lấy authenticated user |
| `POST` | `/api/auth/device-session` | Public | Legacy/optional; frontend không sử dụng |

### Current user

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/app-users/me` | Lấy thông tin tài khoản hiện tại, không trả password hash |
| `PATCH` | `/api/app-users/me/password` | Đổi mật khẩu |
| `GET` | `/api/user-profiles/me` | Lấy profile hiện tại |

### Planner resources

Các endpoint danh sách tự động trả dữ liệu của current user:

| Resource | Base endpoint |
| --- | --- |
| Timetable | `/api/timetables` |
| Subject | `/api/subjects` |
| Class | `/api/classes` |
| Class session | `/api/class-sessions` |
| Lesson note | `/api/lesson-notes` |
| Task | `/api/tasks` |
| Import file | `/api/import-files` |
| Import item | `/api/import-items` |

Các endpoint theo ID kiểm tra cả ID và owner.

### Planner import

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/planner-import` | Import toàn bộ lịch theo mode append hoặc replace |

> Endpoint này thuộc thay đổi local chưa commit tại thời điểm cập nhật README.

### Ví dụ gọi API có authentication

```bash
curl http://localhost:8080/api/subjects \
  -H "Authorization: Bearer <accessToken>"
```

Không gửi `userId` để chọn owner. Backend lấy owner từ access token.

---

## Migration Dữ Liệu Ownership

Dữ liệu cũ có thể chưa chứa `user_id` ở tất cả collection. Backend có migration chạy khi khởi động để backfill ownership theo chuỗi quan hệ.

### Planner migration

```text
Timetable.user_id / Subject.user_id
  -> ClassEntity.user_id
  -> ClassSession.user_id
  -> LessonNote.user_id / Task.user_id
```

### Import migration

```text
ImportFile.user_id
  -> ImportItem.user_id
```

### Cấu hình

```properties
app.ownership-migration.enabled=true
```

Có thể tắt bằng Spring property hoặc environment variable tương ứng.

Migration được tắt trong môi trường test để test độc lập và tránh thay đổi dữ liệu fixture.

### MongoDB indexes

Đã thêm index cho `user_id` trên các collection planner và import để tăng hiệu quả các query dạng:

```text
findByIdAndUserId(...)
findAllByUserId(...)
```

---

## Persistence

MongoDB là nguồn dữ liệu chính của planner.

Các dữ liệu được lưu:

- Timetable.
- Subject.
- ClassEntity.
- ClassSession.
- LessonNote.
- Task.
- Import records.

Sau khi reload hoặc đăng nhập lại:

```text
restore session
  -> xác định current user
  -> gọi các scoped planner endpoints
  -> dựng lại frontend state từ MongoDB
```

Frontend không phụ thuộc vào local state để giữ dữ liệu lâu dài.

Trong import replace:

- Lịch cũ không bị xóa nếu quá trình tạo lịch mới thất bại.
- Dữ liệu staging được cleanup khi có exception.

---

## Automated Tests

### Ownership tests

Các test kiểm tra:

- Endpoint danh sách chỉ query dữ liệu của current user.
- Client không thể giả mạo `userId`.
- Người dùng không thể đọc tài nguyên của user khác.
- Người dùng không thể sửa hoặc xóa tài nguyên của user khác.
- Người dùng không thể sử dụng foreign key thuộc user khác.

### Import reliability test

Test mô phỏng database phát sinh lỗi giữa quá trình `replace` và xác nhận:

- Dữ liệu staging đã tạo được cleanup.
- Timetable cũ không bị xóa.
- Subject cũ không bị xóa.

### Kết quả hiện tại

```text
Backend tests:             6 tests, 0 failures
Frontend production build: successful
Backend compile:           successful
```

Lệnh kiểm tra:

```bash
cd FE
npm run build
```

```bash
cd student-planner-BE/student-planner
./mvnw test
./mvnw package
```

Trên Windows:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
```

---

## Cách Chạy Local

### Yêu cầu môi trường

- Node.js
- npm
- Java 21
- MongoDB local hoặc MongoDB Atlas

### 1. Chạy backend

```bash
cd student-planner-BE/student-planner
```

Cấu hình environment variables:

```text
MONGODB_URI=mongodb://localhost:27017/student-planner
MONGODB_DATABASE=student-planner
AUTH_TOKEN_SECRET=change-this-secret-in-real-deploy
FRONTEND_ORIGINS=http://localhost:5173
```

Bật/tắt ownership migration:

```text
APP_OWNERSHIP_MIGRATION_ENABLED=true
```

Tên environment variable thực tế có thể phụ thuộc vào cách Spring Boot map property trong môi trường deploy. Property gốc:

```properties
app.ownership-migration.enabled=true
```

PowerShell:

```powershell
$env:MONGODB_URI="mongodb://localhost:27017/student-planner"
$env:MONGODB_DATABASE="student-planner"
$env:AUTH_TOKEN_SECRET="change-this-secret-in-real-deploy"
$env:FRONTEND_ORIGINS="http://localhost:5173"
$env:APP_OWNERSHIP_MIGRATION_ENABLED="true"
```

Chạy backend:

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend mặc định:

```text
http://localhost:8080
```

Health check:

```text
http://localhost:8080/api/health
```

Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

### 2. Chạy frontend

```bash
cd FE
npm install
```

Tạo file `.env`:

```text
VITE_API_BASE_URL=http://localhost:8080
```

Chạy development server:

```bash
npm run dev
```

Frontend mặc định:

```text
http://localhost:5173
```

### 3. Build production

```bash
cd FE
npm run build
```

```bash
cd student-planner-BE/student-planner
./mvnw test
./mvnw package
```

---

## Deploy

### Backend trên Render

File `render.yaml` dùng để cấu hình backend service.

Thiết lập chính:

- Runtime: Docker.
- Root directory: `student-planner-BE/student-planner`.
- Health check: `/api/health`.
- Java 21 build và runtime image.

Environment variables cần thiết:

```text
MONGODB_URI
MONGODB_DATABASE
AUTH_TOKEN_SECRET
FRONTEND_ORIGINS
APP_OWNERSHIP_MIGRATION_ENABLED
```

### Frontend

Frontend có thể deploy trên Vercel, Netlify hoặc static hosting khác.

Biến môi trường:

```text
VITE_API_BASE_URL=<deployed-backend-url>
```

Backend phải cho phép domain frontend trong `FRONTEND_ORIGINS`.

---

## Trạng Thái Triển Khai

| Hạng mục | Trạng thái |
| --- | --- |
| Sign up / Sign in | Đã triển khai |
| Guest dashboard | Đã triển khai |
| Restore session bằng refresh token | Đã triển khai |
| Access token refresh và retry một lần | Đã triển khai |
| Logout và revoke refresh token | Đã triển khai |
| User information read-only | Đã triển khai |
| Change password | Đã triển khai |
| Ownership cho planner/import resources | Đã triển khai |
| Ownership migration | Đã triển khai |
| Planner persistence trên MongoDB | Đã triển khai |
| Thêm môn học thủ công | Đã triển khai |
| Notebook, task và deadline | Đã triển khai |
| Parser UIT Student / `.ics` | Đã xây dựng; cần tiếp tục kiểm thử dữ liệu thực tế |
| Atomic planner import API | Đã xây dựng local, chưa commit |
| Ownership/import automated tests | 6 tests, 0 failures |
| Frontend production build | Thành công |
| Backend compile/package | Thành công |

### `.gitignore`

Repository đã thêm:

```gitignore
*.pdf
```

Các file proposal PDF không được Git theo dõi.

---

## Điểm Cần Nắm Khi Phỏng Vấn

### 1. Giới thiệu dự án trong 30 giây

```text
Digital Student Planner là ứng dụng full-stack giúp sinh viên quản lý thời khóa biểu,
ghi chú bài học, bài tập và deadline theo từng buổi học. Frontend được xây bằng
React và TypeScript, backend dùng Spring Boot REST API và MongoDB. Em xây luồng
đăng ký, đăng nhập bằng access token và refresh token, phân quyền dữ liệu theo
người dùng, persistence sau khi reload và parser để import lịch UIT Student hoặc
file .ics.
```

### 2. Vì sao guest vẫn thấy dashboard?

Guest dashboard giúp người dùng xem trước giao diện và giá trị của ứng dụng mà chưa cần đăng ký. Tuy nhiên frontend không tải dữ liệu planner và mọi thao tác thay đổi dữ liệu đều yêu cầu authentication.

### 3. Vì sao bỏ auto device session?

Auto device session khiến ứng dụng âm thầm tạo một user tạm khi người dùng chưa đăng nhập, làm luồng authentication khó hiểu và có thể tạo dữ liệu không mong muốn. Frontend hiện yêu cầu Sign up hoặc Sign in rõ ràng. Backend chỉ giữ endpoint để tương thích hoặc phục vụ mục đích riêng.

### 4. Vì sao dùng access token và refresh token?

Access token sống ngắn để giảm rủi ro khi bị lộ. Refresh token giúp người dùng duy trì đăng nhập nhưng được rotate sau mỗi lần sử dụng. Backend chỉ lưu SHA-256 hash của refresh token, do đó token raw không xuất hiện trong database.

### 5. Ownership được bảo vệ như thế nào?

Backend lấy user hiện tại từ access token, không dùng `userId` do client cung cấp. Mọi query theo ID đều kèm `user_id`. Khi tạo tài nguyên con, backend cũng kiểm tra tài nguyên cha thuộc current user. Vì vậy người dùng không thể đoán ID để đọc hoặc gắn dữ liệu vào tài khoản khác.

### 6. Vì sao tài nguyên của user khác trả 404?

Trả `404 Not Found` tránh tiết lộ tài nguyên đó có tồn tại. Đây là cách giảm information disclosure so với việc trả `403 Forbidden` cho một ID hợp lệ của người dùng khác.

### 7. Vì sao không dùng generic CRUD cho AppUser?

Generic CRUD có thể cho client gửi `passwordHash`, sửa role/status hoặc đọc dữ liệu nhạy cảm. API current-user `/me` giới hạn đúng những thao tác người dùng được phép thực hiện.

### 8. Import replace trước đây có vấn đề gì?

Luồng cũ xóa lịch trước rồi tạo lịch mới qua nhiều request. Nếu một request lỗi giữa chừng, người dùng có thể mất lịch cũ và chỉ còn dữ liệu dang dở.

Luồng mới gửi toàn bộ lịch trong một request, validate trước, tạo dữ liệu mới ở staging và chỉ dọn lịch cũ sau khi lịch mới hoàn chỉnh.

### 9. Persistence được đảm bảo như thế nào?

MongoDB là source of truth. Sau khi session được khôi phục, frontend gọi các API đã scope theo user và dựng lại state. Vì vậy refresh trang không làm mất môn học, ghi chú hoặc task.

### 10. Khó khăn kỹ thuật đáng nói nhất

```text
Hai phần khó nhất là ownership và import lịch an toàn. Với ownership, em phải bảo
đảm không chỉ tài nguyên chính mà cả foreign key đều thuộc người dùng hiện tại.
Với import, em thay đổi từ nhiều request dễ mất dữ liệu sang một service import
nguyên khối có staging và cleanup khi lỗi.
```

### 11. Điểm có thể tiếp tục cải thiện

- Commit và tích hợp hoàn chỉnh atomic planner import.
- Bổ sung test parser với nhiều file `.ics` và dữ liệu UIT Student thực tế.
- Bổ sung integration test đầy đủ cho register/login/refresh/logout/change password.
- Chuẩn hóa error response toàn backend.
- Thêm rate limiting cho login và change password.
- Cân nhắc HttpOnly cookie cho refresh token trong phiên bản production yêu cầu bảo mật cao hơn.
- Bổ sung CI để tự động chạy frontend build và backend tests khi push code.

---

## Ghi Chú

Chi tiết request/response của từng endpoint nên được duy trì trong:

```text
student-planner-BE/student-planner/API.md