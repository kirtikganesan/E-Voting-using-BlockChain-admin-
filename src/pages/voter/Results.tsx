import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../components/Layout";

type Winner = {
  name: string;
  votes: number;
};

export default function Results() {
  const [isElectionOver, setIsElectionOver] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    axios.get("/api/election-results")
      .then((response) => {
        if (response.data.isElectionOver) {
          setIsElectionOver(true);
          setWinner(response.data.winner);
        } else {
          setIsElectionOver(false);
        }
      })
      .catch(() => {
        setErrorMessage("Failed to fetch election results.");
      });
  }, []);

  return (
    <Layout type="voter">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Election Results</h1>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {isElectionOver ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Winner Announced!</h2>
              <div className="p-8 bg-indigo-50 rounded-lg">
                <h3 className="text-xl font-bold text-indigo-900">{winner?.name}</h3>
                <p className="text-indigo-600 mt-4">Total Votes: {winner?.votes}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-700">
                Election is still in progress
              </h2>
              <p className="text-gray-500 mt-2">
                Results will be displayed once the election period is over.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
