import pinataSDK from "@pinata/sdk";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

// STEP 1: store the images in IPFS
// STEP 2: store the tokenURI metadata in IPFS (inludes the IPFS hashes of the images from step 1)

/**
 * @param {string} relativePathToImages
 *
 * @dev uploads images from local folder to pinata
 * @docs https://docs.pinata.cloud/docs/pinata-sdk#pinfiletoipfs
 *
 * @returns
 */
async function storeImages(relativePathToImages: string) {
  const fullImagesPath = path.resolve(relativePathToImages);
  const files = fs.readdirSync(fullImagesPath);
  const responses = [];
  console.log("Uploading to IPFS...");
  for (const file of files) {
    console.log(`Uploading ${file}...`);
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${file}`);
    try {
      const options = {
        pinataMetadata: {
          name: file,
        },
      };

      const response = await pinata.pinFileToIPFS(readableStreamForFile, options);
      responses.push(response);
    } catch (e) {
      console.log(e);
    }
  }

  return { responses, files };
}

interface Attribute {
  trait_type: string;
  value: number;
}

interface Metadata {
  name: string;
  description: string;
  image: string;
  attributes: Attribute[];
}

async function storeTokenUriMetadata(metadata: Metadata) {
  try {
    const options = {
      pinataMetadata: {
        name: `${metadata.name}-metadata.json`,
      },
    };

    const response = await pinata.pinJSONToIPFS(metadata, options);
    console.log("response", response);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

export { storeImages, storeTokenUriMetadata };
