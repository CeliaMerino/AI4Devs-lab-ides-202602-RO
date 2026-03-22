import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';

describe('App', () => {
  it('renders recruiter dashboard with add candidate entry point', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /recruiter dashboard/i })).toBeInTheDocument();
    expect(screen.getByTestId('add-candidate-nav')).toHaveAttribute('href', '/recruiter/candidates/new');
  });
});
