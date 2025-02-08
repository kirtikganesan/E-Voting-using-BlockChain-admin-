import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Guidelines from './pages/voter/Guidelines';
import Registration from './pages/voter/Registration';
import VotingArea from './pages/voter/VotingArea';
import Results from './pages/voter/Results';
import Candidates from './pages/admin/Candidates';
import AddCandidate from './pages/admin/AddCandidate';
import Register from './pages/admin/Register';
import ChangeState from './pages/admin/ChangeState';
import VoterRegister from './pages/VoterRegister';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login/:type" element={<Login />} />
        <Route path="/register" element={<VoterRegister />} />
        
        {/* Voter Routes */}
        <Route path="/voter/guidelines" element={<Guidelines />} />
        <Route path="/voter/registration" element={<Registration />} />
        <Route path="/voter/voting-area" element={<VotingArea />} />
        <Route path="/voter/results" element={<Results />} />
        
        {/* Admin Routes */}
        <Route path="/admin/candidates" element={<Candidates />} />
        <Route path="/admin/add-candidate" element={<AddCandidate />} />
        <Route path="/admin/register" element={<Register />} />
        <Route path="/admin/change-state" element={<ChangeState />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;