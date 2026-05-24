# Digital Student Planner API

REST API for the Digital Student Planner backend.

## Base URLs

- Set `BASE_URL` to your deployed backend URL, for example `https://student-planner-be.onrender.com`

## Interactive Docs

This project uses Springdoc OpenAPI.

- Swagger UI: `/swagger-ui/index.html`
- OpenAPI JSON: `/v3/api-docs`

Example:

```text
<BASE_URL>/swagger-ui/index.html
```

## Common Rules

- Content type: `application/json`
- Authentication: `/api/health`, `/api/auth/device-session`, `/api/auth/refresh`, and `/api/auth/logout` are public. Other `/api/**` endpoints require `Authorization: Bearer <accessToken>`.
- Web clients should store the access token in session storage so it ends with the browser session, and store the refresh token in local storage for the next visit.
- ID values are generated automatically on `POST`. Do not send the ID field when creating a record.
- `PUT /{id}` uses the path ID and overwrites the entity ID in the request body.
- `DELETE /{id}` returns an empty `200 OK` response.
- Missing records return `404 Not Found`.
- Date format:
  - `LocalDate`: `YYYY-MM-DD`
  - `LocalDateTime`: `YYYY-MM-DDTHH:mm:ss`

MongoDB `@Field(...)` names are internal database field names. API requests and responses use Java/Jackson camelCase names such as `userId`, `createdAt`, and `passwordHash`.

## Health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check service health. |

Response:

```json
{
  "status": "ok"
}
```

## Authentication

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/device-session` | Create or resume the device user and issue access/refresh tokens. |
| `POST` | `/api/auth/refresh` | Rotate a refresh token and issue a new access/refresh token pair. |
| `POST` | `/api/auth/logout` | Revoke a refresh token. |
| `GET` | `/api/auth/me` | Return the authenticated user for a valid access token. |

Create a device session:

```bash
curl -X POST <BASE_URL>/api/auth/device-session \
  -H "Content-Type: application/json" \
  -d '{ "deviceId": "browser-device-id" }'
```

Response:

```json
{
  "accessToken": "<jwt-access-token>",
  "refreshToken": "<opaque-refresh-token>",
  "accessTokenExpiresAt": 1779658200,
  "refreshTokenExpiresAt": "2026-06-23T09:00:00",
  "user": {
    "userId": 1,
    "email": "device_browser-device-id@student-planner.local",
    "username": "device_browser-device-id",
    "role": "STUDENT",
    "status": "ACTIVE"
  }
}
```

Refresh a session:

```bash
curl -X POST <BASE_URL>/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<opaque-refresh-token>" }'
```

## Shared CRUD Endpoints

Most resources support the same CRUD operations.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/{resource}` | List all records. |
| `GET` | `/api/{resource}/{id}` | Get one record by ID. |
| `POST` | `/api/{resource}` | Create a record. |
| `PUT` | `/api/{resource}/{id}` | Replace a record. |
| `DELETE` | `/api/{resource}/{id}` | Delete a record. |

Supported resources:

| Resource | Base Path | ID Field |
| --- | --- | --- |
| App users | `/api/app-users` | `userId` |
| User profiles | `/api/user-profiles` | `profileId` |
| Timetables | `/api/timetables` | `timetableId` |
| Subjects | `/api/subjects` | `subjectId` |
| Classes | `/api/classes` | `classId` |
| Class sessions | `/api/class-sessions` | `sessionId` |
| Lesson notes | `/api/lesson-notes` | `noteId` |
| Tasks | `/api/tasks` | `taskId` |
| Import files | `/api/import-files` | `importId` |
| Import items | `/api/import-items` | `itemId` |

## Resource Filters

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/app-users/username/{username}` | Get one app user by username. |
| `GET` | `/api/user-profiles/user/{userId}` | Get the profile for a user. |
| `GET` | `/api/timetables/user/{userId}` | List timetables for a user. |
| `GET` | `/api/subjects/user/{userId}` | List subjects for a user. |
| `GET` | `/api/classes/timetable/{timetableId}` | List classes in a timetable. |
| `GET` | `/api/classes/subject/{subjectId}` | List classes for a subject. |
| `GET` | `/api/class-sessions/class/{classId}` | List sessions for a class. |
| `GET` | `/api/lesson-notes/session/{sessionId}` | List lesson notes for a class session. |
| `GET` | `/api/tasks/session/{sessionId}` | List tasks for a class session. |
| `GET` | `/api/tasks/note/{noteId}` | List tasks for a lesson note. |
| `GET` | `/api/import-files/user/{userId}` | List import files for a user. |
| `GET` | `/api/import-items/import/{importId}` | List import items for an import file. |

## Schemas

### AppUser

```json
{
  "userId": 1,
  "email": "student@example.com",
  "username": "student01",
  "passwordHash": "hashed-password",
  "role": "STUDENT",
  "status": "ACTIVE",
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### UserProfile

```json
{
  "profileId": 1,
  "userId": 1,
  "fullName": "Nguyen Van A",
  "studentCode": "22520001",
  "schoolName": "UIT",
  "faculty": "Software Engineering",
  "major": "Software Engineering",
  "className": "SE001",
  "avatarUrl": "https://example.com/avatar.png",
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### Timetable

```json
{
  "timetableId": 1,
  "userId": 1,
  "name": "Main timetable",
  "semesterName": "Spring 2026",
  "startDate": "2026-01-15",
  "endDate": "2026-05-31",
  "active": 1,
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### Subject

```json
{
  "subjectId": 1,
  "userId": 1,
  "subjectName": "Mobile App Development",
  "subjectCode": "SE346",
  "colorCode": "#2563eb",
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### ClassEntity

```json
{
  "classId": 1,
  "timetableId": 1,
  "subjectId": 1,
  "teacherName": "Tran Thi B",
  "defaultRoom": "A1.101",
  "createdType": "MANUAL",
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### ClassSession

```json
{
  "sessionId": 1,
  "classId": 1,
  "dayOfWeek": 2,
  "startTime": "07:30",
  "endTime": "09:30",
  "room": "A1.101",
  "startDate": "2026-01-15",
  "endDate": "2026-05-31",
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### LessonNote

```json
{
  "noteId": 1,
  "sessionId": 1,
  "noteDate": "2026-05-24",
  "lessonSummary": "Reviewed Android activity lifecycle.",
  "reviewNotes": "Revisit lifecycle callbacks before the exam.",
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### Task

```json
{
  "taskId": 1,
  "noteId": 1,
  "sessionId": 1,
  "title": "Finish lab report",
  "description": "Submit the mobile app lab report.",
  "deadline": "2026-05-30T23:59:00",
  "status": "TODO",
  "priority": "HIGH",
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### ImportFile

```json
{
  "importId": 1,
  "userId": 1,
  "fileName": "schedule.pdf",
  "fileType": "PDF",
  "fileUrl": "https://example.com/schedule.pdf",
  "status": "UPLOADED",
  "errorMessage": null,
  "createdAt": "2026-05-24T09:00:00",
  "updatedAt": "2026-05-24T09:00:00"
}
```

### ImportItem

```json
{
  "itemId": 1,
  "importId": 1,
  "rawText": "SE346 Monday 07:30-09:30 A1.101",
  "subjectName": "Mobile App Development",
  "dayOfWeek": 2,
  "startTime": "07:30",
  "endTime": "09:30",
  "room": "A1.101",
  "confidenceScore": 0.95,
  "status": "PENDING",
  "createdAt": "2026-05-24T09:00:00"
}
```

## Request Examples

Create a user:

```bash
curl -X POST <BASE_URL>/api/app-users \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "username": "student01",
    "passwordHash": "hashed-password",
    "role": "STUDENT",
    "status": "ACTIVE"
  }'
```

Create a timetable:

```bash
curl -X POST <BASE_URL>/api/timetables \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Main timetable",
    "semesterName": "Spring 2026",
    "startDate": "2026-01-15",
    "endDate": "2026-05-31",
    "active": 1
  }'
```

List subjects by user:

```bash
curl <BASE_URL>/api/subjects/user/1 \
  -H "Authorization: Bearer <accessToken>"
```

Update a task:

```bash
curl -X PUT <BASE_URL>/api/tasks/1 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": 1,
    "sessionId": 1,
    "title": "Finish lab report",
    "description": "Submit the mobile app lab report.",
    "deadline": "2026-05-30T23:59:00",
    "status": "DONE",
    "priority": "HIGH"
  }'
```
