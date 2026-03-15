# VM Deployment & Evaluation Guide

Welcome to the **Smart Event Management Platform**. This guide dictates the exact sequential steps required to unpackage, compile, configure, and launch the platform on evaluating Virtual Machines.

---

## 1. Prerequisites Checklist

Before beginning, ensure the VM has the following globally installed:
* **Node.js** (v20+ recommended) & **npm** (v10+ recommended)
* **PostgreSQL** (v16 recommended)
* **Git** 

*(If you are installing PostgreSQL for the first time on an Ubuntu/Debian VM, please see [docs/DB-config.md](./DB-config.md) for Linux installation commands).*

---

## 2. Setting Up the Database

First, we need to create the raw database instance using the default superuser. 

1. Open a terminal and log into the PostgreSQL prompt:
   ```bash
   sudo -u postgres psql
   ```
2. Create the database wrapper:
   ```sql
   CREATE DATABASE smart_events;
   \q
   ```

---

## 3. Configuring the Environment Files

The project expects environment variable files to be present, which are intentionally left out of source control.

**Backend Configuration**
1. Navigate to the backend directory: `/AWD_Project/backend/`
2. Create a new file named `.env` and paste the following content:

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

# Database
# If your VM uses a different postgres password or user, manually update the connection string below:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_events"

# Email Handling (Nodemailer requires a configured SMTP)
# WARNING: Emails will NOT send if SMTP_USER is left blank. To test email notifications, insert a valid testing Gmail and its 16-digit App Password below:
SMTP_USER=
SMTP_PASS=

# JWT and File Uploads
JWT_SECRET=evaluation_secret_key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

---

## 4. Bootstrapping the Backend

Now we will install packages, push the table schemas into PostgreSQL, and seed the database with grading data. 

Open a new terminal (Leave this terminal open for the **Backend**):
```bash
# 1. Enter directory
cd AWD_Project/backend

# 2. Install application dependencies
npm install

# 3. Translate schema and generate SQL tables inside 'smart_events'
npx prisma db push

# 4. Bind the new SQL tables to TypeScript definitions
npx prisma generate

# 5. Execute the Seeding Script (Generates events and test users)
npx prisma db seed

# 6. Launch Backend Server on port 3000
npm run start:dev
```
*If seeding is successful, you will see `✅ Database seeding complete!` in the terminal.*

---

## 5. Bootstrapping the Frontend

Open a **separate, second terminal** (Leave this terminal open for the **Frontend**):
```bash
# 1. Enter directory
cd AWD_Project/frontend

# 2. Install frontend frameworks and UI libraries
npm install

# 3. Launch Angular Development Server on port 4200
npm start
```

---

## 6. Accessing the Platform

If both terminals report successful compilation, the platform is now fully live!
* **Platform URL:** `http://localhost:4200`
* **Raw API Output:** `http://localhost:3000/api`

### Authorized Testing Credentials
You do not need to manually register users. The initial seeding script (`npx prisma db seed`) populated 8 accounts with pre-calculated scenarios across all role types so you can immediately begin evaluation. 

**Global Password for all test accounts:** `password123`

| Testing Persona | Login Email | Purpose |
|---|---|---|
| **System Admin** | `admin@smartevents.edu` | Has global management routing. Dashboard contains aggregate usage statistics, User Deactivation controls, and System activity logs. |
| **Organizer A** | `tech@smartevents.edu` | Simulating an event creator. Currently owns the "Hackathon" and "Cloud Computing" events. Allowed to Publish, Cancel, and manage documents. |
| **Organizer B** | `union@smartevents.edu` | Simulating an alternate organizer. Only has permission to edit their assigned "Career Fair 2026" event. |
| **Participant** | `student1@smartevents.edu` | Simulating an end-user. Allowed to discover events, register, cancel RSVPs, and download uploaded event documents. |
| **Participant** | `student2@smartevents.edu` | Simulating an end-user. Pre-registered into mock events. |
