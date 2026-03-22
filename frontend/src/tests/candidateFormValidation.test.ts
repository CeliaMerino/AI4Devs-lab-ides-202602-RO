import {
  buildCreateCandidatePayload,
  dateInputToIsoDateTime,
  educationRowEmpty,
  MAX_EDUCATIONS,
  validateCandidateForm,
  validateCvFile,
} from '../utils/candidateFormValidation';
import {
  emptyEducationRow,
  emptyWorkExperienceRow,
  initialCandidateFormState,
  type CandidateFormState,
} from '../types/candidateForm';

describe('validateCandidateForm', () => {
  const base = (): CandidateFormState => ({
    ...initialCandidateFormState(),
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
  });

  it('returns no errors for minimal valid payload', () => {
    const errors = validateCandidateForm(base());
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('requires first and last name', () => {
    const s = base();
    s.firstName = '';
    s.lastName = '';
    const errors = validateCandidateForm(s);
    expect(errors.firstName).toBeDefined();
    expect(errors.lastName).toBeDefined();
  });

  it('rejects invalid email', () => {
    const s = base();
    s.email = 'not-an-email';
    const errors = validateCandidateForm(s);
    expect(errors.email).toBeDefined();
  });

  it('validates Spanish phone when provided', () => {
    const s = base();
    s.phone = '123';
    expect(validateCandidateForm(s).phone).toBeDefined();
    s.phone = '612345678';
    expect(validateCandidateForm(s).phone).toBeUndefined();
  });

  it('enforces max education rows', () => {
    const s = base();
    s.educations = Array.from({ length: MAX_EDUCATIONS + 1 }, () => emptyEducationRow());
    const errors = validateCandidateForm(s);
    expect(errors.educations).toBeDefined();
  });

  it('validates a filled education row', () => {
    const s = base();
    s.educations = [
      {
        institution: 'University',
        title: 'BSc',
        startDate: '2020-09-01',
        endDate: '',
      },
    ];
    expect(validateCandidateForm(s)).toEqual({});
  });

  it('requires fields when education row is partially filled', () => {
    const s = base();
    s.educations = [
      {
        institution: 'Only institution',
        title: '',
        startDate: '',
        endDate: '',
      },
    ];
    const errors = validateCandidateForm(s);
    expect(errors['educations.0.title']).toBeDefined();
    expect(errors['educations.0.startDate']).toBeDefined();
  });

  it('validates end date after start date for education', () => {
    const s = base();
    s.educations = [
      {
        institution: 'University',
        title: 'BSc',
        startDate: '2020-09-01',
        endDate: '2019-01-01',
      },
    ];
    const errors = validateCandidateForm(s);
    expect(errors['educations.0.endDate']).toBeDefined();
  });

  it('validates work experience row', () => {
    const s = base();
    s.workExperiences = [
      {
        company: 'Acme',
        position: 'Dev',
        description: '',
        startDate: '2021-01-01',
        endDate: '',
      },
    ];
    expect(validateCandidateForm(s)).toEqual({});
  });
});

describe('validateCvFile', () => {
  it('returns null when no file', () => {
    expect(validateCvFile(null)).toBeNull();
  });

  it('rejects oversized file', () => {
    const file = new File(['x'], 'cv.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    expect(validateCvFile(file)).toBeTruthy();
  });

  it('rejects wrong mime type', () => {
    const file = new File(['x'], 'x.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 100 });
    expect(validateCvFile(file)).toBeTruthy();
  });
});

describe('buildCreateCandidatePayload', () => {
  it('omits empty optional sections', () => {
    const state: CandidateFormState = {
      ...initialCandidateFormState(),
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      educations: [emptyEducationRow()],
      workExperiences: [emptyWorkExperienceRow()],
    };
    const body = buildCreateCandidatePayload(state);
    expect(body.educations).toBeUndefined();
    expect(body.workExperiences).toBeUndefined();
  });

  it('includes education and CV when present', () => {
    const state: CandidateFormState = {
      ...initialCandidateFormState(),
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      educations: [
        {
          institution: 'Uni',
          title: 'BSc',
          startDate: '2020-01-15',
          endDate: '',
        },
      ],
      workExperiences: [],
    };
    const body = buildCreateCandidatePayload(state, { filePath: 'uploads/a.pdf', fileType: 'application/pdf' });
    expect(body.educations?.[0].startDate).toBe(dateInputToIsoDateTime('2020-01-15'));
    expect(body.cv).toEqual({ filePath: 'uploads/a.pdf', fileType: 'application/pdf' });
  });
});

describe('educationRowEmpty', () => {
  it('detects empty row', () => {
    expect(educationRowEmpty(emptyEducationRow())).toBe(true);
  });
});
