import React from 'react';
import Layout from '../../components/Layout';

export default function Guidelines() {
  return (
    <Layout type="voter">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Voting Guidelines</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">General Rules</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Each voter can only vote once</li>
              <li>Voters must be registered with their Aadhar number</li>
              <li>Voting is anonymous and secure</li>
              <li>Results will be published after the election period ends</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Voting Process</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Register using your Aadhar number and Ethereum wallet address</li>
              <li>Wait for registration confirmation</li>
              <li>Access the voting area during election period</li>
              <li>Select your preferred candidate</li>
              <li>Confirm your vote</li>
              <li>Receive confirmation of your vote being recorded</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Important Notes</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Keep your login credentials secure</li>
              <li>Do not share your voting choices with others</li>
              <li>Report any suspicious activity to the election commission</li>
              <li>Make sure you have a stable internet connection while voting</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}