interface NetworkConfigEntry {
  name?: string;
  vrfCoordinatorV2?: string;
  subscriptionId?: string;
  gasLane: string;
  callbackGasLimit: string;
  interval: string;
  mintFee: string;
  ethUsdPriceFeed?: string;
}

const networkConfig: { [key: number]: NetworkConfigEntry } = {
  11155111: {
    name: "sepolia",
    vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    subscriptionId: "4707", // vrf.chain.link/sepolia/4707
    gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    callbackGasLimit: "500000", // 500,000
    interval: "30",
    mintFee: "100000000000000000", // 0.1 ETH
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
  31337: {
    name: "hardhat",
    gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    interval: "30",
    callbackGasLimit: "500000", // 500,000 gas
    mintFee: "100000000000000000", // 0.1 ETH
  },
};

const developmentChains: string[] = ["hardhat", "localhost"];

export { networkConfig, developmentChains };
