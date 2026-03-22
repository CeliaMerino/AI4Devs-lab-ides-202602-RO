import React from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import type { EducationFormRow } from '../types/candidateForm';
import type { FieldErrors } from '../utils/candidateFormValidation';
import { MAX_EDUCATIONS } from '../utils/candidateFormValidation';

type EducationFieldsProps = {
  rows: EducationFormRow[];
  errors: FieldErrors;
  disabled: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof EducationFormRow, value: string) => void;
};

function errorKey(index: number, field: keyof EducationFormRow): string {
  return `educations.${index}.${field}`;
}

const EducationFields: React.FC<EducationFieldsProps> = ({
  rows,
  errors,
  disabled,
  onAdd,
  onRemove,
  onChange,
}) => {
  return (
    <section aria-labelledby="education-heading">
      <h3 id="education-heading" className="h5 mb-3">
        Education
      </h3>
      <p className="text-muted small">Optional. Up to {MAX_EDUCATIONS} entries.</p>
      {rows.map((row, index) => (
        <Card key={index} className="mb-3">
          <Card.Body>
            <Card.Title as="h4" className="h6">
              Education {index + 1}
            </Card.Title>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`education-${index}-institution`}>
                  <Form.Label>Institution</Form.Label>
                  <Form.Control
                    type="text"
                    value={row.institution}
                    onChange={(e) => onChange(index, 'institution', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'institution')]}
                    aria-describedby={
                      errors[errorKey(index, 'institution')]
                        ? `education-${index}-institution-feedback`
                        : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`education-${index}-institution-feedback`}>
                    {errors[errorKey(index, 'institution')]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`education-${index}-title`}>
                  <Form.Label>Title / degree</Form.Label>
                  <Form.Control
                    type="text"
                    value={row.title}
                    onChange={(e) => onChange(index, 'title', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'title')]}
                    aria-describedby={
                      errors[errorKey(index, 'title')]
                        ? `education-${index}-title-feedback`
                        : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`education-${index}-title-feedback`}>
                    {errors[errorKey(index, 'title')]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`education-${index}-startDate`}>
                  <Form.Label>Start date</Form.Label>
                  <Form.Control
                    type="date"
                    value={row.startDate}
                    onChange={(e) => onChange(index, 'startDate', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'startDate')]}
                    aria-describedby={
                      errors[errorKey(index, 'startDate')]
                        ? `education-${index}-startDate-feedback`
                        : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`education-${index}-startDate-feedback`}>
                    {errors[errorKey(index, 'startDate')]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`education-${index}-endDate`}>
                  <Form.Label>End date (optional)</Form.Label>
                  <Form.Control
                    type="date"
                    value={row.endDate}
                    onChange={(e) => onChange(index, 'endDate', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'endDate')]}
                    aria-describedby={
                      errors[errorKey(index, 'endDate')]
                        ? `education-${index}-endDate-feedback`
                        : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`education-${index}-endDate-feedback`}>
                    {errors[errorKey(index, 'endDate')]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              onClick={() => onRemove(index)}
              disabled={disabled}
            >
              Remove this education
            </Button>
          </Card.Body>
        </Card>
      ))}
      {errors.educations && (
        <p className="text-danger small" role="alert">
          {errors.educations}
        </p>
      )}
      <Button
        type="button"
        variant="outline-secondary"
        onClick={onAdd}
        disabled={disabled || rows.length >= MAX_EDUCATIONS}
      >
        Add education
      </Button>
    </section>
  );
};

export default EducationFields;
