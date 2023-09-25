import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { network, ethers } from "hardhat";
import { storeImages, storeTokenUriMetadata } from "../scripts/uploadToPinata";

const relativePathToImages = "./images/randomNft";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};

let TOKEN_URIS = [
  "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
  "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
  "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
];

const FUND_AMOUNT = ethers.utils.parseUnits("10", "ether");

/**
 * Deploys a contract named "RandomIpfsNft" using the deployer account
 *
 * OPTIONS FOR IPFS STORAGE:
 * 1. with our own IPFS node -> https://docs.ipfs.tech/
 * 2. pinata -> https://docs.pinata.cloud/docs
 * 3. nft.storage -> https://nft.storage/docs/
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployRandomNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;
  const { ethers } = hre;

  //   const chainId = network.config.chainId;
  const chainId = await hre.ethers.provider.getNetwork().then(network => network.chainId);
  console.log(`The current chain ID is: ${chainId}`);

  log("------------------------------------");

  // get the IPFS hashes of our images
  if (process.env.UPLOAD_TO_PINATA == "true") {
    TOKEN_URIS = await handleTokenUris();
  }

  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    // https://github.com/smartcontractkit/chainlink/blob/157870fcb6934c160b669c17030fa5f79cf65fbd/contracts/src/v0.8/vrf/VRFCoordinatorV2.sol#L667
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId.toString(); // grab subId from the event logs of .createSubscription()
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].callbackGasLimit,
    TOKEN_URIS,
    networkConfig[chainId].mintFee,
  ];

  const randomNft = await deploy("RandomIpfsNft", {
    from: deployer,
    // Contract constructor arguments
    args: args,
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // For testing on local network, add nft contract as a valid consumer of the VRFCoordinatorV2Mock contract
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomNft.address);
  }

  // HOW TO VERIFY : https://docs.scaffoldeth.io/deploying/deploy-smart-contracts#4-verify-your-smart-contract
};

export default deployRandomNft;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployRandomNft.tags = ["random", "all"];

/**
 * @returns {string[]} an array of IPFS hashes to upload to the RandomIpfsNft contract
 */
async function handleTokenUris() {
  TOKEN_URIS = [];
  // store the image in IPFS
  // store the metadata in IPFS

  const { responses: imageUploadResponses, files } = await storeImages(relativePathToImages);
  for (const imageUploadResponseIndex in imageUploadResponses) {
    // create metadata
    //upload the metadata
    const tokenUriMetadata = { ...metadataTemplate };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", ""); // pug.png -> pug, st-bernard.png -> st-bernard, etc.
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name} metadata...`);
    // store the JSON to pinata / IPFS
    const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
    if (metadataUploadResponse) {
      TOKEN_URIS.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
    } else {
      // Handle the case where metadataUploadResponse is null (maybe log an error or continue to the next iteration)
      console.error(`Failed to upload metadata for ${tokenUriMetadata.name}`);
    }
  }
  console.log("Token URIs Uploaded! They are:");
  console.log(TOKEN_URIS);
  return TOKEN_URIS;
}
