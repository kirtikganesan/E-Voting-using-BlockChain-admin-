export interface Candidate {
  id: number;
  name: string;
  age: number;
  qualification: string;
  party: string;
  votes: number;
}

export interface VoterRegistration {
  aadharNumber: string;
  accountAddress: string;
}