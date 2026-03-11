# Phase 1: Project Initialization
**Date:** February 28, 2026  
**Status:** Completed

---

## Overview

Two projects were initialized under the workspace root `/AWD_Project/`:

```
AWD_Project/
├── frontend/        ← Angular 19 app
├── backend/         ← NestJS (Node.js) app
├── docs/
└── planning/
```

---

## 1. Frontend — Angular

### Command Used
```bash
npx @angular/cli@latest new frontend \
  --routing \
  --style=scss \
  --skip-git \
  --package-manager=npm
```

**Options explained:**
- `--routing` — enables Angular Router out of the box (required by R5)
- `--style=scss` — uses SCSS for styling
- `--skip-git` — skips creating a new git repo (we use the root repo)
- SSR/SSG — answered **No** (not needed for this project)

### Post-setup Steps

**1. Generated environment files:**
```bash
cd frontend
npx ng generate environments
```
Creates:
- `src/environments/environment.ts` (production)
- `src/environments/environment.development.ts` (development)

Both files were updated with:
```ts
export const environment = {
  production: false,   // true in environment.ts
  apiUrl: 'http://localhost:3000/api',
};
```

**2. Wired `HttpClient` into `app.config.ts`:**
```ts
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),  // ← added
  ]
};
```

### How to Run
```bash
cd frontend
npm start
# → http://localhost:4200
```

---

## 2. Backend — NestJS (Node.js)

### Command Used
```bash
npx @nestjs/cli@latest new backend \
  --package-manager npm \
  --skip-git
```

### Core Dependencies Installed
```bash
npm install \
  @nestjs/typeorm typeorm pg \        # PostgreSQL ORM
  @nestjs/jwt @nestjs/passport \      # JWT auth
  passport passport-jwt \
  @nestjs/config \                    # .env config
  bcrypt \                            # Password hashing
  class-validator class-transformer \ # Input validation
  @nestjs/serve-static \             # Static file serving
  multer                             # File uploads

npm install -D \
  @types/passport-jwt \
  @types/bcrypt \
  @types/multer
```

### Modules Scaffolded
```bash
npx nest g module auth
npx nest g module users
npx nest g module events
npx nest g module registrations
npx nest g module files
npx nest g module reports
npx nest g module logs
npx nest g module statistics
npx nest g module notifications
```

Maps to requirements: R8–R9 (auth), R10/R25 (users), R11–R15/R21 (events), R12/R14/R24 (registrations), R16–R17 (files), R18–R19 (reports), R27 (logs), R32 (statistics), R31/R39 (notifications).

### `app.module.ts` — Updated
`ConfigModule` and `TypeOrmModule` were wired in globally:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'smart_events'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule, UsersModule, EventsModule, RegistrationsModule,
    FilesModule, ReportsModule, LogsModule, StatisticsModule, NotificationsModule,
  ],
  ...
})
```

### `main.ts` — Updated
Added CORS, global validation pipe, and `/api` prefix:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',  // Angular dev server
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
```

### `.env` File Created
Located at `backend/.env` (added to `.gitignore`):

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgresql://postgres:Password@localhost:5432/smart_events
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=smart_events
SMTP_USER=avnishjayprakashraut@gmail.com
SMTP_PASS=ask_avnish
FRONTEND_URL=http://localhost:4200

# JWT
JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

> **Important:** Change `JWT_SECRET` to a strong random string before deployment.

### How to Run
```bash
cd backend
npm run start:dev
# → http://localhost:3000/api
```

---

## 3. Build Verification

Both projects were verified to compile cleanly:

| Project | Command | Result |
|---|---|---|
| Backend | `npm run build` | ✅ No errors |
| Frontend | `npx ng build --configuration development` | ✅ No errors, bundle ~1.38 MB |

---

## 4. Final Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.ts
│   │   ├── app.config.ts       ← HttpClient + Router wired here
│   │   ├── app.routes.ts
│   │   └── app.html
│   ├── environments/
│   │   ├── environment.ts           ← production (apiUrl set)
│   │   └── environment.development.ts ← development (apiUrl set)
│   ├── main.ts
│   └── styles.scss
└── angular.json

backend/
├── src/
│   ├── auth/
│   ├── users/
│   ├── events/
│   ├── registrations/
│   ├── files/
│   ├── reports/
│   ├── logs/
│   ├── statistics/
│   ├── notifications/
│   ├── app.module.ts    ← ConfigModule + TypeOrmModule configured
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts          ← CORS + ValidationPipe + /api prefix
├── .env                 ← DB/JWT/upload config (gitignored)
└── nest-cli.json
```

---

## Next Step → Phase 2: Authentication & RBAC
- Set up PostgreSQL database (`smart_events`)
- Implement User entity with roles (organizer / participant / admin)
- Registration endpoint (R8)
- Login / Logout with JWT (R9)
- Role-based guards (R10)
- Password hashing with bcrypt (R22)
