import React from 'react';
import axios from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCandidateForm from '../components/AddCandidateForm';
import * as candidateService from '../services/candidateService';

jest.mock('../services/candidateService', () => ({
  ...jest.requireActual('../services/candidateService'),
  createCandidate: jest.fn(),
  uploadResume: jest.fn(),
}));

describe('AddCandidateForm', () => {
  const mockCreate = candidateService.createCandidate as jest.MockedFunction<
    typeof candidateService.createCandidate
  >;
  const mockUpload = candidateService.uploadResume as jest.MockedFunction<
    typeof candidateService.uploadResume
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({
      id: 1,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: null,
      address: null,
    });
    mockUpload.mockResolvedValue({ filePath: 'uploads/f.pdf', fileType: 'application/pdf' });
  });

  it('submits minimal valid candidate without upload', async () => {
    render(<AddCandidateForm />);

    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/^email/i), 'jane.doe@example.com');

    await userEvent.click(screen.getByTestId('add-candidate-submit'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
    });
  });

  it('shows validation errors for empty required fields', async () => {
    render(<AddCandidateForm />);
    await userEvent.click(screen.getByTestId('add-candidate-submit'));
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('uploads CV then creates candidate when file selected', async () => {
    render(<AddCandidateForm />);

    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/^email/i), 'jane.doe@example.com');

    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText(/cv \(optional\)/i), file);

    await userEvent.click(screen.getByTestId('add-candidate-submit'));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      cv: { filePath: 'uploads/f.pdf', fileType: 'application/pdf' },
    });
  });

  it('displays API error message on failure', async () => {
    const axiosError = new axios.AxiosError('Request failed');
    axiosError.response = {
      status: 400,
      data: { message: 'A candidate with this email already exists' },
      statusText: 'Bad Request',
      headers: new axios.AxiosHeaders(),
      config: {} as never,
    };
    mockCreate.mockRejectedValueOnce(axiosError);
    render(<AddCandidateForm />);

    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/^email/i), 'taken@example.com');
    await userEvent.click(screen.getByTestId('add-candidate-submit'));

    expect(
      await screen.findByText(/a candidate with this email already exists/i)
    ).toBeInTheDocument();
  });
});
