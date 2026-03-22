import React from 'react';
import { Form, ProgressBar } from 'react-bootstrap';

type CvUploadFieldProps = {
  fileName: string | null;
  uploadProgress: number | null;
  error: string | undefined;
  disabled: boolean;
  onFileChange: (file: File | null) => void;
};

const CvUploadField: React.FC<CvUploadFieldProps> = ({
  fileName,
  uploadProgress,
  error,
  disabled,
  onFileChange,
}) => {
  return (
    <Form.Group className="mb-3" controlId="candidate-cv">
      <Form.Label>CV (optional)</Form.Label>
      <Form.Control
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={disabled}
        onChange={(e) => {
          const input = e.target as HTMLInputElement;
          const file = input.files?.[0] ?? null;
          onFileChange(file);
        }}
        isInvalid={!!error}
        aria-describedby={error ? 'candidate-cv-feedback' : 'candidate-cv-help'}
      />
      <Form.Text id="candidate-cv-help" muted>
        PDF or DOCX, maximum 10MB.
      </Form.Text>
      <Form.Control.Feedback type="invalid" id="candidate-cv-feedback">
        {error}
      </Form.Control.Feedback>
      {fileName && (
        <p className="small mt-2 mb-1" aria-live="polite">
          Selected: {fileName}
        </p>
      )}
      {uploadProgress !== null && uploadProgress < 100 && (
        <ProgressBar
          now={uploadProgress}
          label={`${uploadProgress}%`}
          animated
          className="mt-2"
          aria-label="Upload progress"
        />
      )}
    </Form.Group>
  );
};

export default CvUploadField;
