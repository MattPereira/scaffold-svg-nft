import React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Spinner } from "~~/components/Spinner";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

interface NFTCardProps {
  tokenId: bigint;
  highValue: bigint;
}

interface Attribute {
  trait_type: string;
  value: number;
  pivot_price: number;
}

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Attribute[];
}

export const NFTCard = ({ tokenId, highValue }: NFTCardProps) => {
  const [nftMetadata, setNftMetadata] = useState<NftMetadata | null>(null);

  const { data: tokenURI, isLoading } = useScaffoldContractRead({
    contractName: "DynamicSvgNft",
    functionName: "tokenURI",
    args: [tokenId],
  });

  console.log("highValue", highValue);

  useEffect(() => {
    const requestURL = tokenURI?.replace("ipfs://", "https://ipfs.io/ipfs/");

    async function getImage() {
      if (requestURL) {
        try {
          const response = await (await fetch(requestURL)).json();
          if (response.image.startsWith("ipfs://"))
            response.image = response.image.replace("ipfs://", "https://ipfs.io/ipfs/");
          setNftMetadata(response);
        } catch (e) {
          console.log("error", e);
        }
      }
    }

    getImage();
  }, [tokenURI]);

  if (isLoading || !nftMetadata)
    return (
      <div className="flex justify-center items-center mt-8">
        <Spinner width="65" height="65" />
      </div>
    );

  const { name, description, image, attributes } = nftMetadata;
  console.log("attributes", attributes);

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure>
        <Image height="500" width="500" src={image} alt="Shoes" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">
          {name} #{tokenId.toString()}
        </h2>
        <p>{description}</p>
        <p>Pivot Price: {highValue.toString()}</p>
      </div>
    </div>
  );
};
