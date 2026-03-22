import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const RecruiterDashboard: React.FC = () => {
  return (
    <Container className="py-5">
      <h1 className="mb-4">Recruiter dashboard</h1>
      <Link
        className="btn btn-primary"
        to="/recruiter/candidates/new"
        data-testid="add-candidate-nav"
      >
        Add candidate
      </Link>
    </Container>
  );
};

export default RecruiterDashboard;
