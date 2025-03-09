import React, { useState, useEffect } from "react";
import axios from "axios";

// Assuming Layout is a custom component you've created
import Layout from "../../components/Layout";

export default function Registration() {
  const [aadharNumber, setAadharNumber] = useState("");
  const [accountAddress, setAccountAddress] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Get email from localStorage instead of sessionStorage
  const [userEmail, setUserEmail] = useState("");
  
  useEffect(() => {
    // Get the email from localStorage instead of sessionStorage
    const email = localStorage.getItem("userEmail");
    console.log("Email from localStorage:", email); // Debug log
    
    if (email) {
      setUserEmail(email);
      
      // Check registration status when component loads
      axios
        .post("/api/check-registration", { email })
        .then((response) => {
          console.log("Registration check response:", response.data); // Debug log
          if (response.data.is_registered === "yes") {
            setIsRegistered(true);
          }
        })
        .catch((error) => {
          console.error("Error checking registration:", error);
          setErrorMessage("Error checking registration status");
        });
    } else {
      // Display a message if not logged in or email not found
      setErrorMessage("Please login first to register as a voter");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!userEmail) {
      setErrorMessage("Please login first to register");
      return;
    }
    
    try {
      // First verify the Aadhar number and age
      const aadharResponse = await axios.post("/api/verify-aadhar", { 
        aadharNumber 
      });
      
      if (!aadharResponse.data.exists) {
        setErrorMessage("Invalid Aadhar number. Please check and try again.");
        return;
      }
      
      if (aadharResponse.data.age < 18) {
        setErrorMessage("You must be at least 18 years old to register as a voter.");
        return;
      }
      
      // If Aadhar is valid and age is sufficient, send OTP
      const response = await axios.post("/api/send-otp", { email: userEmail });
      if (response.status === 200) {
        setShowOtpInput(true);
        alert("OTP sent successfully to your email!");
      } else {
        alert("Failed to send OTP");
      }
    } catch (error) {
      console.error("Error:", error);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.error || "An error occurred");
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    }
  };

  const handleOtpVerification = async () => {
    try {
      const response = await axios.post("/api/verify-otp", { 
        email: userEmail, 
        otp 
      });
      
      if (response.status === 200) {
        // Update registration status in database
        await axios.post("/api/update-registration", { 
          email: userEmail, 
          accountAddress,
          aadharNumber
        });
        
        setIsRegistered(true);
        alert("Registration successful!");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Invalid OTP, please try again!");
    }
  };

  return (
    <Layout type="voter">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Voter Registration</h1>
        <div className="bg-white rounded-lg shadow p-6">
          {isRegistered ? (
            <div className="text-center text-xl font-bold text-green-600">
              You have already registered
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {errorMessage}
                </div>
              )}
              
              <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
                Currently logged in as: {userEmail || "Not logged in"}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    pattern="[0-9]{12}"
                    title="Please enter a valid 12-digit Aadhar number"
                  />
                </div>
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
                <div className="text-sm text-gray-500 mb-4">
                  OTP will be sent to: {userEmail || "Please login first"}
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={!userEmail}
                >
                  Register
                </button>
              </form>
              {showOtpInput && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter OTP sent to your email
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleOtpVerification}
                    className="mt-4 w-full py-2 px-4 text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Verify OTP
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}