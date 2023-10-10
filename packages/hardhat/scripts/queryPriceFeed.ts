import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import AggregatorV3InterfaceABI from "@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

  // https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1
  // ETH/USD on Sepolia
  const priceFeedContract = new ethers.Contract(
    "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    AggregatorV3InterfaceABI,
    provider,
  );

  console.log("priceFeedContract decimals()", await priceFeedContract.decimals());
  const data = await priceFeedContract.latestRoundData();
  console.log("Latest ETH/USD price", data.answer.toString());
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
