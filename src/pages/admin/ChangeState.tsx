import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { ethers } from "ethers";
import axios from "axios"; // Added import for axios
import contractABI from "../../../build/contracts/Contest.json";

const CONTRACT_ADDRESS = "0x6cEadf33166b097604372E1AE3ae84A51fE7A57D"; // Replace with deployed contract address

type ElectionState = "registration" | "voting" | "results";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newState: ElectionState;
}

function ConfirmModal({ isOpen, onClose, onConfirm, newState }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Confirm Phase Change</h3>
        <p className="mb-4">
          Are you sure you want to change the election phase to{" "}
          <span className="font-semibold capitalize">{newState}</span>?
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Yes, Change Phase
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChangeState() {
  const [currentState, setCurrentState] = useState<ElectionState | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingState, setPendingState] = useState<ElectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchElectionData() {
      try {
        if (!window.ethereum) {
          console.error("MetaMask is not installed.");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, provider);

        // Fetch current election phase
        const phaseIndex = await contract.getCurrentPhase();
        setCurrentState(["registration", "voting", "results"][Number(phaseIndex)] as ElectionState);

        // Fetch admin address from contract
        const admin = await contract.admin();
        setAdminAddress(admin.toLowerCase());

        // Fetch connected user address
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());
      } catch (error) {
        console.error("Error fetching election data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchElectionData();
  }, []);

  const handleStateChangeRequest = (state: ElectionState) => {
    if (state === currentState) return;
    if (userAddress !== adminAddress) {
      alert("Only the admin can change the phase.");
      return;
    }
    setPendingState(state);
    setShowConfirmModal(true);
  };

  const handleConfirmStateChange = async () => {
    if (!pendingState || !window.ethereum) return;
    setIsChangingPhase(true);
    setStatusMessage("Initiating blockchain transaction...");
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

      const phaseMapping = {
        registration: 0,
        voting: 1,
        results: 2,
      };
      
      setStatusMessage("Please confirm the transaction in your wallet...");
      const tx = await contract.changePhase(phaseMapping[pendingState]);
      
      setStatusMessage("Transaction submitted. Waiting for confirmation...");
      await tx.wait();

      // After blockchain transaction is successful, update the database
      setStatusMessage("Updating database...");
      try {
        const response = await axios.post("/api/election-phase", {
          phase: pendingState
        });
        
        if (response.status === 200) {
          setStatusMessage("Phase updated successfully both on blockchain and in database!");
          setCurrentState(pendingState);
        } else {
          setStatusMessage("Warning: Blockchain updated but database update may have failed.");
        }
      } catch (dbError) {
        console.error("Database update error:", dbError);
        setStatusMessage("Warning: Phase changed on blockchain, but database update failed.");
        // Still update the UI state since the blockchain change was successful
        setCurrentState(pendingState);
      }
    } catch (error) {
      console.error("Error changing phase:", error);
      setStatusMessage("Transaction failed. Please try again.");
    } finally {
      setPendingState(null);
      setShowConfirmModal(false);
      setIsChangingPhase(false);
      
      // Clear status message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    }
  };

  return (
    <Layout type="admin">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Change Election State</h1>

        {statusMessage && (
          <div className="bg-blue-100 text-blue-700 p-4 rounded-md mb-6">
            {statusMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Current State:{" "}
                  <span className="ml-2 text-indigo-600 font-semibold capitalize">{currentState}</span>
                </h2>
              </div>

              <div className="space-y-4">
                {(["registration", "voting", "results"] as ElectionState[]).map((state) => (
                  <button
                    key={state}
                    onClick={() => handleStateChangeRequest(state)}
                    className={`w-full py-3 px-4 rounded-md text-sm font-medium ${
                      currentState === state
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                    disabled={isChangingPhase}
                  >
                    {isChangingPhase && pendingState === state ? "Changing..." : state.charAt(0).toUpperCase() + state.slice(1) + " Phase"}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Phase Description:</h3>
                <p className="text-sm text-gray-600">
                  {currentState === "registration" && "Candidates can be registered during this phase."}
                  {currentState === "voting" && "Voters can cast their votes during this phase."}
                  {currentState === "results" && "Voting has ended and results are being displayed."}
                </p>
              </div>
            </div>
          
        </div>

        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setPendingState(null);
          }}
          onConfirm={handleConfirmStateChange}
          newState={pendingState || "registration"}
        />
      </div>
    </Layout>
  );
}