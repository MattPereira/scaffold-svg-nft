import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { network } from "hardhat";
import fs from "fs";

/**
 * Deploys a contract named "DynamicSvgNft" using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployDynamicSvgNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;
  const { ethers } = hre;

  //   const chainId = network.config.chainId;
  const chainId = await hre.ethers.provider.getNetwork().then(network => network.chainId);
  console.log(`The current chain ID is: ${chainId}`);

  let ethUsdPriceFeedAddress: string | undefined;

  if (developmentChains.includes(network.name)) {
    const EthUsdAggregator = await ethers.getContract("MockV3Aggregator");

    ethUsdPriceFeedAddress = EthUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
  }
  log("------------------------------------");
  const lowSVG = await fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf-8" });
  const highSVG = await fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf-8" });

  const args = [ethUsdPriceFeedAddress, lowSVG, highSVG];
  await deploy("DynamicSvgNft", {
    from: deployer,
    // Contract constructor arguments
    args: args,
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // * HOW TO VERIFY: https://docs.scaffoldeth.io/deploying/deploy-smart-contracts#4-verify-your-smart-contract
};

export default deployDynamicSvgNft;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployDynamicSvgNft.tags = ["dynamic", "all"];
