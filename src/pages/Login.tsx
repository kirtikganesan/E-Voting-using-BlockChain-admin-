import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { BrowserProvider } from 'ethers'; // ✅ Correct import for v6

// Fix: Declare MetaMask support in TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const navigate = useNavigate();
  const { type } = useParams();

  // Function to connect MetaMask
  const connectMetaMask = async (): Promise<string | null> => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" }); // Request MetaMask connection
        const signer = await provider.getSigner();
        const address = await signer.getAddress(); // Get wallet address

        console.log("Connected Wallet:", address);
        sessionStorage.setItem("adminWallet", address); // Store wallet address

        return address;
      } catch (error) {
        console.error("Error connecting MetaMask:", error);
        return null;
      }
    } else {
      alert("MetaMask is not installed. Please install it to continue.");
      return null;
    }
  };

  // Handle Admin & Voter Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'admin') {
      if (email === 'admin@gmail.com' && password === '123') {
        const address = await connectMetaMask();
        if (address) {
          setWalletAddress(address);
          localStorage.setItem("userEmail", email);
          navigate('/admin/candidates'); 
        }
      } else {
        setError('Invalid credentials');
      }
    } else if (type === 'voter') {
      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Invalid credentials');
        } else {
          localStorage.setItem("userEmail", email);
          navigate('/voter/guidelines'); 
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
        console.error(err);
      }
    } else {
      setError('Invalid user type');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          {type === 'voter' ? 'Voter Login' : 'Admin Login'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email" placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <input
              type="password" placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </button>
        </form>

        {walletAddress && (
          <div className="mt-4 text-green-600 text-center">
            Connected Wallet: <span className="font-semibold">{walletAddress}</span>
          </div>
        )}
        
        {type === 'voter' && (
          <div className="mt-4 text-center">
            <span>Not a user? </span>
            <Link to="/register" className="text-indigo-600 hover:underline">
              Register Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
