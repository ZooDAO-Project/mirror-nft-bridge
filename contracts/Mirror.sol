//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import '@openzeppelin/contracts/access/Ownable.sol';
import './ReflectionCreator.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@layerzerolabs/solidity-examples/contracts/token/onft/ONFT721Core.sol';
import '@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol';

contract Mirror is NonblockingLzApp, ReflectionCreator, IERC721Receiver {
	uint256 public reflectionAmountLimit = 10;

	mapping(address => bool) public isOriginalChainForCollection;

	mapping(address => bool) public isEligibleCollection;

	/* EVENTS */
	event NFTReceived(address operator, address from, uint256 tokenId, bytes data);

	event NFTBridged(address originalCollectionAddress, uint256[] tokenIds, string[] tokenURIs, address owner);

	event NFTReturned(address originalCollectionAddress, uint256[] tokenIds, address owner);

	event BridgeNFT(
		address collection,
		string name,
		string symbol,
		uint256[] tokenId,
		string[] tokenURI,
		address owner
	);

	constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {}

	function estimateSendFee(
		address collection,
		uint tokenId,
		uint16 targetNetworkId,
		bool useZro,
		bytes memory adapterParams
	) public view returns (uint nativeFee, uint zroFee) {
		return estimateSendBatchFee(collection, _toSingletonArray(tokenId), targetNetworkId, useZro, adapterParams);
	}

	function estimateSendBatchFee(
		address collectionAddr,
		uint[] memory tokenIds,
		uint16 targetNetworkId,
		bool useZro,
		bytes memory adapterParams
	) public view returns (uint nativeFee, uint zroFee) {
		ReflectedNFT collection = ReflectedNFT(collectionAddr);

		string memory name = collection.name();
		string memory symbol = collection.symbol();

		string[] memory tokenURIs = new string[](tokenIds.length);

		for (uint256 i = 0; i < tokenIds.length; i++) {
			string memory tokenURI = collection.tokenURI(tokenIds[i]);
			tokenURIs[i] = tokenURI;
		}

		bytes memory payload = abi.encode(collection, name, symbol, tokenIds, tokenURIs, msg.sender);

		return lzEndpoint.estimateFees(targetNetworkId, address(this), payload, useZro, adapterParams);
	}

	function createReflection(
		address collectionAddr,
		uint256[] memory tokenIds,
		uint16 targetNetworkId,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes memory _adapterParams
	) public payable {
		require(isEligibleCollection[collectionAddr], 'Mirror: collection is not eligible to make reflection of');
		require(tokenIds.length > 0, "Mirror: tokenIds wern't provided");
		require(tokenIds.length <= reflectionAmountLimit, "Mirror: can't reflect more than limit");

		ReflectedNFT collection = ReflectedNFT(collectionAddr);

		string memory name = collection.name();
		string memory symbol = collection.symbol();

		string[] memory tokenURIs = new string[](tokenIds.length);

		for (uint256 i = 0; i < tokenIds.length; i++) {
			string memory tokenURI = collection.tokenURI(tokenIds[i]);
			tokenURIs[i] = tokenURI;
		}

		address originalCollectionAddress;

		if (isReflection[collectionAddr]) {
			//	NFT is reflection - burn

			for (uint256 i = 0; i < tokenIds.length; i++) {
				collection.burn(msg.sender, tokenIds[i]);
			}

			originalCollectionAddress = originalCollectionAddresses[collectionAddr];
		} else {
			// Is original contract
			// Lock NFT on contract

			for (uint256 i = 0; i < tokenIds.length; i++) {
				collection.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
			}

			isOriginalChainForCollection[collectionAddr] = true;
			originalCollectionAddress = collectionAddr;
		}

		bytes memory _payload = abi.encode(originalCollectionAddress, name, symbol, tokenIds, tokenURIs, msg.sender);

		_lzSend(targetNetworkId, _payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);

		emit BridgeNFT(originalCollectionAddress, name, symbol, tokenIds, tokenURIs, msg.sender);
	}

	function _nonblockingLzReceive(uint16, bytes memory, uint64, bytes memory payload) internal virtual override {
		(
			address originalCollectionAddr,
			string memory name,
			string memory symbol,
			uint256[] memory tokenIds,
			string[] memory tokenURIs,
			address _owner
		) = abi.decode(payload, (address, string, string, uint256[], string[], address));

		_reflect(originalCollectionAddr, name, symbol, tokenIds, tokenURIs, _owner);
	}

	function _reflect(
		address originalCollectionAddr,
		string memory name,
		string memory symbol,
		uint256[] memory tokenIds,
		string[] memory tokenURIs,
		address _owner
	) internal {
		bool isOriginalChain = isOriginalChainForCollection[originalCollectionAddr];

		if (isOriginalChain) {
			// Unlock NFT and return to owner

			for (uint256 i = 0; i < tokenIds.length; i++) {
				ReflectedNFT(originalCollectionAddr).safeTransferFrom(address(this), _owner, tokenIds[i]);
			}

			emit NFTReturned(originalCollectionAddr, tokenIds, _owner);
		} else {
			bool isThereReflectionContract = reflection[originalCollectionAddr] != address(0);

			address collectionAddr;

			if (isThereReflectionContract) {
				collectionAddr = reflection[originalCollectionAddr];
			} else {
				collectionAddr = _deployReflection(originalCollectionAddr, name, symbol);
			}

			isEligibleCollection[collectionAddr] = true;

			for (uint256 i = 0; i < tokenIds.length; i++) {
				ReflectedNFT(collectionAddr).mint(_owner, tokenIds[i], tokenURIs[i]);
			}

			emit NFTBridged(originalCollectionAddr, tokenIds, tokenURIs, _owner);
		}
	}

	function changeCollectionEligibility(address collection, bool eligibility) external onlyOwner {
		isEligibleCollection[collection] = eligibility;
	}

	function changeReflectionAmountLimit(uint256 newReflectionAmountLimit) external onlyOwner {
		reflectionAmountLimit = newReflectionAmountLimit;
	}

	/**
	 * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
	 * by `operator` from `from`, this function is called.
	 *
	 * It must return its Solidity selector to confirm the token transfer.
	 * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
	 *
	 * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
	 */
	function onERC721Received(
		address operator,
		address from,
		uint256 tokenId,
		bytes calldata data
	) external returns (bytes4) {
		emit NFTReceived(operator, from, tokenId, data);
		return IERC721Receiver.onERC721Received.selector;
	}

	function _toSingletonArray(uint element) internal pure returns (uint[] memory) {
		uint[] memory array = new uint[](1);
		array[0] = element;
		return array;
	}
}
