//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import '@openzeppelin/contracts/access/Ownable.sol';
import './NftFactory.sol';
import './interfaces/IBridge.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

contract Bridge is NftFactory, IBridge, IERC721Receiver, Ownable {
	mapping(address => bool) original;

	// targetNetworkId => trustedRemote
	mapping(uint256 => address) public trustedRemote;

	mapping(address => bool) public isOriginalChainForCollection;

	/* EVENTS */
	event NFTReceived(address operator, address from, uint256 tokenId, bytes data);

	event NFTBridged(address originalCollectionAddress, uint256 tokenId, string tokenURI, address owner);

	event NFTReturned(address originalCollectionAddress, uint256 tokenId, address owner);

	event MessageSend(address collection, string name, string symbol, uint256 tokenId, string tokenURI, address owner);

	event MessageReceived(
		address collection,
		string name,
		string symbol,
		uint256 tokenId,
		string tokenURI,
		address owner
	);

	event TrustedRemoteSet(uint256 targetNetworkId, address trustedRemote);

	function bridge(address collectionAddr, uint256 tokenId, uint256 targetNetworkId) public {
		zONFT collection = zONFT(collectionAddr);

		address target = trustedRemote[targetNetworkId];
		string memory name = collection.name();
		string memory symbol = collection.symbol();
		string memory tokenURI = collection.tokenURI(tokenId);

		address originalCollectionAddress;

		if (isCopy[collectionAddr]) {
			//	NFT is copy - burn
			collection.burn(tokenId);
			originalCollectionAddress = originalCollectionAddresses[collectionAddr];
		} else {
			// Is original contract
			// Lock NFT on contract
			collection.safeTransferFrom(msg.sender, address(this), tokenId);
			isOriginalChainForCollection[collectionAddr] = true;
			originalCollectionAddress = collectionAddr;
		}

		IBridge(target).lzReceive(originalCollectionAddress, name, symbol, tokenId, tokenURI, msg.sender);

		emit MessageSend(originalCollectionAddress, name, symbol, tokenId, tokenURI, msg.sender);
	}

	function lzReceive(
		address originalCollectionAddr,
		string calldata name,
		string calldata symbol,
		uint256 tokenId,
		string calldata tokenURI,
		address _owner
	) public {
		bool isOriginalChain = isOriginalChainForCollection[originalCollectionAddr];

		if (isOriginalChain) {
			// Unlock NFT and return to owner
			zONFT(originalCollectionAddr).safeTransferFrom(address(this), _owner, tokenId);

			emit NFTReturned(originalCollectionAddr, tokenId, _owner);
		} else {
			bool isThereCopyContract = copy[originalCollectionAddr] != address(0);

			address collectionAddr;

			if (isThereCopyContract) {
				collectionAddr = copy[originalCollectionAddr];
			} else {
				collectionAddr = _deployNewNft(originalCollectionAddr, name, symbol);
			}

			zONFT(collectionAddr).mint(_owner, tokenId, tokenURI);

			emit NFTBridged(originalCollectionAddr, tokenId, tokenURI, _owner);
		}

		emit MessageReceived(originalCollectionAddr, name, symbol, tokenId, tokenURI, _owner);
	}

	function setTrustedRemote(uint256 targetNetworkId, address trustedRemoteAddr) public onlyOwner {
		trustedRemote[targetNetworkId] = trustedRemoteAddr;

		emit TrustedRemoteSet(targetNetworkId, trustedRemoteAddr);
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
}
