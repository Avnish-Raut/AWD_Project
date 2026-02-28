# Database Configuration Guide
**Last Updated:** February 28, 2026

This guide covers how to configure PostgreSQL and run the project on **macOS**, **Windows**, and **Linux**.

---

## What You Need

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Run backend and frontend |
| npm | 10+ | Package manager |
| PostgreSQL | 16 | Database |
| Git | Any | Version control |

---

## macOS Setup

### 1. Install PostgreSQL
```bash
brew install postgresql@16
brew services start postgresql@16

# Add to PATH (also add this line to your ~/.zshrc to persist)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

### 2. Create the database
```bash
createdb smart_events
```

### 3. Configure `.env`
Create `backend/.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/smart_events"
JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```
> Replace `YOUR_MAC_USERNAME` with your actual macOS username (run `whoami` in terminal to find it). On Mac, PostgreSQL uses your OS user by default — no password needed.

---

## Windows Setup

### 1. Install PostgreSQL
- Download the installer from https://www.postgresql.org/download/windows/
- Recommended version: **PostgreSQL 16**
- During installation:
  - Set a password for the `postgres` superuser (remember this!)
  - Keep default port: `5432`
  - Keep default locale

### 2. Add PostgreSQL to PATH
After installation, add to your system PATH:
```
C:\Program Files\PostgreSQL\16\bin
```
Or open **pgAdmin 4** (installed alongside PostgreSQL) as an alternative to the terminal.

### 3. Create the database
Open **Command Prompt** or **PowerShell**:
```powershell
psql -U postgres
# Enter the password you set during installation
```
Then inside psql:
```sql
CREATE DATABASE smart_events;
\q
```
Or with a one-liner:
```powershell
psql -U postgres -c "CREATE DATABASE smart_events;"
```

### 4. Configure `.env`
Create `backend/.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/smart_events"
JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```
> Replace `YOUR_POSTGRES_PASSWORD` with the password you set during PostgreSQL installation.

---

## Linux (Ubuntu/Debian) Setup

### 1. Install PostgreSQL
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql   # auto-start on boot
```

### 2. Create the database and user
By default PostgreSQL on Linux uses a `postgres` system user. Two options:

**Option A — Use the postgres superuser (quick):**
```bash
sudo -u postgres psql -c "CREATE DATABASE smart_events;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

**Option B — Create a dedicated user (recommended):**
```bash
sudo -u postgres psql
```
Inside psql:
```sql
CREATE USER smart_user WITH PASSWORD 'smart_password';
CREATE DATABASE smart_events OWNER smart_user;
\q
```

### 3. Configure `.env`
Create `backend/.env`:

**If using Option A (postgres user):**
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_events"
JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

**If using Option B (dedicated user):**
```env
DATABASE_URL="postgresql://smart_user:smart_password@localhost:5432/smart_events"
```

---

## After DB Setup — All Platforms

Once PostgreSQL is running and your `.env` is configured, run these steps from the `backend/` folder:

```bash
cd backend

# Install dependencies
npm install

# Apply the schema to the database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start the backend
npm run start:dev
```

And in a separate terminal for the frontend:
```bash
cd frontend
npm install
npm start
```

The app will be accessible at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

---

## Verifying the Database

To confirm all tables were created correctly:

**macOS / Linux:**
```bash
psql -d smart_events -c '\dt'
```

**Windows (via psql):**
```powershell
psql -U postgres -d smart_events -c "\dt"
```

Expected output — 8 tables:
```
 Document
 Event
 Log
 Notification
 PasswordResetToken
 Registration
 Report
 User
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `psql: command not found` | PostgreSQL binaries not in PATH — re-read the PATH setup step for your OS |
| `connection refused` on port 5432 | PostgreSQL service isn't running — start it (`brew services start postgresql@16` / `sudo systemctl start postgresql` / start from Windows Services) |
| `password authentication failed` | Wrong password in `DATABASE_URL` — double-check `.env` |
| `database "smart_events" does not exist` | Run the `createdb` / `CREATE DATABASE` step again |
| `prisma db push` fails | Confirm `DATABASE_URL` in `.env` is correct and the DB is reachable |
| Windows: `\dt` not working in psql | Try `\\dt` in PowerShell (escaping the backslash) |

---

## Notes

- `.env` is in `.gitignore` — every teammate must create their own copy locally
- `npx prisma db push` is safe to re-run any time — it only applies unapplied changes
- If someone changes `prisma/schema.prisma`, all teammates must re-run `npx prisma db push` and `npx prisma generate`
- The PostgreSQL service must be running every time you work on the project
