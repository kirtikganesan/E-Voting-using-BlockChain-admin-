import contractJson from '../../build/contracts/Contest.json';

export function getContractAddress(): string {
  const networks = contractJson.networks as Record<string, { address: string }>; // Type assertion
  const networkId = Object.keys(networks)[0] as keyof typeof networks; // Ensure TypeScript recognizes it
  return networks[networkId].address;
}
