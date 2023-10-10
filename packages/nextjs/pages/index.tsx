import { useState } from "react";
import { NFTCard } from "./NFTCard";
import type { NextPage } from "next";
import { parseUnits } from "viem";
import { MetaHeader } from "~~/components/MetaHeader";
import { Spinner } from "~~/components/Spinner";
import { InputBase } from "~~/components/scaffold-eth/Input/InputBase";
import {
  useScaffoldContractRead,
  useScaffoldContractWrite,
  useScaffoldEventHistory,
  useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth/";

const Home: NextPage = () => {
  const [priceInput, setPriceInput] = useState("");

  const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "DynamicSvgNft",
    eventName: "CreatedNFT",
    // Specify the starting block number from which to read events, this is a bigint.
    fromBlock: 0n,
    blockData: true,
    // Apply filters to the event based on parameter names and values { [parameterName]: value },
    // filters: { premium: true },
    // If set to true it will return the transaction data for each event (default: false),
    transactionData: true,
    // If set to true it will return the receipt data for each event (default: false),
    receiptData: true,
  });

  // event subscriber does not trigger a re-render????
  useScaffoldEventSubscriber({
    contractName: "DynamicSvgNft",
    eventName: "CreatedNFT",
    // The listener function is called whenever a GreetingChange event is emitted by the contract.
    // Parameters emitted by the event can be destructed using the below example
    // for this example: event GreetingChange(address greetingSetter, string newGreeting, bool premium, uint256 value);
    listener: logs => {
      logs.map(log => {
        const { tokenId, highValue } = log.args;
        console.log(log.args);
        console.log("tokenId", tokenId);
        if (events) {
          events.push({ args: { tokenId, highValue } });
        }
        console.log("events", events);
      });
    },
  });

  const {
    writeAsync: mint,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "DynamicSvgNft",
    functionName: "mintNft",
    args: [parseUnits(priceInput, 8)], // matching chainlink's 8 decimals for ETH/USD price feed on sepolia
    // The number of block confirmations to wait for before considering transaction to be confirmed (default : 1).
    blockConfirmations: 1,
    // The callback function to execute when the transaction is confirmed.
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
      console.log("Transaction Receipt", txnReceipt);
    },
  });

  const { data: currentEthUsdPrice } = useScaffoldContractRead({
    contractName: "MockV3Aggregator",
    functionName: "latestAnswer",
  });

  return (
    <div className="container mx-auto">
      <MetaHeader />
      <div className="text-center my-14">
        <h4 className="text-3xl text-white">ETH/USD price: {currentEthUsdPrice?.toString()}</h4>
      </div>
      <div className="flex justify-center gap-4">
        <InputBase prefix="$" value={priceInput} onChange={val => setPriceInput(val)} />
        <button className="btn btn-primary" onClick={() => mint()}>
          mint
        </button>
      </div>
      <div className="flex">
        {isLoadingEvents ? (
          <div className="flex justify-center items-center mt-8">
            <Spinner width="65" height="65" />
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex justify-center items-center mt-8">
            <p>No events</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-14 mt-14">
            {" "}
            {events.map((event, index) => {
              const { tokenId, highValue } = event.args;
              return <NFTCard key={index} tokenId={tokenId} highValue={highValue} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
