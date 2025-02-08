import React from 'react';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  type: 'voter' | 'admin';
}

export default function Layout({ children, type }: LayoutProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">E-Voting System</h2>
        </div>
        
        <nav className="space-y-2">
          {type === 'voter' ? (
            <>
              <Link to="/voter/guidelines" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Voting Guidelines
              </Link>
              <Link to="/voter/registration" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Voter Registration
              </Link>
              <Link to="/voter/voting-area" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Voting Area
              </Link>
              <Link to="/voter/results" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Results
              </Link>
            </>
          ) : (
            <>
              <Link to="/admin/candidates" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Candidate Details
              </Link>
              <Link to="/admin/add-candidate" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Add Candidate
              </Link>
              <Link to="/admin/register" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Register
              </Link>
              <Link to="/admin/change-state" className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg">
                Change State
              </Link>
            </>
          )}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center px-4 py-2 hover:bg-indigo-700 rounded-lg w-full text-left"
          >
            <LogOut className="mr-2" size={18} />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100">
        <main className="p-8">
          {children}
        </main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="mb-4">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}