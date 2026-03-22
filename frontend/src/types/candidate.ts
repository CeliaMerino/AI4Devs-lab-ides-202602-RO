export type CreateResumeRequest = {
  filePath: string;
  fileType: string;
};

export type CreateEducationRequest = {
  institution: string;
  title: string;
  startDate: string;
  endDate?: string | null;
};

export type CreateWorkExperienceRequest = {
  company: string;
  position: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
};

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

export type CreateCandidateResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
};

export type FileUploadResponse = {
  filePath: string;
  fileType: string;
};

export type ErrorResponse = {
  message: string;
  error?: string;
};
