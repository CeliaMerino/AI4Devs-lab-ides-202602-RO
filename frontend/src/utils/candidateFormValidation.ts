import type {
  CreateCandidateRequest,
  CreateEducationRequest,
  CreateWorkExperienceRequest,
} from '../types/candidate';
import type {
  CandidateFormState,
  EducationFormRow,
  WorkExperienceFormRow,
} from '../types/candidateForm';

/** Aligned with backend `application/validator.ts` */
export const NAME_PATTERN = /^[\p{L}\s'-]{2,100}$/u;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[679]\d{8}$/;

const MAX_ADDRESS = 100;
const MAX_INSTITUTION = 100;
const MAX_TITLE = 250;
const MAX_COMPANY = 100;
const MAX_POSITION = 100;
const MAX_DESCRIPTION = 200;
export const MAX_EDUCATIONS = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_CV_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export type FieldErrors = Record<string, string>;

export function educationRowEmpty(row: EducationFormRow): boolean {
  return (
    !row.institution.trim() &&
    !row.title.trim() &&
    !row.startDate.trim() &&
    !row.endDate.trim()
  );
}

export function workExperienceRowEmpty(row: WorkExperienceFormRow): boolean {
  return (
    !row.company.trim() &&
    !row.position.trim() &&
    !row.description.trim() &&
    !row.startDate.trim() &&
    !row.endDate.trim()
  );
}

function parseLocalDateBoundary(dateStr: string): Date | null {
  const t = dateStr.trim();
  if (!t) {
    return null;
  }
  const d = new Date(`${t}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dateInputToIsoDateTime(dateStr: string): string {
  return new Date(`${dateStr.trim()}T12:00:00.000Z`).toISOString();
}

function validateEducationRow(row: EducationFormRow, index: number, errors: FieldErrors): void {
  const prefix = `educations.${index}`;
  if (educationRowEmpty(row)) {
    return;
  }
  const institution = row.institution.trim();
  if (!institution) {
    errors[`${prefix}.institution`] = 'Institution is required for this education entry.';
  } else if (institution.length > MAX_INSTITUTION) {
    errors[`${prefix}.institution`] = 'Institution exceeds maximum length.';
  }
  const title = row.title.trim();
  if (!title) {
    errors[`${prefix}.title`] = 'Title is required for this education entry.';
  } else if (title.length > MAX_TITLE) {
    errors[`${prefix}.title`] = 'Title exceeds maximum length.';
  }
  const start = parseLocalDateBoundary(row.startDate);
  if (!row.startDate.trim()) {
    errors[`${prefix}.startDate`] = 'Start date is required for this education entry.';
  } else if (!start) {
    errors[`${prefix}.startDate`] = 'Start date must be valid.';
  }
  let end: Date | null = null;
  if (row.endDate.trim()) {
    end = parseLocalDateBoundary(row.endDate);
    if (!end) {
      errors[`${prefix}.endDate`] = 'End date must be valid.';
    }
  }
  if (start && end && end < start) {
    errors[`${prefix}.endDate`] = 'End date must be on or after start date.';
  }
}

function validateWorkRow(row: WorkExperienceFormRow, index: number, errors: FieldErrors): void {
  const prefix = `workExperiences.${index}`;
  if (workExperienceRowEmpty(row)) {
    return;
  }
  const company = row.company.trim();
  if (!company) {
    errors[`${prefix}.company`] = 'Company is required for this work experience entry.';
  } else if (company.length > MAX_COMPANY) {
    errors[`${prefix}.company`] = 'Company name exceeds maximum length.';
  }
  const position = row.position.trim();
  if (!position) {
    errors[`${prefix}.position`] = 'Position is required for this work experience entry.';
  } else if (position.length > MAX_POSITION) {
    errors[`${prefix}.position`] = 'Position exceeds maximum length.';
  }
  if (row.description.trim().length > MAX_DESCRIPTION) {
    errors[`${prefix}.description`] = 'Description exceeds maximum length.';
  }
  const start = parseLocalDateBoundary(row.startDate);
  if (!row.startDate.trim()) {
    errors[`${prefix}.startDate`] = 'Start date is required for this work experience entry.';
  } else if (!start) {
    errors[`${prefix}.startDate`] = 'Start date must be valid.';
  }
  let end: Date | null = null;
  if (row.endDate.trim()) {
    end = parseLocalDateBoundary(row.endDate);
    if (!end) {
      errors[`${prefix}.endDate`] = 'End date must be valid.';
    }
  }
  if (start && end && end < start) {
    errors[`${prefix}.endDate`] = 'End date must be on or after start date.';
  }
}

export function validateCandidateForm(state: CandidateFormState): FieldErrors {
  const errors: FieldErrors = {};

  const firstName = state.firstName.trim();
  if (!firstName) {
    errors.firstName = 'First name is required.';
  } else if (!NAME_PATTERN.test(firstName)) {
    errors.firstName =
      'First name must be 2–100 characters and contain only letters, spaces, hyphens, or apostrophes.';
  }

  const lastName = state.lastName.trim();
  if (!lastName) {
    errors.lastName = 'Last name is required.';
  } else if (!NAME_PATTERN.test(lastName)) {
    errors.lastName =
      'Last name must be 2–100 characters and contain only letters, spaces, hyphens, or apostrophes.';
  }

  const email = state.email.trim();
  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  const phone = state.phone.trim();
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Phone must match Spanish mobile format: 9 digits starting with 6, 7, or 9.';
  }

  if (state.address.length > MAX_ADDRESS) {
    errors.address = 'Address exceeds maximum length.';
  }

  if (state.educations.length > MAX_EDUCATIONS) {
    errors.educations = `At most ${MAX_EDUCATIONS} education records are allowed.`;
  }

  state.educations.forEach((row, index) => {
    validateEducationRow(row, index, errors);
  });

  state.workExperiences.forEach((row, index) => {
    validateWorkRow(row, index, errors);
  });

  return errors;
}

export function validateCvFile(file: File | null): string | null {
  if (!file) {
    return null;
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'File must be 10MB or smaller. Allowed types: PDF, DOCX.';
  }
  if (!ALLOWED_CV_MIME.has(file.type)) {
    return 'Only PDF or DOCX files are allowed.';
  }
  return null;
}

function mapEducationRow(row: EducationFormRow): CreateEducationRequest {
  const base: CreateEducationRequest = {
    institution: row.institution.trim(),
    title: row.title.trim(),
    startDate: dateInputToIsoDateTime(row.startDate),
  };
  if (row.endDate.trim()) {
    return { ...base, endDate: dateInputToIsoDateTime(row.endDate) };
  }
  return base;
}

function mapWorkRow(row: WorkExperienceFormRow): CreateWorkExperienceRequest {
  const base: CreateWorkExperienceRequest = {
    company: row.company.trim(),
    position: row.position.trim(),
    startDate: dateInputToIsoDateTime(row.startDate),
  };
  if (row.description.trim()) {
    base.description = row.description.trim();
  }
  if (row.endDate.trim()) {
    base.endDate = dateInputToIsoDateTime(row.endDate);
  }
  return base;
}

export function buildCreateCandidatePayload(
  state: CandidateFormState,
  cv?: { filePath: string; fileType: string }
): CreateCandidateRequest {
  const educations = state.educations
    .filter((row) => !educationRowEmpty(row))
    .map(mapEducationRow);

  const workExperiences = state.workExperiences
    .filter((row) => !workExperienceRowEmpty(row))
    .map(mapWorkRow);

  const body: CreateCandidateRequest = {
    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    email: state.email.trim().toLowerCase(),
  };

  const phone = state.phone.trim();
  if (phone) {
    body.phone = phone;
  }

  const address = state.address.trim();
  if (address) {
    body.address = address;
  }

  if (educations.length > 0) {
    body.educations = educations;
  }
  if (workExperiences.length > 0) {
    body.workExperiences = workExperiences;
  }
  if (cv) {
    body.cv = cv;
  }

  return body;
}
