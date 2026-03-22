import React, { useState } from 'react';
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  createCandidate,
  getApiErrorMessage,
  uploadResume,
} from '../services/candidateService';
import {
  emptyEducationRow,
  emptyWorkExperienceRow,
  initialCandidateFormState,
  type CandidateFormState,
  type EducationFormRow,
  type WorkExperienceFormRow,
} from '../types/candidateForm';
import {
  buildCreateCandidatePayload,
  MAX_EDUCATIONS,
  validateCandidateForm,
  validateCvFile,
  type FieldErrors,
} from '../utils/candidateFormValidation';
import CvUploadField from './CvUploadField';
import EducationFields from './EducationFields';
import WorkExperienceFields from './WorkExperienceFields';

const AddCandidateForm: React.FC = () => {
  const [form, setForm] = useState<CandidateFormState>(() => initialCandidateFormState());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const busy = isSubmitting || isUploading;

  const updateCore = (field: keyof Pick<CandidateFormState, 'firstName' | 'lastName' | 'email' | 'phone' | 'address'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addEducation = () => {
    setForm((prev) => {
      if (prev.educations.length >= MAX_EDUCATIONS) {
        return prev;
      }
      return { ...prev, educations: [...prev.educations, emptyEducationRow()] };
    });
  };

  const removeEducation = (index: number) => {
    setForm((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }));
  };

  const changeEducation = (index: number, field: keyof EducationFormRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      educations: prev.educations.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const addWork = () => {
    setForm((prev) => ({
      ...prev,
      workExperiences: [...prev.workExperiences, emptyWorkExperienceRow()],
    }));
  };

  const removeWork = (index: number) => {
    setForm((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index),
    }));
  };

  const changeWork = (index: number, field: keyof WorkExperienceFormRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setShowSuccess(false);

    const validationErrors = validateCandidateForm(form);
    const cvMessage = validateCvFile(cvFile);
    const merged: FieldErrors = { ...validationErrors };
    if (cvMessage) {
      merged.cv = cvMessage;
    }
    if (Object.keys(merged).length > 0) {
      setFieldErrors(merged);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      let cvPayload: { filePath: string; fileType: string } | undefined;
      if (cvFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const uploaded = await uploadResume(cvFile, (p) => setUploadProgress(p));
        cvPayload = { filePath: uploaded.filePath, fileType: uploaded.fileType };
        setUploadProgress(null);
        setIsUploading(false);
      }

      const payload = buildCreateCandidatePayload(form, cvPayload);
      await createCandidate(payload);
      setShowSuccess(true);
      setForm(initialCandidateFormState());
      setCvFile(null);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit}>
      {showSuccess && (
        <Alert variant="success" dismissible onClose={() => setShowSuccess(false)} role="status">
          The candidate was added successfully.
        </Alert>
      )}
      {submitError && (
        <Alert variant="danger" role="alert">
          {submitError}
        </Alert>
      )}

      <fieldset disabled={busy}>
        <legend className="visually-hidden">Candidate details</legend>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="candidate-firstName">
              <Form.Label>First name *</Form.Label>
              <Form.Control
                type="text"
                value={form.firstName}
                onChange={(e) => updateCore('firstName', e.target.value)}
                autoComplete="given-name"
                isInvalid={!!fieldErrors.firstName}
                aria-describedby={fieldErrors.firstName ? 'candidate-firstName-feedback' : undefined}
              />
              <Form.Control.Feedback type="invalid" id="candidate-firstName-feedback">
                {fieldErrors.firstName}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="candidate-lastName">
              <Form.Label>Last name *</Form.Label>
              <Form.Control
                type="text"
                value={form.lastName}
                onChange={(e) => updateCore('lastName', e.target.value)}
                autoComplete="family-name"
                isInvalid={!!fieldErrors.lastName}
                aria-describedby={fieldErrors.lastName ? 'candidate-lastName-feedback' : undefined}
              />
              <Form.Control.Feedback type="invalid" id="candidate-lastName-feedback">
                {fieldErrors.lastName}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3" controlId="candidate-email">
          <Form.Label>Email *</Form.Label>
          <Form.Control
            type="email"
            value={form.email}
            onChange={(e) => updateCore('email', e.target.value)}
            autoComplete="email"
            isInvalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'candidate-email-feedback' : undefined}
          />
          <Form.Control.Feedback type="invalid" id="candidate-email-feedback">
            {fieldErrors.email}
          </Form.Control.Feedback>
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="candidate-phone">
              <Form.Label>Phone (optional)</Form.Label>
              <Form.Control
                type="tel"
                value={form.phone}
                onChange={(e) => updateCore('phone', e.target.value)}
                autoComplete="tel"
                isInvalid={!!fieldErrors.phone}
                aria-describedby={fieldErrors.phone ? 'candidate-phone-feedback' : undefined}
              />
              <Form.Control.Feedback type="invalid" id="candidate-phone-feedback">
                {fieldErrors.phone}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="candidate-address">
              <Form.Label>Address (optional)</Form.Label>
              <Form.Control
                type="text"
                value={form.address}
                onChange={(e) => updateCore('address', e.target.value)}
                autoComplete="street-address"
                isInvalid={!!fieldErrors.address}
                aria-describedby={fieldErrors.address ? 'candidate-address-feedback' : undefined}
              />
              <Form.Control.Feedback type="invalid" id="candidate-address-feedback">
                {fieldErrors.address}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <CvUploadField
          fileName={cvFile?.name ?? null}
          uploadProgress={uploadProgress}
          error={fieldErrors.cv}
          disabled={busy}
          onFileChange={(file) => {
            setCvFile(file);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.cv;
              return next;
            });
          }}
        />

        <EducationFields
          rows={form.educations}
          errors={fieldErrors}
          disabled={busy}
          onAdd={addEducation}
          onRemove={removeEducation}
          onChange={changeEducation}
        />

        <WorkExperienceFields
          rows={form.workExperiences}
          errors={fieldErrors}
          disabled={busy}
          onAdd={addWork}
          onRemove={removeWork}
          onChange={changeWork}
        />
      </fieldset>

      <Button
        type="submit"
        variant="primary"
        disabled={busy}
        data-testid="add-candidate-submit"
        aria-busy={busy}
      >
        {busy ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" aria-hidden />
            Saving…
          </>
        ) : (
          'Save candidate'
        )}
      </Button>
    </Form>
  );
};

export default AddCandidateForm;
