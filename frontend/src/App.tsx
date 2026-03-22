import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AddCandidatePage from './pages/AddCandidatePage';
import RecruiterDashboard from './pages/RecruiterDashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RecruiterDashboard />} />
      <Route path="/recruiter/candidates/new" element={<AddCandidatePage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
