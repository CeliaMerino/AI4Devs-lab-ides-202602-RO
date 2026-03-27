# Frontend Implementation Plan: ADD-CANDIDATE-ATS Add candidate to ATS (recruiter)

## 1. Header

**Title:** `# Frontend Implementation Plan: ADD-CANDIDATE-ATS Add candidate to ATS (recruiter)`

## 2. Overview

Deliver a recruiter-facing flow to add a new candidate from a dashboard entry point: primary CTA → dedicated route → multi-section form (core fields, up to three education rows, repeatable work experience, optional CV upload) → `POST /upload` (when a file is selected) then `POST /candidates` with JSON matching `CreateCandidateRequest` (`cv` uses `filePath` and `fileType` from the upload response per `ai-specs/specs/api-spec.yml`).

**Architecture principles:** Component-based UI with a dedicated **service layer** (`frontend/src/services/`) for all HTTP calls; **controlled forms** with shared validation (ideally extracted to pure functions or a small module for TDD); **local state** with React hooks (`useState` / `useReducer` for complex form); **React Router** for `/` (dashboard) and `/recruiter/candidates/new` (or the path agreed with existing routing); **React Bootstrap** for layout and accessible form controls; **TypeScript** for new code. All user-visible strings and code identifiers in **English** (`base-standards.mdc` / `CLAUDE.md`).

**Current codebase note:** `frontend/` is currently a minimal Create React App shell (`App.tsx` placeholder). This plan assumes adding dependencies and structure per `ai-specs/specs/frontend-standards.mdc` (axios, React Router, React Bootstrap, Bootstrap CSS). Align test tooling with what you add (Jest + RTL already present; add Cypress only if you adopt it per standards).

## 3. Architecture Context

| Area | Details |
|------|---------|
| **Components** | Page: `RecruiterDashboard` (entry CTA), `AddCandidatePage` (layout + orchestration). Feature components: `AddCandidateForm`, repeatable `EducationSection` (max 3), `WorkExperienceSection`, `CvUploadField` (file input + progress). Optional: `Toast` / inline `Alert` for success. |
| **Services** | `candidateService.ts` (or `fileService.ts`): `uploadResume(file: File)`, `createCandidate(payload: CreateCandidateRequest)`. Base URL from `process.env.REACT_APP_API_URL` (document in `.env.example`). |
| **Types** | `src/types/candidate.ts` (mirror OpenAPI: `CreateCandidateRequest`, nested `CreateEducationRequest`, `CreateWorkExperienceRequest`, `CreateResumeRequest`, `FileUploadResponse`, `CreateCandidateResponse`, `ErrorResponse`). |
| **Validation** | `src/utils/candidateFormValidation.ts` (pure functions): required fields, email format, name length/character rules, Spanish phone regex when present, education count ≤ 3, date ordering (end ≥ start when both set), file type/size before upload. |
| **Routing** | `BrowserRouter` in `index.tsx` or `App.tsx`; routes: dashboard at `/` or `/recruiter`, add form at `/recruiter/candidates/new` (adjust to match backend deployment and product preference). |
| **State** | Local component state; optional `useReducer` for form + field-level errors. Separate flags: `isSubmitting`, `isUploading`, `uploadProgress` (if using `axios` `onUploadProgress`), `submitError`, `successMessage`. |
| **Files referenced** | `ai-specs/specs/api-spec.yml` (`POST /candidates`, `POST /upload`, schemas), `ai-specs/specs/data-model.md` (validation rules), `ai-specs/specs/frontend-standards.mdc` (structure, a11y, testing). |

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action:** Create and switch to a feature branch before any implementation work.
- **Branch naming:** `feature/ADD-CANDIDATE-ATS-frontend` (required suffix `-frontend` per `frontend-standards.mdc` Development Workflow).
- **Implementation steps:**
  1. Ensure you are on the appropriate base branch (`main` or `develop`) and it is up to date.
  2. `git pull origin <base-branch>`
  3. `git checkout -b feature/ADD-CANDIDATE-ATS-frontend`
  4. `git branch` to confirm.
- **Notes:** First step before code changes.

---

### Step 1: Align dependencies and app shell with project standards

- **Files:** `frontend/package.json`, `frontend/src/index.tsx`, `frontend/src/index.css` (global Bootstrap import if not scoped elsewhere).
- **Action:** Add runtime dependencies expected by `frontend-standards.mdc`: `axios`, `react-router-dom`, `react-bootstrap`, `bootstrap`, `react-bootstrap-icons` (optional). Optionally `react-datepicker` for date fields (map to ISO `date-time` strings for the API). If E2E is in scope, add Cypress and scripts per standards; otherwise document follow-up.
- **Implementation steps:**
  1. Install packages with versions compatible with React 18 / TypeScript 4.9.
  2. Import Bootstrap CSS once at the app entry (e.g. `bootstrap/dist/css/bootstrap.min.css` in `index.tsx`).
  3. Keep `index.css` theming; do not hardcode colors outside existing CSS variables if the project defines them.
- **Dependencies:** See section 9.
- **Notes:** Current `frontend/package.json` does not list Router/Bootstrap/axios; this step unblocks routing and UI patterns described in standards.

---

### Step 2: Environment configuration

- **Files:** `frontend/.env.example`, local `.env` (gitignored).
- **Action:** Document `REACT_APP_API_URL` pointing to the backend (e.g. `http://localhost:3010` or the port your backend uses—verify against backend README; OpenAPI `servers` may differ from actual dev port).
- **Implementation steps:**
  1. Add `.env.example` with `REACT_APP_API_URL=`.
  2. Read the base URL in services via `process.env.REACT_APP_API_URL` with a clear fallback or throw in development if missing.

---

### Step 3: TypeScript API types (OpenAPI-aligned)

- **File:** `frontend/src/types/candidate.ts` (split if preferred: `api.ts` + `candidate.ts`).
- **Action:** Export interfaces matching `CreateCandidateRequest` (property `cv` optional, type `CreateResumeRequest`), nested request types, `FileUploadResponse`, `CreateCandidateResponse`, and `ErrorResponse` (`message` required; `error` optional).
- **Signatures (illustrative):**

```typescript
export type CreateResumeRequest = { filePath: string; fileType: string };

export type CreateCandidateRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  educations?: CreateEducationRequest[];
  workExperiences?: CreateWorkExperienceRequest[];
  cv?: CreateResumeRequest;
};
```

- **Implementation notes:** Use `date-time` strings (ISO) for `startDate` / `endDate` in education and work experience payloads.

---

### Step 4: Validation module (TDD: write tests first)

- **Files:** `frontend/src/utils/candidateFormValidation.ts`, `frontend/src/utils/candidateFormValidation.test.ts`.
- **Action:** Pure functions validating form state before submit and for inline feedback. Mirror `data-model.md`:
  - **Names:** required, 2–100 chars, letters only (clarify with product if spaces/hyphens needed for real names).
  - **Email:** required, valid format.
  - **Phone:** if non-empty, Spanish pattern `(6|7|9)XXXXXXXX` as regex `^[679]\d{8}$` (9 digits total).
  - **Address:** max 100 chars if provided.
  - **Education:** 0–3 items; each complete row needs `institution`, `title`, `startDate`; optional `endDate`; if both dates present, end ≥ start.
  - **Work experience:** each complete row needs `company`, `position`, `startDate`; optional `description`, `endDate`; same date rule.
  - **File:** if provided: extension/MIME allowlist PDF and DOCX, size ≤ 10MB.
- **Implementation steps:**
  1. Add failing unit tests for each rule and edge cases (empty optional sections, invalid email, fourth education blocked, duplicate email handled at API layer only).
  2. Implement validators returning structured errors (field keys → message strings) for association with `Form.Control` and `aria-describedby`.

---

### Step 5: Service layer — upload and create candidate

- **File:** `frontend/src/services/candidateService.ts`
- **Action:**
  - `uploadResume(file: File): Promise<FileUploadResponse>` — `POST /upload` with `multipart/form-data`, field name `file` per OpenAPI. Use axios; optional `onUploadProgress` for progress UI.
  - `createCandidate(body: CreateCandidateRequest): Promise<CreateCandidateResponse>` — `POST /candidates`, `Content-Type: application/json`.
- **Error handling:** On axios error, read `response.data` for `ErrorResponse.message` when present; map 400 (validation / duplicate email) to user-safe messages; network/500 to generic message. Do not log PII in `console` in production paths (per ticket).
- **Dependencies:** `axios`, types from Step 3.

---

### Step 6: UI components — dashboard CTA and add-candidate form

- **Files:**  
  - `frontend/src/pages/RecruiterDashboard.tsx`  
  - `frontend/src/pages/AddCandidatePage.tsx`  
  - `frontend/src/components/AddCandidateForm.tsx`  
  - `frontend/src/components/EducationFields.tsx` (or inline sections)  
  - `frontend/src/components/WorkExperienceFields.tsx`  
  - `frontend/src/components/CvUploadField.tsx`

- **Action:**
  - **RecruiterDashboard:** Prominent primary `Button` or `Button as={Link}` to `/recruiter/candidates/new`, text e.g. “Add candidate”. Keyboard-focusable; `aria-label` if the visible text is not sufficient.
  - **AddCandidatePage:** Heading, optional breadcrumb/back to dashboard, container layout (`Container`, `Row`, `Col`).
  - **AddCandidateForm:** Controlled fields for `firstName`, `lastName`, `email`, `phone`, `address`. Dynamic lists for education (add/remove, cap 3) and work experience. Submit flow:
    1. Client-side validate.
    2. If CV selected: upload first; handle upload errors.
    3. Build `CreateCandidateRequest` (omit empty optional arrays; include `cv` only after successful upload).
    4. `createCandidate`; on 201, show non-blocking success (React Bootstrap `Toast` or dismissible `Alert`).
  - **CvUploadField:** `<input type="file" accept=".pdf,.docx,application/pdf,...">`; show file name; optional progress bar during upload; disable submit while uploading/submitting.

- **Implementation notes:** Disable primary submit while `isSubmitting || isUploading`. Focus management: on validation error, move focus to first invalid field (optional but improves a11y).

---

### Step 7: Routing

- **File:** `frontend/src/App.tsx` (and `frontend/src/index.tsx` if wrapping `BrowserRouter` here).
- **Action:** Define routes, e.g.:
  - `/` → `RecruiterDashboard`
  - `/recruiter/candidates/new` → `AddCandidatePage`
- **Implementation steps:**
  1. Wrap app with `BrowserRouter`.
  2. Use `Routes` / `Route` from `react-router-dom` v6.
  3. Use `useNavigate` after success if product wants redirect (e.g. to candidate detail when that route exists); otherwise stay on form with toast.

---

### Step 8: Automated tests (beyond validation unit tests)

- **Files:** `frontend/src/components/AddCandidateForm.test.tsx` (or co-located tests), optional `frontend/src/services/candidateService.test.ts` with axios mocked.
- **Action:**
  - **RTL:** Submit with required fields only; submit with education; duplicate-email error message from mocked API; disabled state during async.
  - **Cypress (if added):** `cypress/e2e/add-candidate.cy.ts` — happy path without file, with file (stub or test backend), and error display. Use `data-testid` on CTA and submit button per `frontend-standards.mdc`.

---

### Step 9: Stretch (out of scope unless time permits)

- **Action:** Autocomplete for institution/company/position via `GET /candidates?search=` or future endpoints; track as separate story per enhanced ticket.

---

### Step N+1: Update technical documentation

- **Action:** After implementation, update docs only when behavior or tooling diverges from specs.
- **Implementation steps:**
  1. Review all code changes.
  2. If routing or env vars are part of the “contract” for developers, add a short **English** note to `README.md` (recruiter add-candidate flow, `REACT_APP_API_URL`) only if the team keeps feature notes there.
  3. Update `ai-specs/specs/frontend-standards.mdc` only if you introduce a new pattern (e.g. toast library) worth standardizing.
  4. Update `ai-specs/specs/api-spec.yml` / `data-model.md` only if frontend discovers spec/backend mismatch (ticket says update if behavior diverges).
  5. Follow `documentation-standards.mdc`; all documentation in English.
- **Notes:** Mandatory before considering the work complete.

## 5. Implementation Order

1. Step 0: Create feature branch `feature/ADD-CANDIDATE-ATS-frontend`
2. Step 1: Dependencies and Bootstrap CSS shell
3. Step 2: Environment variables (`.env.example`)
4. Step 3: TypeScript API types
5. Step 4: Validation module + unit tests (TDD)
6. Step 5: `candidateService` (upload + create)
7. Step 6: Dashboard + form components + CV field
8. Step 7: Routing in `App.tsx`
9. Step 8: Component/integration tests (+ Cypress if adopted)
10. Step N+1: Documentation updates

## 6. Testing Checklist

- [ ] Unit tests: validation rules (email, phone, name length, education cap, dates, file size/type)
- [ ] RTL: submit success path (mocked 201), validation errors, API 400 with user-friendly message, optional upload-then-create order
- [ ] Manual: keyboard tab order through CTA → form → submit; screen reader labels on main controls
- [ ] E2E (if Cypress added): add candidate without CV; with CV; error path
- [ ] `npm test` and `npm run build` pass; ESLint/TypeScript clean

## 7. Error Handling Patterns

| Scenario | UI behavior |
|----------|-------------|
| Client validation | Inline errors per field; `aria-invalid`, `aria-describedby` linking to error text |
| `POST /upload` 400 (type/size) | Clear message: allowed types PDF/DOCX, max 10MB |
| `POST /candidates` 400 (validation or duplicate email) | Use server `message` when safe; map “email” / “already exists” to non-technical English |
| Network / 500 | Generic message; optional “Retry” for transient failures |
| Success 201 | Non-blocking toast or top `Alert`; include confirmation copy per acceptance criteria |

**Service layer:** Centralize axios error parsing in one helper to avoid duplicated strings.

## 8. UI/UX Considerations

- **Bootstrap / React Bootstrap:** `Container`, `Card`, `Form`, `Button`, `Alert`, `Spinner`, `ProgressBar` (upload), `Toast` for success.
- **Responsive:** Stack columns on small screens; touch-friendly tap targets.
- **Accessibility:** Visible labels (`Form.Label`), associate errors with inputs, logical focus order, sufficient contrast (Bootstrap defaults as baseline).
- **Loading:** Show upload progress for large files; disable form actions during submit/upload to prevent double submission.
- **Colors:** Use existing `index.css` / theme tokens per project convention.

## 9. Dependencies

- **Required (new for current minimal frontend):** `axios`, `react-router-dom`, `react-bootstrap`, `bootstrap`
- **Optional:** `react-bootstrap-icons`, `react-datepicker` (if not using native `datetime-local` / text + validation)
- **Testing:** `@testing-library/react` (present); Cypress 14.x if E2E matches `frontend-standards.mdc`
- **No new global state library** unless product expands scope

## 10. Notes

- **English only** for UI copy, code, tests, commits (`CLAUDE.md`).
- **API field name:** Request body uses `cv` with shape `CreateResumeRequest` (`filePath`, `fileType`), not raw file bytes on create.
- **Duplicate email:** Handled server-side; surface as friendly conflict message, not stack traces.
- **409 vs 400:** OpenAPI lists 400 for validation/email conflict; implement client to handle 400 per spec regardless of other docs mentioning 409.
- **PII:** Avoid logging form values or tokens in browser console in production builds.

## 11. Next Steps After Implementation

- Backend integration testing against real API in dev/staging
- Optional: redirect to `GET /candidates/:id` detail page when that UI exists
- Autocomplete story for institution/company/position
- Security review: recruiter-only routes when auth is added

## 12. Implementation Verification

- [ ] Branch named `feature/ADD-CANDIDATE-ATS-frontend`
- [ ] Dashboard shows visible “Add candidate” (or equivalent) control; navigates to form route
- [ ] Create candidate works without CV and with CV (upload then create)
- [ ] Duplicate email shows appropriate error
- [ ] Types, lint, and tests pass; documentation updated where applicable
- [ ] Accessibility spot-check: keyboard + labels on main interactive elements
