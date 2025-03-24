import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Layout";
import { Candidate } from "../../types";
import { ethers } from "ethers";
import contractABI from "../../../build/contracts/Contest.json";
import contractAddress from "../../contract";

const CONTRACT_ADDRESS = contractAddress; // Updated to match your actual contract address

type ElectionPhase = "registration" | "voting" | "results";
type ContractWithFunctions = ethers.Contract & {
  vote: (candidateId: number) => Promise<ethers.ContractTransactionResponse>;
  hasVoted: (address: string) => Promise<boolean>;
  getCurrentPhase: () => Promise<number>;
  candidateExists?: (id: number) => Promise<boolean>; // Optional function to check if candidate exists
};

export default function VotingArea() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [electionPhase, setElectionPhase] = useState<ElectionPhase>("registration");
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ContractWithFunctions | null>(null);
  const [isTransactionProcessing, setIsTransactionProcessing] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Fetch candidates from your backend API
  const fetchCandidates = async () => {
    try {
      const response = await axios.get("/api/candidates");
      setCandidates(response.data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setErrorMessage("Failed to load candidates. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Check voter status from your backend API
  const checkVoterStatus = async (email: string) => {
    try {
      const response = await axios.get(`/api/voter-status?email=${email}`);
      if (response.data.hasVoted) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error("Error checking voter status:", error);
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setUserEmail(storedEmail);
      checkVoterStatus(storedEmail);
    }

    // Fetch election phase from your backend
    const fetchElectionPhase = async () => {
      try {
        const response = await axios.get("/api/election-phase");
        setElectionPhase(response.data.phase);
      } catch (error) {
        console.error("Error fetching election phase:", error);
      }
    };

    fetchElectionPhase();
    fetchCandidates();

    // Connect to MetaMask and setup contract
    const connectWallet = async () => {
      if (!window.ethereum) {
        setErrorMessage("MetaMask is not installed. Please install MetaMask to vote.");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const userAccount = accounts[0];
        setAccount(userAccount);

        // Setup contract instance with typed interface
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI.abi,
          provider
        ) as ContractWithFunctions;

        setContract(contractInstance);

        // Check if user has already voted on blockchain
        const votedStatus = await contractInstance.hasVoted(userAccount);
        if (votedStatus) {
          setHasVoted(true);
        }

        // Get current election phase from blockchain for verification
        try {
          const phaseIndex = await contractInstance.getCurrentPhase();
          const phases: ElectionPhase[] = ["registration", "voting", "results"];
          const contractPhase = phases[Number(phaseIndex)];

          if (contractPhase && contractPhase !== electionPhase) {
            console.warn(`Phase mismatch - Contract: ${contractPhase}, Backend: ${electionPhase}`);
          }
        } catch (phaseError) {
          console.error("Error getting contract phase:", phaseError);
        }
      } catch (error) {
        console.error("Wallet connection or contract error:", error);
        setErrorMessage("Failed to connect wallet or load contract data. Please try again.");
      }
    };

    connectWallet();
  }, []);

  const handleVote = (candidate: Candidate) => {
    if (!account) {
      alert("Please connect your MetaMask wallet first!");
      return;
    }

    if (hasVoted) {
      alert("You have already voted!");
      return;
    }

    if (electionPhase !== "voting") {
      alert("Voting is not allowed in the current phase!");
      return;
    }

    setSelectedCandidate(candidate);
  };

  const confirmVote = async () => {
    if (!selectedCandidate || !account || !contract) return;
    setLoading(true);
    setErrorMessage("");
    setIsTransactionProcessing(true);

    try {
      // Get signer for the transaction
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Connect the contract with signer to send transaction
      const contractWithSigner = contract.connect(signer) as ContractWithFunctions;

      // Optional: Check if candidate exists in contract if your contract has this function
      if (contractWithSigner.candidateExists) {
        try {
          const exists = await contractWithSigner.candidateExists(selectedCandidate.id);
          if (!exists) {
            throw new Error(`Candidate ID ${selectedCandidate.id} does not exist in the contract`);
          }
        } catch (checkError) {
          console.error("Error checking candidate existence:", checkError);
        }
      }

      // Before sending transaction, log what we're about to do
      console.log(`Sending vote transaction for candidate ${selectedCandidate.id} to contract ${CONTRACT_ADDRESS}`);

      // Try both ways to vote - with BigInt and with Number
      let tx: ethers.ContractTransactionResponse;
      try {
        // First attempt with BigInt conversion
        tx = await contractWithSigner.vote((selectedCandidate.id));
      } catch (bigIntError) {
        console.error("BigInt vote attempt failed:", bigIntError);

        // Second attempt without BigInt (regular number)
        tx = await contractWithSigner.vote(selectedCandidate.id);
      }

      setTransactionHash(tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        // Transaction successful - Update backend with vote information
        try {
          const response = await axios.post("/api/vote", {
            email: userEmail,
            candidateId: selectedCandidate.id,
            transactionHash: tx.hash
          });

          if (response.data && response.data.message) {
            // Update local state - increase the vote count for the selected candidate
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === selectedCandidate.id ? { ...c, votes: c.votes + 1 } : c
              )
            );
            setHasVoted(true);
            setShowSuccessModal(true); // Show success modal
          } else {
            console.warn("Backend response:", response.data);
          }
        } catch (backendError) {
          console.error("Backend update failed:", backendError);

          // Still update local UI even if backend fails
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === selectedCandidate.id ? { ...c, votes: c.votes + 1 } : c
            )
          );
          setHasVoted(true);
          setShowSuccessModal(true); // Show success modal
        }
      } else {
        throw new Error("Transaction failed or returned unexpected status");
      }
    } catch (error: any) {
      console.error("Vote error:", error);

      // Detailed error handling
      if (error?.code === "ACTION_REJECTED") {
        setErrorMessage("Transaction was rejected in MetaMask.");
      } else if (error?.message?.includes("execution reverted")) {
        setErrorMessage("Vote was rejected by the contract. This might happen if you've already voted or if the election is not in the voting phase.");
      } else {
        setErrorMessage(`Error submitting vote: ${error?.message || String(error)}`);
      }
    } finally {
      setLoading(false);
      setIsTransactionProcessing(false);
      setSelectedCandidate(null);
    }
  };

  return (
    <Layout type="voter">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Voting Area</h1>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        {/* Display connected wallet */}
        {account ? (
          <p className="text-green-600 font-semibold mb-4">Connected Wallet: {account}</p>
        ) : (
          <p className="text-red-600 font-semibold mb-4">Not connected to MetaMask</p>
        )}

        {/* Display transaction hash if available */}
        {transactionHash && (
          <p className="text-blue-600 text-sm mb-4">
            Transaction: {transactionHash.substring(0, 10)}...{transactionHash.substring(transactionHash.length - 10)}
          </p>
        )}

        {/* Current Phase Indicator */}
        <div className="mb-4 p-2 bg-blue-50 rounded">
          <p className="text-blue-800">Current Phase: <strong>{electionPhase}</strong></p>
        </div>

        {/* Display different UI based on election phase */}
        {electionPhase === "registration" && (
          <p className="text-xl font-semibold text-center text-gray-600">
            Registration phase is going on. Voting is not open yet.
          </p>
        )}

        {electionPhase === "results" && (
          <p className="text-xl font-semibold text-center text-gray-600">
            Elections are over. Check the results tab for more info.
          </p>
        )}

        {electionPhase === "voting" && (
          <div className="grid gap-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{candidate.name}</h2>
                    <div className="text-gray-600 space-y-1">
                      <p>ID: {candidate.id}</p>
                      <p>Age: {candidate.age}</p>
                      <p>Qualification: {candidate.qualification}</p>
                      <p>Party: {candidate.party}</p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      className={`px-4 py-2 text-white rounded ${
                        hasVoted || !account || electionPhase !== "voting"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      onClick={() => handleVote(candidate)}
                      disabled={hasVoted || !account || electionPhase !== "voting"}
                    >
                      Vote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status message when no candidates are available */}
        {candidates.length === 0 && (
          <p className="text-center text-gray-600 mt-8">
            {loading ? "Loading candidates..." : "No candidates available."}
          </p>
        )}
      </div>

      {/* Vote Confirmation Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">
              Confirm Your Vote
            </h2>
            <p className="mb-4">
              You are about to vote for <span className="font-semibold">{selectedCandidate.name}</span> (ID: {selectedCandidate.id}).
              This action will be recorded on the blockchain and cannot be changed.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setSelectedCandidate(null)}
                disabled={isTransactionProcessing}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-white rounded ${
                  isTransactionProcessing
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={confirmVote}
                disabled={isTransactionProcessing}
              >
                {isTransactionProcessing ? "Processing..." : "Confirm Vote"}
              </button>
            </div>

            {isTransactionProcessing && (
              <p className="text-sm text-gray-600 mt-4">
                Please confirm the transaction in your MetaMask wallet.
                This process might take a few moments to complete.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">
              Voted Successfully
            </h2>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
