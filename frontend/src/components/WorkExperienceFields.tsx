import React from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import type { WorkExperienceFormRow } from '../types/candidateForm';
import type { FieldErrors } from '../utils/candidateFormValidation';

type WorkExperienceFieldsProps = {
  rows: WorkExperienceFormRow[];
  errors: FieldErrors;
  disabled: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof WorkExperienceFormRow, value: string) => void;
};

function errorKey(index: number, field: keyof WorkExperienceFormRow): string {
  return `workExperiences.${index}.${field}`;
}

const WorkExperienceFields: React.FC<WorkExperienceFieldsProps> = ({
  rows,
  errors,
  disabled,
  onAdd,
  onRemove,
  onChange,
}) => {
  return (
    <section aria-labelledby="work-heading" className="mt-4">
      <h3 id="work-heading" className="h5 mb-3">
        Work experience
      </h3>
      <p className="text-muted small">Optional. Add one or more positions.</p>
      {rows.map((row, index) => (
        <Card key={index} className="mb-3">
          <Card.Body>
            <Card.Title as="h4" className="h6">
              Experience {index + 1}
            </Card.Title>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`work-${index}-company`}>
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    value={row.company}
                    onChange={(e) => onChange(index, 'company', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'company')]}
                    aria-describedby={
                      errors[errorKey(index, 'company')] ? `work-${index}-company-feedback` : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`work-${index}-company-feedback`}>
                    {errors[errorKey(index, 'company')]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`work-${index}-position`}>
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="text"
                    value={row.position}
                    onChange={(e) => onChange(index, 'position', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'position')]}
                    aria-describedby={
                      errors[errorKey(index, 'position')] ? `work-${index}-position-feedback` : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`work-${index}-position-feedback`}>
                    {errors[errorKey(index, 'position')]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId={`work-${index}-description`}>
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={row.description}
                onChange={(e) => onChange(index, 'description', e.target.value)}
                disabled={disabled}
                isInvalid={!!errors[errorKey(index, 'description')]}
                aria-describedby={
                  errors[errorKey(index, 'description')] ? `work-${index}-description-feedback` : undefined
                }
              />
              <Form.Control.Feedback type="invalid" id={`work-${index}-description-feedback`}>
                {errors[errorKey(index, 'description')]}
              </Form.Control.Feedback>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`work-${index}-startDate`}>
                  <Form.Label>Start date</Form.Label>
                  <Form.Control
                    type="date"
                    value={row.startDate}
                    onChange={(e) => onChange(index, 'startDate', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'startDate')]}
                    aria-describedby={
                      errors[errorKey(index, 'startDate')] ? `work-${index}-startDate-feedback` : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`work-${index}-startDate-feedback`}>
                    {errors[errorKey(index, 'startDate')]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId={`work-${index}-endDate`}>
                  <Form.Label>End date (optional)</Form.Label>
                  <Form.Control
                    type="date"
                    value={row.endDate}
                    onChange={(e) => onChange(index, 'endDate', e.target.value)}
                    disabled={disabled}
                    isInvalid={!!errors[errorKey(index, 'endDate')]}
                    aria-describedby={
                      errors[errorKey(index, 'endDate')] ? `work-${index}-endDate-feedback` : undefined
                    }
                  />
                  <Form.Control.Feedback type="invalid" id={`work-${index}-endDate-feedback`}>
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
              Remove this experience
            </Button>
          </Card.Body>
        </Card>
      ))}
      <Button type="button" variant="outline-secondary" onClick={onAdd} disabled={disabled}>
        Add work experience
      </Button>
    </section>
  );
};

export default WorkExperienceFields;
