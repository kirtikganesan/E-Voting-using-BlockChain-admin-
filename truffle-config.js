module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",
        port: 7545, // Change this if using a different port in Ganache
        network_id: "*", // Matches any network
      },
    },
    compilers: {
      solc: {
        version: "0.8.19", // Update this to match your Solidity version
      },
    },
  };
  