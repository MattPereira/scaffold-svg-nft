import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains } from "../helper-hardhat-config";
import { network } from "hardhat";

/**
 * Deploys mock contracts necessary for testing on local networks
 *
 * @param hre HardhatRuntimeEnvironment object.
 */

const deployMocks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;
  const { ethers } = hre;

  const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 is the premium. It costs 0.25 LINK per request
  const GAS_PRICE_LINK = 1e9; // calculated value based on the gas price of the chain
  const DECIMALS = "8";
  const INTIIAL_PRICE = ethers.utils.parseUnits("1579", 8);
  console.log("INITIAL_PRICE: ", INTIIAL_PRICE);

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    // deploy a mock vrf coordinator on local networks
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });
    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: [DECIMALS, INTIIAL_PRICE],
    });
    log("Mocks Deployed!");
    log("------------------------------------");
    const mockPriceFeed = await hre.ethers.getContract("MockV3Aggregator");
    const data = await mockPriceFeed.latestRoundData();
    console.log("mockPriceFeed Price: ", data.answer.toString());
    console.log("decimals()", await mockPriceFeed.decimals());
  }
};

export default deployMocks;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployMocks.tags = ["all", "mocks"];
