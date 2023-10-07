import { NFTCard } from "./NFTCard";
import type { NextPage } from "next";
import { parseUnits } from "viem";
import { MetaHeader } from "~~/components/MetaHeader";
import { Spinner } from "~~/components/Spinner";
import { useScaffoldContractWrite, useScaffoldEventHistory } from "~~/hooks/scaffold-eth/";

const Home: NextPage = () => {
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

  const {
    writeAsync: mint,
    // isLoading,
    // isMining,
  } = useScaffoldContractWrite({
    contractName: "DynamicSvgNft",
    functionName: "mintNft",
    args: [parseUnits("1700", 8)],
    // The number of block confirmations to wait for before considering transaction to be confirmed (default : 1).
    blockConfirmations: 1,
    // The callback function to execute when the transaction is confirmed.
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
      console.log("Transaction Receipt", txnReceipt);
    },
  });

  console.log(parseUnits("420", 8));

  console.log("events", events);
  return (
    <div className="container mx-auto">
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-14">
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
