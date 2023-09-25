// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * users have to pay to mint an NFT
 * the owner of the contract can withdraw the ETH
 *
 * minting NFT triggers a Chainlink VRF call to get a random number
 * using that random number, we will generate a random NFT (pug, shiba, or st bernard)
 *
 * Pug is super rare (10% chance)
 * Shiba is medium rare (30% chance)
 * St Bernard is common (60% chance)
 *
 */

error RandomIpfsNft_RangeOutOfBounds();
error RandomIpfsNft_InsufficientETHSent();
error RandomIpfsNft_WithdrawFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // Type Declarations
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint256 internal i_mintFee;

    // Events
    event NftRequested(uint256 requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    // https://docs.chain.link/vrf/v2/subscription/examples/get-a-random-number
    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mintFee;
    }

    // STEP 1: RandomIpfsNft sends request to chainlink oracle for random number
    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft_InsufficientETHSent();
        }
        // Will revert if subscription is not set and funded.
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, i_subscriptionId, REQUEST_CONFIRMATIONS, i_callbackGasLimit, NUM_WORDS
        );
        // keep track of who sent the request
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    // STEP 2: Chainlink oracles calls this function to deliver the random number
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        // grab the requester from the mapping so chainlink node doesnt get the NFT lulz
        address dogOwner = s_requestIdToSender[requestId];
        // what does NFT look like?
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE; // 0 - 99
        // 0 - 9 => pug (10%)
        // 10 - 39 => shiba (30%)
        // 40 - 99 => st bernard (60%)
        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, s_tokenCounter);
        _setTokenURI(s_tokenCounter, s_dogTokenUris[uint256(dogBreed)]);
        emit NftMinted(dogBreed, dogOwner);
        s_tokenCounter += 1;
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert RandomIpfsNft_WithdrawFailed();
    }

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        // moddedRng = 17
        // i = 1
        // cumulativeSum = 10
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }

        revert RandomIpfsNft_RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        // pug 10%, shiba 30%, st bernard 60%
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUris(uint256 index) public view returns (string memory) {
        return s_dogTokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    // function tokenURI(uint256) public override returns (string memory) {} // tokenURI() is implemented in ERC721URIStorage
}
