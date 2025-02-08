import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
      }}
    >
      <div className="max-w-4xl mx-auto text-center text-white p-8">
        <h1 className="text-5xl font-bold mb-8">Welcome to E-Voting System</h1>
        <p className="text-xl mb-12">Secure, Transparent, and Efficient Digital Voting Platform</p>
        
        <div className="flex justify-center space-x-6">
          <button
            onClick={() => navigate('/login/voter')}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Voter Login
          </button>
          <button
            onClick={() => navigate('/login/admin')}
            className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}