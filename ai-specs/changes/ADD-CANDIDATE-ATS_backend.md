# Backend Implementation Plan: ADD-CANDIDATE-ATS Add Candidate to ATS (Recruiter)

> **Ticket ID note:** Replace `ADD-CANDIDATE-ATS` with your actual Jira key (e.g. `SCRUM-XX`) in branch names and this document title if your team uses a different identifier.

## Overview

This plan covers the **backend** for “Add candidate to the ATS” from the recruiter dashboard: persist a new **Candidate** with optional **Education** (0–3), **WorkExperience** (0+), and optional **Resume** metadata after a separate file upload. Work aligns with `ai-specs/specs/data-model.md`, `ai-specs/specs/api-spec.yml` (`POST /candidates`, `POST /upload`), and DDD layered architecture (`backend-standards.mdc`).

**Architecture principles**

- **DDD / clean architecture:** Domain entities and invariants; application services orchestrate validation and persistence; controllers stay thin; infrastructure via Prisma and file storage.
- **API contract:** Request/response shapes and status codes match OpenAPI; errors use `ErrorResponse` (`message` required; `error` optional detail).
- **TDD:** Add failing tests first for validators, services, controllers, and upload handling where applicable.

**Current codebase reality:** The repository backend is minimal (`backend/src/index.ts`, Prisma only has `User`). This plan includes **Prisma schema and migrations** for Candidate-related models before feature endpoints.

## Architecture Context

### Layers

| Layer | Responsibility |
|--------|----------------|
| **Presentation** | Express routes, controllers for `POST /candidates` and `POST /upload`; parse JSON vs `multipart/form-data`; map errors to HTTP status and `ErrorResponse`. |
| **Application** | `candidateService` (create flow), upload orchestration; `validator.ts` rules per data-model and api-spec; no direct Prisma in controllers. |
| **Domain** | `Candidate`, `Education`, `WorkExperience`, `Resume` models; factory/load methods; `save()` or repository pattern per project choice—consistent with `backend-standards.mdc`. |
| **Infrastructure** | `prismaClient`, file storage for uploads (local dir or configurable path), logger. |

### Components / files to introduce or extend

Introduce (paths follow `backend-standards.mdc`):

- `backend/prisma/schema.prisma` — models: `Candidate`, `Education`, `WorkExperience`, `Resume` (relations, unique `Candidate.email`, cascades as appropriate).
- `backend/prisma/migrations/*` — generated migration.
- `backend/src/domain/models/Candidate.ts`, `Education.ts`, `WorkExperience.ts`, `Resume.ts` (or grouped if the project prefers fewer files—match one style).
- `backend/src/domain/repositories/ICandidateRepository.ts` (optional if using pure `save()` on entities only—pick one pattern and document it).
- `backend/src/application/services/candidateService.ts` — e.g. `createCandidate(...)`.
- `backend/src/application/validator.ts` — e.g. `validateCreateCandidateRequest`, helpers for nested arrays and dates.
- `backend/src/presentation/controllers/candidateController.ts` — e.g. `createCandidate`.
- `backend/src/presentation/controllers/uploadController.ts` — e.g. `uploadFile`.
- `backend/src/routes/candidateRoutes.ts`, `uploadRoutes.ts` (or single `routes/index.ts` registering both).
- `backend/src/middleware/uploadMiddleware.ts` — e.g. Multer config, size limit 10MB, MIME/extension filter PDF & DOCX.
- `backend/src/middleware/errorHandler.ts` — map domain/validation/Prisma errors to `ErrorResponse` and correct status codes.
- `backend/src/infrastructure/logger.ts` — if not present; structured logs, no PII in client-facing messages.
- `backend/src/index.ts` — mount routes, JSON parser, static upload dir only if explicitly required (avoid exposing raw uploads publicly without auth).
- Tests: `**/__tests__/*.test.ts` next to or under `backend/src` per Jest config.

## Implementation Steps

### Step 0: Create Feature Branch

- **Action:** Create and switch to a dedicated backend feature branch before any code changes.
- **Branch naming:** `feature/ADD-CANDIDATE-ATS-backend` (substitute real Jira key).
- **Implementation steps:**
  1. Ensure you are on the correct base branch (`main` or `develop` per team practice).
  2. `git pull origin <base-branch>`
  3. `git checkout -b feature/ADD-CANDIDATE-ATS-backend`
  4. `git branch` to verify.
- **Notes:** Required suffix `-backend` per `backend-standards.mdc` Development Workflow; do not use a shared generic branch for unrelated work.

---

### Step 1: Extend Prisma schema and run migration

- **File:** `backend/prisma/schema.prisma`
- **Action:** Add models matching `data-model.md`: `Candidate` (unique email), `Education` (max 3 enforced in app layer), `WorkExperience`, `Resume` (linked to `Candidate`). Field max lengths should match documentation (e.g. names 2–100, email max 255, phone/address limits).
- **Implementation steps:**
  1. Define relations and indexes (`@@unique` on `email` for `Candidate`).
  2. Run `npx prisma migrate dev --name add_candidate_aggregate` (or equivalent) and `npx prisma generate`.
  3. Verify migration SQL in repo.
- **Dependencies:** PostgreSQL `DATABASE_URL`.
- **Notes:** If the team uses seed data, extend seed only if needed for integration tests; not required for create flow.

---

### Step 2: Domain models (Candidate aggregate)

- **Files:** `backend/src/domain/models/Candidate.ts`, `Education.ts`, `WorkExperience.ts`, `Resume.ts`
- **Action:** TypeScript classes with constructors; enforce or delegate invariants; persistence via `save()` and/or repository per existing project patterns in `backend-standards.mdc`.
- **Function signatures (illustrative):**
  ```typescript
  export class Candidate {
    constructor(data: CandidateProps) { /* ... */ }
    static async findOneByEmail(email: string): Promise<Candidate | null>;
    async save(): Promise<Candidate>;
  }
  ```
- **Implementation steps:**
  1. Map Prisma types to domain types (no `any`; use explicit interfaces).
  2. Creating a candidate should persist nested educations, work experiences, and optional resume in one transaction where possible (Prisma `$transaction`).
  3. Handle `PrismaClientKnownRequestError` code `P2002` (unique email) and translate to a domain/application error for HTTP 400 with a clear `message` (English).
- **Notes:** Keep domain free of Express types; English-only error messages for internal/domain errors.

---

### Step 3: Validation module (create candidate + nested data)

- **File:** `backend/src/application/validator.ts`
- **Action:** Validate `CreateCandidateRequest`-shaped payloads before persistence.

- **Function signatures (illustrative):**
  ```typescript
  export function validateCreateCandidateRequest(body: unknown): CreateCandidateRequestDTO;
  ```

- **Implementation steps:**
  1. **Candidate core:** `firstName`, `lastName`, `email` required; names 2–100, letters-only rule per `data-model.md`; email format; normalize email (trim, lowercase) before duplicate check if product requires it—document choice.
  2. **Optional:** `phone` — if present, Spanish format `(6|7|9)XXXXXXXX` per `data-model.md`; `address` max length.
  3. **Educations:** array length ≤ 3; each record: `institution`, `title`, `startDate` required; `endDate` optional; if both dates present, `endDate >= startDate`.
  4. **Work experiences:** each record: `company`, `position`, `startDate` required; `description`, `endDate` optional; same date rule when both ends present.
  5. **CV (`cv`):** optional; if present, `filePath` and `fileType` required strings; max lengths per `data-model.md`; trust that upload step already validated MIME/size, but reject obviously invalid empty strings.
  6. Throw typed validation errors (custom class or structured object) consumable by error middleware to build `ErrorResponse` with `400`.

- **Dependencies:** Pure functions; optionally `zod` or similar only if already in `package.json`—prefer consistency with the rest of the backend.

---

### Step 4: Application service — create candidate

- **File:** `backend/src/application/services/candidateService.ts`
- **Action:** Orchestrate validation, duplicate email check, and transactional create.

- **Function signature (illustrative):**
  ```typescript
  export async function createCandidateService(
    rawBody: unknown
  ): Promise<CreateCandidateResponseDTO>;
  ```

- **Implementation steps:**
  1. Call `validateCreateCandidateRequest(rawBody)`.
  2. Check existing candidate by email; if exists, throw/fail with duplicate-email case mapped to **400** (per `api-spec.yml` for `POST /candidates` — validation or duplicate).
  3. Create `Candidate` with nested rows in one transaction; attach `Resume` when `cv` is provided.
  4. Return DTO matching `CreateCandidateResponse` (at least `id`, `firstName`, `lastName`, `email`, optional `phone`, `address` as in spec).
- **Notes:** No PII in `console.log`; use logger with redaction if needed.

---

### Step 5: File upload — validation and storage

- **Files:** `backend/src/middleware/uploadMiddleware.ts`, `backend/src/application/services/uploadService.ts` (optional), `backend/src/presentation/controllers/uploadController.ts`
- **Action:** Implement `POST /upload` per `api-spec.yml`: `multipart/form-data` field `file`; PDF or DOCX; max 10MB.

- **Function signatures (illustrative):**
  ```typescript
  // uploadController
  export async function uploadResume(req: Request, res: Response, next: NextFunction): Promise<void>;
  ```

- **Implementation steps:**
  1. Add **Multer** (or equivalent) with disk storage under a directory from env e.g. `UPLOAD_DIR`; generate safe unique filenames (UUID + original extension).
  2. Restrict MIME types: `application/pdf`, and DOCX as `application/vnd.openxmlformats-officedocument.wordprocessingml.document`; optionally validate magic bytes for defense in depth.
  3. Enforce **10MB** limit; reject with **400** and `ErrorResponse`.
  4. Success response **200** with body `{ filePath, fileType }` matching `FileUploadResponse` (paths may be relative storage keys—document contract for the frontend).
  5. Do not log full file paths with candidate PII in production logs if combined with other data—keep logs technical and minimal.

- **Dependencies:** `multer`, `@types/multer` if needed.

---

### Step 6: Presentation — controllers and routes

- **Files:** `backend/src/presentation/controllers/candidateController.ts`, `backend/src/routes/candidateRoutes.ts`, `backend/src/routes/uploadRoutes.ts`, `backend/src/index.ts`
- **Action:** Wire HTTP API.

- **Function signatures (illustrative):**
  ```typescript
  export async function createCandidate(req: Request, res: Response, next: NextFunction): Promise<void>;
  ```

- **Implementation steps:**
  1. `POST /candidates` — `express.json()`; call `createCandidateService(req.body)`; respond **201** + `CreateCandidateResponse`.
  2. `POST /upload` — use upload middleware; call controller; respond **200** + `FileUploadResponse`.
  3. Register routes on `app` before error handler.
  4. Replace the generic “Something broke!” handler with structured JSON errors (Step 7).

---

### Step 7: Error handling middleware (ErrorResponse)

- **File:** `backend/src/middleware/errorHandler.ts`
- **Action:** Centralize mapping from validation, domain, Multer, and Prisma errors to HTTP status and JSON body.

- **Implementation steps:**
  1. **400:** validation failures; duplicate email; invalid upload (type/size).
  2. **500:** unexpected errors; log stack server-side only; client gets generic `message` (English).
  3. Response shape aligned with `components/schemas/ErrorResponse` in `api-spec.yml` (`message` required).

---

### Step 8: Unit and integration tests (TDD order)

- **Files:** e.g. `backend/src/application/__tests__/validator.test.ts`, `candidateService.test.ts`, `candidateController.test.ts`, `uploadController.test.ts`, optional `backend/src/tests/integration/candidates.post.test.ts`
- **Action:** Meet coverage targets (90% per `backend-standards.mdc`).

- **Categories:**
  - **Successful cases:** create candidate minimal; with educations/work experiences; with `cv` after upload flow simulated.
  - **Validation errors:** missing required fields; bad email; phone format; >3 educations; invalid date order; oversized file; wrong MIME.
  - **Duplicate email:** returns **400** with appropriate `message`.
  - **Server errors:** mocked Prisma failure → **500** and logged.
  - **Edge cases:** empty arrays; optional fields omitted; boundary string lengths.

- **Implementation notes:** Mock Prisma in unit tests; use test DB or supertest integration tests if the project already does—follow existing `backend/src/tests/app.test.ts` patterns.

---

### Step 9: Update technical documentation (mandatory)

- **Action:** After implementation, update specs only if behavior is fixed or differs from docs.

- **Implementation steps:**
  1. **data-model.md** — update only if DB or validation rules diverge from documented limits.
  2. **api-spec.yml** — update only if response codes, schemas, or paths differ (e.g. if team chooses **409** for duplicate email, align spec and implementation together—today spec says **400** for duplicate).
  3. **backend-standards.mdc** — only if new global patterns (e.g. upload env vars) must be documented.
  4. Follow `documentation-standards.mdc`; English only.

---

## Implementation Order

1. Step 0: Create feature branch  
2. Step 1: Prisma schema + migration  
3. Step 2: Domain models  
4. Step 3: Validator (`create candidate`)  
5. Step 4: `candidateService.create`  
6. Step 5: Upload middleware + upload controller/service  
7. Step 6: Candidate controller + routes + `index.ts` wiring  
8. Step 7: Error handler  
9. Step 8: Tests (ideally written in parallel with each layer per TDD)  
10. Step 9: Documentation updates  

## Testing Checklist

- [ ] `POST /candidates` returns **201** with body matching `CreateCandidateResponse` for valid payloads.
- [ ] Duplicate email returns **400** with `ErrorResponse` shape.
- [ ] Validation failures return **400** with clear `message` (English).
- [ ] `POST /upload` accepts PDF/DOCX ≤ 10MB; rejects others with **400**.
- [ ] Create with `cv` referencing prior upload persists `Resume` correctly.
- [ ] `npm test` and `npm run test:coverage` meet project thresholds.
- [ ] Linter and TypeScript compile clean.

## Error Response Format

Per `api-spec.yml` `ErrorResponse`:

```json
{
  "message": "Human-readable summary in English",
  "error": "Optional technical detail or field-level context"
}
```

| Condition | HTTP status | Notes |
|-----------|-------------|--------|
| Validation (including nested arrays, dates, formats) | 400 | Use consistent `message`; optional `error` for details. |
| Duplicate email | 400 | Matches current spec for `POST /candidates`. |
| Invalid file type / size | 400 | Upload endpoint. |
| Not found | 404 | N/A for create/upload unless checking related resources. |
| Unexpected server/database | 500 | Generic user-safe `message`; log details server-side. |

## Partial Update Support

**Not applicable** for this ticket: scope is **create** via `POST /candidates` and **upload** via `POST /upload`. Candidate **update** would be a separate story.

## Dependencies

- **Runtime:** Node.js, Express, TypeScript (strict).
- **ORM:** Prisma, PostgreSQL.
- **Upload:** Multer (or team-approved alternative).
- **Testing:** Jest, Supertest (if used for HTTP integration).
- **Env:** `DATABASE_URL`, `UPLOAD_DIR` (or equivalent), `PORT` if configurable.

## Notes

- **Language:** All code, errors, logs for developers, and API messages must be **English** (`base-standards.mdc`, `CLAUDE.md`).
- **Security:** When auth exists, restrict `POST /candidates` and `POST /upload` to authenticated recruiters; until then, document risk and follow `backend-standards.mdc` security section. Store uploads outside public HTTP root or protect with auth.
- **Frontend contract:** Recruiter flow uploads first (optional), then sends `filePath` + `fileType` in `cv` — backend must accept exactly what upload returns.
- **Autocomplete:** Out of scope for backend unless new GET endpoints are added later; no change required for MVP.

## Next Steps After Implementation

- Wire frontend to `POST /upload` then `POST /candidates`.
- Add E2E tests in the full stack CI pipeline.
- When authentication lands, add integration tests for recruiter-only access and CSRF/session policy per backend standards.

## Implementation Verification

- [ ] **Code quality:** Typed, no `any`, ESLint clean, DDD layers respected.
- [ ] **Functionality:** Matches `api-spec.yml` and `data-model.md`.
- [ ] **Testing:** Unit + integration coverage for critical paths; duplicate email and validation covered.
- [ ] **Integration:** Frontend can create candidate with and without CV using documented responses.
- [ ] **Documentation:** `data-model.md` / `api-spec.yml` updated if behavior differs from current docs; changelog or README note if required by team.
