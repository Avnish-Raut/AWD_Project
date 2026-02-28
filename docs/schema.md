# Database Schema
**ORM:** Prisma  
**Database:** PostgreSQL  
**Last Updated:** February 28, 2026

---

## Prisma Schema File (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum Role {
  ADMIN
  ORG
  USER
}

enum RegistrationStatus {
  CONFIRMED
  CANCELLED
}

enum ReportStatus {
  PENDING
  IN_PROGRESS
  DONE
  FAILED
}

enum LogLevel {
  INFO
  WARN
  ERROR
}

// ─────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────

model User {
  user_id       Int       @id @default(autoincrement())
  username      String    @db.VarChar(50)
  email         String    @unique @db.VarChar(100)
  password_hash String    @db.VarChar(255)
  role          Role      @default(USER)
  created_at    DateTime  @default(now())
  deleted_at    DateTime? // soft delete — R23

  events              Event[]              @relation("OrganizerEvents")
  registrations       Registration[]
  reports             Report[]
  documents           Document[]           @relation("UploaderDocuments")
  password_reset_tokens PasswordResetToken[]
  notifications       Notification[]
  logs                Log[]
}

model Event {
  event_id     Int      @id @default(autoincrement())
  organizer_id Int
  title        String   @db.VarChar(100)
  description  String?
  event_date   DateTime
  location     String   @db.VarChar(100)
  capacity     Int
  is_published Boolean  @default(false) // draft until organizer publishes — R11/R13
  is_cancelled Boolean  @default(false)
  created_at   DateTime @default(now())

  organizer     User           @relation("OrganizerEvents", fields: [organizer_id], references: [user_id])
  registrations Registration[]
  documents     Document[]
  reports       Report[]
}

model Registration {
  reg_id        Int                @id @default(autoincrement())
  user_id       Int
  event_id      Int
  registered_at DateTime           @default(now())
  status        RegistrationStatus @default(CONFIRMED)

  user  User  @relation(fields: [user_id], references: [user_id])
  event Event @relation(fields: [event_id], references: [event_id])

  @@unique([user_id, event_id]) // prevents double-registration — R15
}

model Document {
  doc_id       Int      @id @default(autoincrement())
  event_id     Int
  uploaded_by  Int      // organizer who uploaded — R16
  file_name    String   @db.VarChar(255)
  file_path    String   @db.VarChar(500)
  file_size_kb Int
  uploaded_at  DateTime @default(now())

  event    Event @relation(fields: [event_id], references: [event_id])
  uploader User  @relation("UploaderDocuments", fields: [uploaded_by], references: [user_id])
}

model Report {
  report_id        Int          @id @default(autoincrement())
  organizer_id     Int
  event_id         Int          // which event the report is for — R18
  status           ReportStatus @default(PENDING)
  progress_percent Int          @default(0) // 0–100 — R19
  result_data      Json?
  created_at       DateTime     @default(now())

  organizer User  @relation(fields: [organizer_id], references: [user_id])
  event     Event @relation(fields: [event_id], references: [event_id])
}

model PasswordResetToken {
  id         Int      @id @default(autoincrement())
  user_id    Int
  token      String   @unique
  expires_at DateTime
  used       Boolean  @default(false)
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [user_id])
}

model Notification {
  notif_id   Int      @id @default(autoincrement())
  user_id    Int
  message    String
  is_read    Boolean  @default(false)
  sent_at    DateTime @default(now())

  user User @relation(fields: [user_id], references: [user_id])
}

model Log {
  log_id     Int      @id @default(autoincrement())
  level      LogLevel
  message    String
  user_id    Int?     // nullable — some logs are system-level
  created_at DateTime @default(now())

  user User? @relation(fields: [user_id], references: [user_id])
}
```

---

## Requirements Traceability

| Model / Field | Covers |
|---|---|
| `User.role` (ADMIN / ORG / USER) | R10 — Role-based access control |
| `User.password_hash` | R22 — Data encryption (bcrypt) |
| `User.deleted_at` | R23 — Account deletion (soft delete) |
| `User` | R8 — Registration, R9 — Auth, R29 — Profile view, R34 — Profile update |
| `Event` | R11 — Event creation, R13 — Event listing, R21 — Event deletion |
| `Event.is_published` | R11/R13 — Draft vs published state |
| `Event.capacity` + `Registration` count | R15 — Capacity enforcement |
| `Registration` | R14 — Event registration, R24 — Participant list |
| `Registration.status = CANCELLED` | R12 — Registration cancellation |
| `@@unique([user_id, event_id])` | R15 — Prevents duplicate registrations |
| `Document` | R16 — File upload, R17 — File download |
| `Document.uploaded_by` / `uploaded_at` | R16 — Tracks who uploaded and when |
| `Report` | R18 — Long-running computation |
| `Report.progress_percent` | R19 — Progress status feedback |
| `Report.event_id` | R18 — Report is scoped to a specific event |
| `PasswordResetToken` | R28 — Password recovery |
| `Notification` | R31 — Email notifications, R39 — Reminders |
| `Log` | R27 — Backend logging |

---

## ENV — Required Variable

Update `backend/.env` to use a single Prisma connection URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_events"
```

---

## Setup Commands

```bash
# 1. Install Prisma
cd backend
npm install prisma @prisma/client
npm uninstall typeorm @nestjs/typeorm   # swap from TypeORM

# 2. Initialize Prisma
npx prisma init

# 3. Paste schema into backend/prisma/schema.prisma

# 4. Run first migration
npx prisma migrate dev --name init

# 5. Generate Prisma client
npx prisma generate
```

---

## Notes

- `synchronize: true` (TypeORM) is **replaced** by `prisma migrate dev` — never use auto-sync in production
- Soft delete on `User.deleted_at` means existing registrations and reports are preserved after account removal (R23)
- `ReportStatus.IN_PROGRESS` was added (on top of the original schema) so the frontend progress bar has a clear intermediate state alongside `progress_percent`
- `Log.user_id` is nullable to support system-level logs that are not tied to a specific user
