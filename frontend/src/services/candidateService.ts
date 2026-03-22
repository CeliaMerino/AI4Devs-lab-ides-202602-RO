import axios, { type AxiosProgressEvent } from 'axios';
import type {
  CreateCandidateRequest,
  CreateCandidateResponse,
  ErrorResponse,
  FileUploadResponse,
} from '../types/candidate';

function getApiBaseUrl(): string {
  const url = process.env.REACT_APP_API_URL;
  if (!url || url.trim() === '') {
    return 'http://localhost:3010';
  }
  return url.replace(/\/$/, '');
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ErrorResponse | undefined;
    if (data && typeof data.message === 'string' && data.message.trim() !== '') {
      return data.message;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection and try again.';
    }
    return 'An unexpected error occurred. Please try again later.';
  }
  return 'An unexpected error occurred. Please try again later.';
}

export async function uploadResume(
  file: File,
  onUploadProgress?: (percent: number) => void
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post<FileUploadResponse>(
    `${getApiBaseUrl()}/upload`,
    formData,
    {
      onUploadProgress: (e: AxiosProgressEvent) => {
        if (e.total && onUploadProgress) {
          onUploadProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );
  return data;
}

export async function createCandidate(
  body: CreateCandidateRequest
): Promise<CreateCandidateResponse> {
  const { data } = await axios.post<CreateCandidateResponse>(
    `${getApiBaseUrl()}/candidates`,
    body,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return data;
}
