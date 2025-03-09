import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axios from "axios";
import { ethers } from "ethers";

export default function Register() {
  const [accountAddress, setAccountAddress] = useState("");
  const [adminAddress, setAdminAddress] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState<
    { account_address: string; is_registered: string }[]
  >([]);

  useEffect(() => {
    fetchRegisteredUsers();
    getAdminAccount();
  }, []);

  // Fetch the registered users
  const fetchRegisteredUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/registered-users");
      setRegisteredUsers(response.data);
    } catch (error) {
      console.error("Error fetching registered users:", error);
    }
  };

  // Get the admin account from MetaMask
  const getAdminAccount = async () => {
    if (!window.ethereum) {
      setModalMessage("MetaMask is not installed. Please install MetaMask.");
      setShowModal(true);
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setAdminAddress(await signer.getAddress());
    } catch (error) {
      console.error("Error fetching admin account:", error);
    }
  };

  // Handle registration transaction
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!window.ethereum) {
      setModalMessage("MetaMask is not installed. Please install MetaMask.");
      setShowModal(true);
      return;
    }
  
    try {
      // Initialize provider & signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      // Set admin's account as the transaction payer
      const adminSigner = await provider.getSigner(); 
      const adminAddress = await adminSigner.getAddress();
      
      console.log("Admin Account:", adminAddress);
      console.log("User-entered Ethereum Address:", accountAddress);
  
      // Validate Ethereum address format
      if (!ethers.isAddress(accountAddress)) {
        setModalMessage("Invalid Ethereum address.");
        setShowModal(true);
        return;
      }
  
      // Debug admin balance before transaction
      const balance = await provider.getBalance(adminAddress);
      console.log("Admin Balance (ETH):", ethers.formatEther(balance));
  
      if (balance < ethers.parseEther("0.0016")) {
        setModalMessage("Admin has insufficient balance for network fees.");
        setShowModal(true);
        return;
      }
  
      // Initiating a blockchain transaction (gas fee is paid by admin)
      console.log("Initiating transaction...");
  
      const tx = await adminSigner.sendTransaction({
        to: adminAddress, // Self-transfer (just to initiate a transaction)
        value: ethers.parseEther("0"), // No ETH transferred, only gas used
      });
  
      console.log("Transaction Hash:", tx.hash);
      setModalMessage("Transaction initiated... Waiting for confirmation.");
      setShowModal(true);
  
      await tx.wait();
      console.log("Transaction Confirmed!");
  
      // Register the account after successful blockchain transaction
      const response = await axios.post("http://localhost:5000/api/register-admin", {
        accountAddress,
      });
  
      if (response.data.success) {
        setModalMessage("The voter account has been registered successfully!");
        fetchRegisteredUsers();
      } else {
        setModalMessage("Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Blockchain transaction error:", error);
  
      if (error.code === "ACTION_REJECTED") {
        setModalMessage("Transaction rejected by admin.");
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        setModalMessage("Admin has insufficient ETH balance.");
      } else {
        setModalMessage(`Error: ${error.message}`);
      }
    } finally {
      setShowModal(true);
    }
  };
  
  return (
    <Layout type="admin">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Register Admin Account</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="mb-4 text-gray-600">
            <strong>Admin Wallet:</strong> {adminAddress || "Not connected"}
          </p>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ethereum Account Address
              </label>
              <input
                type="text"
                value={accountAddress}
                onChange={(e) => setAccountAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                pattern="^0x[a-fA-F0-9]{40}$"
                title="Please enter a valid Ethereum address"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register (Admin Pays Fee)
            </button>
          </form>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Registration Status</h3>
              <p className="mb-4">{modalMessage}</p>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Table for registered users */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Registered Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Account Address</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Registered</th>
                </tr>
              </thead>
              <tbody>
                {registeredUsers.length > 0 ? (
                  registeredUsers.map((user, index) => (
                    <tr key={index} className="border-b">
                      <td className="border border-gray-300 px-4 py-2">{user.account_address}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {user.is_registered === "yes" ? "✅ Yes" : "❌ No"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No registered users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
