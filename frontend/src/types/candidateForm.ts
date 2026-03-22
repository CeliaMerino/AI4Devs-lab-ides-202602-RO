export type EducationFormRow = {
  institution: string;
  title: string;
  startDate: string;
  endDate: string;
};

export type WorkExperienceFormRow = {
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate: string;
};

export type CandidateFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  educations: EducationFormRow[];
  workExperiences: WorkExperienceFormRow[];
};

export const emptyEducationRow = (): EducationFormRow => ({
  institution: '',
  title: '',
  startDate: '',
  endDate: '',
});

export const emptyWorkExperienceRow = (): WorkExperienceFormRow => ({
  company: '',
  position: '',
  description: '',
  startDate: '',
  endDate: '',
});

export const initialCandidateFormState = (): CandidateFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  educations: [],
  workExperiences: [],
});
