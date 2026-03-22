import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AddCandidateForm from '../components/AddCandidateForm';

const AddCandidatePage: React.FC = () => {
  return (
    <Container className="py-4">
      <p className="mb-3">
        <Link to="/">← Back to dashboard</Link>
      </p>
      <h1 className="mb-4">Add candidate</h1>
      <AddCandidateForm />
    </Container>
  );
};

export default AddCandidatePage;
