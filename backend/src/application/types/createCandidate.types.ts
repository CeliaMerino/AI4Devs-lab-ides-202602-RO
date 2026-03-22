export interface CreateEducationInput {
  institution: string;
  title: string;
  startDate: Date;
  endDate?: Date;
}

export interface CreateWorkExperienceInput {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface CreateResumeInput {
  filePath: string;
  fileType: string;
}

export interface CreateCandidateValidated {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  educations: CreateEducationInput[];
  workExperiences: CreateWorkExperienceInput[];
  cv?: CreateResumeInput;
}

export interface CreateCandidateResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
}
