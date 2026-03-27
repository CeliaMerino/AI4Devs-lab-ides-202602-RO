# Development Guide

This guide describes how to set up the development environment and run tests for the LTI ATS system in this repository.

## Setup instructions

### Prerequisites

- **Node.js** (v16 or higher recommended)
- **npm** (v8 or higher)
- **Docker** and **Docker Compose** (for the default PostgreSQL container)
- **Git**

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <project-directory>
```

### 2. Environment configuration

Create environment files for the backend and frontend.

**Backend** (`backend/.env`):

```env
NODE_ENV=development

# Default API port (Express). Must match the URL used by the frontend.
PORT=3010

# Prisma: single connection string for PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"

# Optional: directory for uploaded resumes (PDF/DOCX). Defaults to ./uploads under the backend working directory.
# UPLOAD_DIR=/absolute/path/to/uploads
```

Use credentials and database name that match your PostgreSQL instance. If you use the provided `docker-compose.yml`, align `USER`, `PASSWORD`, and `DATABASE_NAME` with the `POSTGRES_*` values defined there.

**Frontend** (`frontend/.env`):

```env
# Base URL of the backend API (no trailing slash). Defaults to http://localhost:3010 in code if unset.
REACT_APP_API_URL=http://localhost:3010
```

### 3. Database (PostgreSQL with Docker)

From the project root:

```bash
docker compose up -d
docker compose ps
```

The `db` service in `docker-compose.yml` maps PostgreSQL to **localhost:5432**. Adjust `DATABASE_URL` in `backend/.env` accordingly.

### 4. Backend

```bash
cd backend
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

The API listens on **`http://localhost:3010`** by default (override with `PORT`).

**Notes:**

- **CORS:** The backend enables permissive CORS for local development so the React dev server can call the API. Restrict `Access-Control-Allow-Origin` to known front-end origins in production.
- **Uploads:** Resume uploads use `POST /upload` (multipart field `file`); files are stored under `UPLOAD_DIR` or `./uploads`.

### 5. Frontend

```bash
cd frontend
npm install
npm start
```

Create React App serves the UI at **`http://localhost:3000`** by default (or the next free port if 3000 is busy). Ensure `REACT_APP_API_URL` points at the running backend.

### 6. End-to-end / Cypress (optional)

Cypress is not configured in the current `frontend/package.json`. If you add Cypress scripts later, run them from the `frontend` directory. Until then, rely on unit tests and manual checks.

## Testing

### Backend

```bash
cd backend
npm test
npm run test:coverage
npm run lint
```

### Frontend

```bash
cd frontend
npm test
```

Use `CI=true npm test` or `--watchAll=false` in CI for non-interactive runs.

## API and documentation

- **OpenAPI:** `ai-specs/specs/api-spec.yml`
- **Data model:** `ai-specs/specs/data-model.md`
