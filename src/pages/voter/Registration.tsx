import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axios from "axios";

export default function Registration() {
  const [aadharNumber, setAadharNumber] = useState("");
  const [accountAddress, setAccountAddress] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // Default to false

  // Check registration status when user enters an email
  useEffect(() => {
    if (userEmail) {
      axios
        .post("/api/check-registration", { email: userEmail })
        .then((response) => {
          if (response.data.is_registered === "yes") {
            setIsRegistered(true);
          }
        })
        .catch((error) => console.error("Error checking registration:", error));
    }
  }, [userEmail]); // Runs when userEmail changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/send-otp", { email: userEmail });
      if (response.status === 200) {
        setShowOtpInput(true);
        alert("OTP sent successfully!");
      } else {
        alert("Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Error sending OTP");
    }
  };

  const handleOtpVerification = () => {
    axios
      .post("/api/verify-otp", { email: userEmail, otp })
      .then((response) => {
        if (response.status === 200) {
          // Update registration status in database
          axios
            .post("/api/update-registration", { email: userEmail, accountAddress })
            .then(() => {
              setIsRegistered(true); // Set registered status
              alert("Registration successful!");
            })
            .catch((error) => console.error("Error updating registration:", error));
        }
      })
      .catch((error) => {
        console.error("Error verifying OTP:", error.response);
        alert("Invalid OTP, please try again!");
      });
  };

  if (isRegistered) {
    return (
      <Layout type="voter">
        <div className="max-w-2xl mx-auto text-center text-xl font-bold text-green-600">
          You have already registered
        </div>
      </Layout>
    );
  }

  return (
    <Layout type="voter">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Voter Registration</h1>
        <div className="bg-white rounded-lg shadow p-6">
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
        </div>
      </div>
    </Layout>
  );
}
