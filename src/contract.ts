import ContestContract from "../build/contracts/Contest.json";

// Function to get the latest contract address from Contract artifact
function getContractAddress() {
  try {
    // Access the networks object directly from the imported JSON
    const artifact = ContestContract;
    
    // Define the structure of the networks object for TypeScript
    interface NetworkInfo {
      address: string;
      transactionHash: string;
      events: Record<string, unknown>;
      links: Record<string, unknown>;
    }
    
    // Type cast the networks object
    const networks = artifact.networks as Record<string, NetworkInfo>;
    
    // Get the most recent network deployment
    const networkIds = Object.keys(networks);
    if (networkIds.length === 0) {
      console.error('Contract has not been deployed yet');
      // Instead of throwing an error, return the last known working address
      return "0xD1E00a3cC1CA59fcbfEff292C0c952fd11FAF157";
    }
    
    // Get the latest network ID (usually the highest number)
    const latestNetworkId = networkIds.sort((a, b) => parseInt(b) - parseInt(a))[0];
    
    // Get the address from the latest deployment
    const contractAddress = networks[latestNetworkId].address;
    
    console.log(`Using contract address: ${contractAddress}`);
    return contractAddress;
  } catch (error) {
    console.error('Error getting contract address:', error);
    // Return the fallback address instead of null
    return "0xD1E00a3cC1CA59fcbfEff292C0c952fd11FAF157";
  }
}

// Get the contract address dynamically
const contractAddress = getContractAddress();

export default contractAddress;