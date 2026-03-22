import { validateCreateCandidateRequest } from '../validator';
import { ValidationError } from '../../domain/errors';

describe('validateCreateCandidateRequest', () => {
  it('should accept minimal valid payload', () => {
    const result = validateCreateCandidateRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    });
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.educations).toEqual([]);
    expect(result.workExperiences).toEqual([]);
    expect(result.cv).toBeUndefined();
  });

  it('should normalize email to lowercase', () => {
    const result = validateCreateCandidateRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'John.Doe@Example.COM',
    });
    expect(result.email).toBe('john.doe@example.com');
  });

  it('should reject invalid email', () => {
    expect(() =>
      validateCreateCandidateRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
      })
    ).toThrow(ValidationError);
  });

  it('should reject more than three educations', () => {
    expect(() =>
      validateCreateCandidateRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        educations: [1, 2, 3, 4].map((i) => ({
          institution: `Inst${i}`,
          title: 'Title',
          startDate: '2020-01-01T00:00:00.000Z',
        })),
      })
    ).toThrow(ValidationError);
  });

  it('should reject invalid phone format', () => {
    expect(() =>
      validateCreateCandidateRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '123456789',
      })
    ).toThrow(ValidationError);
  });

  it('should accept valid Spanish mobile phone', () => {
    const result = validateCreateCandidateRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '612345678',
    });
    expect(result.phone).toBe('612345678');
  });

  it('should reject education with end before start', () => {
    expect(() =>
      validateCreateCandidateRequest({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        educations: [
          {
            institution: 'University',
            title: 'BSc',
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2019-01-01T00:00:00.000Z',
          },
        ],
      })
    ).toThrow(ValidationError);
  });

  it('should parse nested educations and work experiences', () => {
    const result = validateCreateCandidateRequest({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      educations: [
        {
          institution: 'University',
          title: 'BSc',
          startDate: '2018-09-01T00:00:00.000Z',
          endDate: '2022-06-01T00:00:00.000Z',
        },
      ],
      workExperiences: [
        {
          company: 'Acme',
          position: 'Dev',
          startDate: '2022-07-01T00:00:00.000Z',
          description: 'Coding',
        },
      ],
      cv: {
        filePath: 'uploads/x.pdf',
        fileType: 'application/pdf',
      },
    });
    expect(result.educations).toHaveLength(1);
    expect(result.workExperiences).toHaveLength(1);
    expect(result.cv?.filePath).toBe('uploads/x.pdf');
  });
});
