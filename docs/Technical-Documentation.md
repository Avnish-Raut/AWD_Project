# Group 15 
Akash Silas Nesakumar - 1751388 
Nguyen Son Thien - 1751364 
Avnish Jayprakash Raut - 1751366 

# Smart Event Management System - Technical Documentation

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Installation Guide](#3-installation-guide)
4. [User Guide](../docs/User-Guide.md)
5. [API Documentation](#5-api-documentation)
6. [Testing](#6-testing)

---

## 1. Introduction
The **Smart Event Management System** is a comprehensive platform designed to streamline the process of discovering, organizing, and managing events. It connects attendees looking for engaging activities with organizers who host them, providing necessary tools for both parties. The platform enhances user experience by allowing seamless registration, centralized event management, user oversight by administrators, robust analytic reporting, and integrated system logging.

---

## 2. System Overview
The application is built on a modern, robust tech stack split into a robust backend API and an interactive frontend interface.

### Architecture
- **Frontend Framework**: Angular
- **Backend Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)

### Access Control (Roles)
- **USER**: General attendees who can browse events, register, and view their user dashboard.
- **ORG (Organizer)**: Event creators who can publish, cancel, or edit their events, access attendee reports, and view reporting metrics.
- **ADMIN**: System administrators who oversee the entire platform. They have privileges to access all events, manage users (deactivate/reactivate), view global system logs, and observe platform-wide statistics.

---

## 3. Installation Guide
Installation is done inside vm. Run start.sh in Home Directory to run the system

Alternative if setup is not done.Follow these steps to set up the Application locally:

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Angular CLI

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Configuration: Create a `.env` file based on `.env.example` (if provided) and ensure your `DATABASE_URL` connects to your local PostgreSQL instance:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/event_management?schema=public"
   JWT_SECRET="your_secure_jwt_secret"
   ```
4. Database initialization (Prisma):
   ```bash
   npx prisma migrate dev
   npm run seed  # Optional: Seed the database with initial users and data
   ```
5. Start the backend server:
   ```bash
   npm run start:dev
   ```
   > The API will be available at `http://localhost:3000/api`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   npm start
   ```
   > The frontend will be available at `http://localhost:4200`

---

## 4. [User Guide](../docs/User-Guide.md)

### For Attendees (USER)
- **Registration/Login**: Sign up directly via the user portal.
- **Dashboard**: View personal details and a list of upcoming registered events.
- **Events View**: Browse available events on the platform and register with a single click.

### For Organizers (ORG)
- **Event Creation**: Navigate to the Organizer's panel to publish new events with distinct details (titles, dates, limits).
- **Registration Management**: View detailed reports and track event sign-ups.

### For Administrators (ADMIN)
- **Admin Dashboard**: Gain high-level visibility over the platform's statistics.
- **User Management**: Search, edit roles, deactivate, or reactivate user accounts.
- **System Logs**: View comprehensive audit trails of platform actions indicating `INFO`, `WARN`, and `ERROR` events.
- **Global Event View**: Administer and cancel any listed events gracefully.

---

## 5. API Documentation
The API operates fundamentally over HTTP using standard REST paradigms. All non-public endpoints require the `Authorization: Bearer <token>` header.

### Key Endpoints

#### Authentication (`/auth`)
- `POST /api/auth/register` - Register a new user (Self-register available only to USER and ORG roles).
- `POST /api/auth/login` - Authenticate with email/password and obtain a JWT token.
- `POST /api/auth/forgot-password` - Request password reset.
- `POST /api/auth/reset-password` - Reset password.
- `GET /api/auth/profile` - Get authenticated user profile.

#### Users (`/users`)
- `GET /api/users/me` - Get current user profile.
- `PATCH /api/users/me` - Update current user profile.
- `POST /api/users/me/avatar` - Upload user avatar.
- `DELETE /api/users/me/avatar` - Delete user avatar.
- `DELETE /api/users/me` - Delete current user account.
- `GET /api/users` *(ADMIN only)* - Retrieve all users with pagination and search.
- `GET /api/users/:id` *(ADMIN only)* - Get user by ID.
- `PATCH /api/users/:id/role` *(ADMIN only)* - Update user role mappings.
- `DELETE /api/users/:id` *(ADMIN only)* - Soft-delete a user.
- `POST /api/users/:id/reactivate` *(ADMIN only)* - Reactivate a user account.

#### Events (`/events`)
- `GET /api/events` - Public access to browse published events.
- `POST /api/events` *(ORG only)* - Publish a new event.
- `GET /api/events/admin/list` *(ADMIN only)* - Retrieve all events (including cancelled/unpublished).
- `GET /api/events/my/events` - Retrieve events created by the current user.
- `GET /api/events/my/user-events` - Retrieve events the current user registered for.
- `GET /api/events/:id` - Retrieve specific event details.
- `POST /api/events/:id/upload` - Upload an image to an event.
- `PATCH /api/events/:id` - Update an event.
- `PATCH /api/events/:id/publish` - Publish a drafted event.
- `GET /api/events/:id/participants` - Retrieve event participants.
- `POST /api/events/:id/register` - Register for an event.
- `DELETE /api/events/:id/cancel-registration` - Cancel registration for an event.
- `DELETE /api/events/:id` - Cancel an event.

#### Files
- `POST /api/events/:eventId/files` - Upload files to an event.
- `GET /api/events/:eventId/files/:fileId` - Retrieve a specific file for an event.

#### Reports
- `GET /api/reports` - Get list of reports.
- `GET /api/reports/:id` - Get specific report details.
- `POST /api/:id/report/generate` - Generate a report for an event.
- `GET /api/reports/:id/progress` - Server-Sent Events (SSE) for Real-Time Progress.

#### System Logs (`/logs`)
- `GET /api/logs` *(ADMIN only)* - Retrieve paginated platform audit logs with optional severity level filters.

#### Statistics (`/statistics`)
- `GET /api/statistics/admin` *(ADMIN only)* - High-level aggregate data representing active events, total users, etc.

> *(Refer to the internal `api-description.md` file for an exhaustive list of DTOs and properties).*

---

## 6. Testing
The application employs strict testing processes utilizing **Jest** for backend and **Karma/Jasmine** for the frontend.

### Backend Testing
The backend uses a standard NestJS testing scheme encompassing robust Unit Tests and End-to-End coverage ensuring secure RBAC handling:
- **Run Unit Tests**:
  ```bash
  cd backend
  npm run test
  ```
- **Coverage Report**:
  ```bash
  npm run test:cov
  ```


### Frontend Testing
The Angular frontend extensively employs individual specs (`.spec.ts`) validating component creation, API service logic caching, and DOM-bindings.
- **Run Frontend Tests**:
  ```bash
  cd frontend
  npm run test
  # Or run tests without watch mode
  npx ng test --watch=false --browsers=ChromeHeadless
  ```

### Test Credentials & Environment

For manual testing and verification of the frontend Role-Based Access Control (RBAC), the following accounts are seeded by default. These accounts provide a consistent baseline for testing the User, Organizer, and Admin dashboards.

| Role | Username | Email | Password | Key Permissions to Test |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `SystemAdmin` | `admin@smartevents.edu` | `Password$123` | User management, global logs, and platform statistics. |
| **ORG** | `TechDepartment` | `tech@smartevents.edu` | `Password$123` | Event creation, editing, and participant reporting. |
| **USER** | `Student_1` | `student1@smartevents.edu` | `Password$123` | Event browsing, registration, and profile deletion. |

> **Note:** All seeded passwords utilize `bcrypt` hashing (10 rounds). To reset the testing environment to this baseline at any time, run the following command in the backend directory:

```bash
npm run seed
```

### Test Coverage Reporting
Coverage report present as index.html in /home/osboxes/MainProject/AWD_Project/frontend/coverage/Chrome Headless 146.0.0.0 (Linux 0.0.0)/index.html

![Test Coverage Summary](./test-coverage.png)

*Figure 1: Frontend Test Coverage Snapshot*

### External Component

Maltrap.io for smtp mails

![Mailtrap.io](./mailtrap.jpeg)

*Figure 2: Mailtrap update from application*
