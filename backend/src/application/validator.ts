import { ValidationError } from '../domain/errors';
import type {
  CreateCandidateValidated,
  CreateEducationInput,
  CreateResumeInput,
  CreateWorkExperienceInput,
} from './types/createCandidate.types';

const NAME_PATTERN = /^[\p{L}\s'-]{2,100}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[679]\d{8}$/;

const MAX_ADDRESS = 100;
const MAX_INSTITUTION = 100;
const MAX_TITLE = 250;
const MAX_COMPANY = 100;
const MAX_POSITION = 100;
const MAX_DESCRIPTION = 200;
const MAX_FILE_PATH = 500;
const MAX_FILE_TYPE = 50;
const MAX_EDUCATIONS = 3;

function assertIsoDate(value: unknown, fieldName: string): Date {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} must be a non-empty date string`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  return d;
}

function assertDateOrder(start: Date, end: Date | undefined, context: string): void {
  if (end && end < start) {
    throw new ValidationError(`${context}: end date must be on or after start date`);
  }
}

function parseEducation(raw: unknown, index: number): CreateEducationInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationError(`educations[${index}] must be an object`);
  }
  const o = raw as Record<string, unknown>;
  const institution = o.institution;
  const title = o.title;
  if (typeof institution !== 'string' || institution.trim() === '') {
    throw new ValidationError(`educations[${index}].institution is required`);
  }
  if (institution.length > MAX_INSTITUTION) {
    throw new ValidationError(`educations[${index}].institution exceeds maximum length`);
  }
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ValidationError(`educations[${index}].title is required`);
  }
  if (title.length > MAX_TITLE) {
    throw new ValidationError(`educations[${index}].title exceeds maximum length`);
  }
  const startDate = assertIsoDate(o.startDate, `educations[${index}].startDate`);
  let endDate: Date | undefined;
  if (o.endDate !== undefined && o.endDate !== null) {
    endDate = assertIsoDate(o.endDate, `educations[${index}].endDate`);
  }
  assertDateOrder(startDate, endDate, `Education entry ${index + 1}`);
  return { institution: institution.trim(), title: title.trim(), startDate, endDate };
}

function parseWorkExperience(raw: unknown, index: number): CreateWorkExperienceInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationError(`workExperiences[${index}] must be an object`);
  }
  const o = raw as Record<string, unknown>;
  const company = o.company;
  const position = o.position;
  if (typeof company !== 'string' || company.trim() === '') {
    throw new ValidationError(`workExperiences[${index}].company is required`);
  }
  if (company.length > MAX_COMPANY) {
    throw new ValidationError(`workExperiences[${index}].company exceeds maximum length`);
  }
  if (typeof position !== 'string' || position.trim() === '') {
    throw new ValidationError(`workExperiences[${index}].position is required`);
  }
  if (position.length > MAX_POSITION) {
    throw new ValidationError(`workExperiences[${index}].position exceeds maximum length`);
  }
  const startDate = assertIsoDate(o.startDate, `workExperiences[${index}].startDate`);
  let endDate: Date | undefined;
  if (o.endDate !== undefined && o.endDate !== null) {
    endDate = assertIsoDate(o.endDate, `workExperiences[${index}].endDate`);
  }
  assertDateOrder(startDate, endDate, `Work experience entry ${index + 1}`);
  let description: string | undefined;
  if (o.description !== undefined && o.description !== null) {
    if (typeof o.description !== 'string') {
      throw new ValidationError(`workExperiences[${index}].description must be a string`);
    }
    if (o.description.length > MAX_DESCRIPTION) {
      throw new ValidationError(`workExperiences[${index}].description exceeds maximum length`);
    }
    description = o.description.trim() || undefined;
  }
  return {
    company: company.trim(),
    position: position.trim(),
    startDate,
    endDate,
    description,
  };
}

function parseCv(raw: unknown): CreateResumeInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationError('cv must be an object when provided');
  }
  const o = raw as Record<string, unknown>;
  const filePath = o.filePath;
  const fileType = o.fileType;
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new ValidationError('cv.filePath is required when cv is provided');
  }
  if (filePath.length > MAX_FILE_PATH) {
    throw new ValidationError('cv.filePath exceeds maximum length');
  }
  if (typeof fileType !== 'string' || fileType.trim() === '') {
    throw new ValidationError('cv.fileType is required when cv is provided');
  }
  if (fileType.length > MAX_FILE_TYPE) {
    throw new ValidationError('cv.fileType exceeds maximum length');
  }
  return { filePath: filePath.trim(), fileType: fileType.trim() };
}

export function validateCreateCandidateRequest(body: unknown): CreateCandidateValidated {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object');
  }
  const o = body as Record<string, unknown>;

  const firstName = o.firstName;
  const lastName = o.lastName;
  const emailRaw = o.email;

  if (typeof firstName !== 'string') {
    throw new ValidationError('firstName is required');
  }
  const firstNameTrimmed = firstName.trim();
  if (!NAME_PATTERN.test(firstNameTrimmed)) {
    throw new ValidationError('firstName must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes');
  }
  if (typeof lastName !== 'string') {
    throw new ValidationError('lastName is required');
  }
  const lastNameTrimmed = lastName.trim();
  if (!NAME_PATTERN.test(lastNameTrimmed)) {
    throw new ValidationError('lastName must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes');
  }
  if (typeof emailRaw !== 'string' || !EMAIL_PATTERN.test(emailRaw.trim())) {
    throw new ValidationError('email must be a valid email address');
  }
  const email = emailRaw.trim().toLowerCase();

  let phone: string | undefined;
  if (o.phone !== undefined && o.phone !== null) {
    if (typeof o.phone !== 'string') {
      throw new ValidationError('phone must be a string when provided');
    }
    const p = o.phone.trim();
    if (p !== '' && !PHONE_PATTERN.test(p)) {
      throw new ValidationError('phone must match Spanish mobile format: 9 digits starting with 6, 7, or 9');
    }
    phone = p === '' ? undefined : p;
  }

  let address: string | undefined;
  if (o.address !== undefined && o.address !== null) {
    if (typeof o.address !== 'string') {
      throw new ValidationError('address must be a string when provided');
    }
    if (o.address.length > MAX_ADDRESS) {
      throw new ValidationError('address exceeds maximum length');
    }
    address = o.address.trim() || undefined;
  }

  let educations: CreateEducationInput[] = [];
  if (o.educations !== undefined && o.educations !== null) {
    if (!Array.isArray(o.educations)) {
      throw new ValidationError('educations must be an array when provided');
    }
    if (o.educations.length > MAX_EDUCATIONS) {
      throw new ValidationError(`At most ${MAX_EDUCATIONS} education records are allowed`);
    }
    educations = o.educations.map((item, index) => parseEducation(item, index));
  }

  let workExperiences: CreateWorkExperienceInput[] = [];
  if (o.workExperiences !== undefined && o.workExperiences !== null) {
    if (!Array.isArray(o.workExperiences)) {
      throw new ValidationError('workExperiences must be an array when provided');
    }
    workExperiences = o.workExperiences.map((item, index) => parseWorkExperience(item, index));
  }

  let cv: CreateResumeInput | undefined;
  if (o.cv !== undefined && o.cv !== null) {
    cv = parseCv(o.cv);
  }

  return {
    firstName: firstNameTrimmed,
    lastName: lastNameTrimmed,
    email,
    phone,
    address,
    educations,
    workExperiences,
    cv,
  };
}
